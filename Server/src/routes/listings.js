const router = require("express").Router();
const { Types } = require("mongoose");
const Listing = require("../models/Listing");
const auth = require("../middleware/auth");

// GET /api/listings?cat=&q=&skip=&take=  — список с фильтрами
router.get("/", async (req, res) => {
  try {
    const { cat = "", q = "", skip = 0, take = 40 } = req.query;

    const where = {};
    if (cat) where.cat = String(cat).toLowerCase();
    if (q) where.title = { $regex: String(q), $options: "i" };

    const s = Math.max(0, parseInt(skip, 10) || 0);
    const t = Math.max(1, Math.min(100, parseInt(take, 10) || 40));

    const [items, total] = await Promise.all([
      Listing.find(where).sort({ createdAt: -1 }).skip(s).limit(t).lean(),
      Listing.countDocuments(where),
    ]);

    res.json({
      items: items.map((i) => ({ ...i, id: i._id })),
      total,
    });
  } catch (e) {
    console.error("LISTINGS_LIST_ERROR:", e?.message);
    res.status(500).json({ error: "Failed to load listings" });
  }
});

// ⚠️ ВАЖНО: /my ДОЛЖЕН БЫТЬ ВЫШЕ /:id
// GET /api/listings/my — мои объявления (нужен токен)
router.get("/my", auth, async (req, res) => {
  try {
    const items = await Listing.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(items.map((i) => ({ ...i, id: i._id })));
  } catch (e) {
    console.error("LISTINGS_MY_ERROR:", e?.message);
    res.status(500).json({ error: "Failed to load my listings" });
  }
});

// GET /api/listings/:id  — карточка
router.get("/:id", async (req, res) => {
  try {
    const id = String(req.params.id);
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const item = await Listing.findById(id).lean();
    if (!item) return res.status(404).json({ error: "Not found" });

    res.json({ ...item, id: item._id });
  } catch (e) {
    console.error("LISTINGS_ONE_ERROR:", e?.message);
    res.status(500).json({ error: "Failed to load listing" });
  }
});

// POST /api/listings — создать объявление (нужен токен)
router.post("/", auth, async (req, res) => {
  try {
    let { title, price, description, location, cat, images } = req.body || {};
    title = (title || "").trim();
    cat = (cat || "").trim().toLowerCase();
    description = (description || "").trim();
    location = (location || "").trim();
    price = (price || "").trim();

    if (!title || !cat) {
      return res.status(400).json({ error: "title and cat are required" });
    }

    const normImages = Array.isArray(images)
      ? images
          .filter(Boolean)
          .map((v) =>
            typeof v === "string"
              ? { url: v }
              : { url: v.url, alt: v.alt || "" }
          )
          .filter((x) => x.url && typeof x.url === "string")
      : [];

    const created = await Listing.create({
      title,
      price,
      description,
      location,
      cat,
      images: normImages,
      owner: req.user.id,
    });

    res.json({
      id: created._id,
      _id: created._id,
      title: created.title,
      price: created.price,
      description: created.description,
      location: created.location,
      cat: created.cat,
      images: created.images,
      owner: created.owner,
      createdAt: created.createdAt,
    });
  } catch (e) {
    console.error("LISTINGS_CREATE_ERROR:", e?.message);
    res.status(500).json({ error: "Failed to create listing" });
  }
});

// DELETE /api/listings/:id — удалить СВОЁ объявление
router.delete("/:id", auth, async (req, res) => {
  try {
    const id = String(req.params.id);
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).json({ error: "Not found" });

    if (String(listing.owner) !== String(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await listing.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    console.error("LISTINGS_DELETE_ERROR:", e?.message);
    res.status(500).json({ error: "Failed to delete listing" });
  }
});

module.exports = router;
