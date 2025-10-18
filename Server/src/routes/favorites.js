const router = require("express").Router();
const { Types } = require("mongoose");
const auth = require("../middleware/auth");
const Favorite = require("../models/Favorite");
const Listing = require("../models/Listing");

// GET /api/favorites — список избранного пользователя
router.get("/", auth, async (req, res) => {
  try {
    const favs = await Favorite.find({ userId: req.user.id }).lean();
    const ids = favs
      .map((f) => f.listingId)
      .filter((id) => Types.ObjectId.isValid(id));
    const items = ids.length
      ? await Listing.find({ _id: { $in: ids } }).lean()
      : [];
    res.json(
      items.map((i) => ({
        ...i,
        id: i._id,
      }))
    );
  } catch (e) {
    console.error("FAVORITES_LIST_ERROR:", e?.message);
    res.status(500).json({ error: "Failed to load favorites" });
  }
});

// POST /api/favorites/:listingId — добавить в избранное
router.post("/:listingId", auth, async (req, res) => {
  try {
    const listingId = String(req.params.listingId);
    if (!Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ error: "Invalid listingId" });
    }
    // проверим, что объявление существует
    const exists = await Listing.exists({ _id: listingId });
    if (!exists) return res.status(404).json({ error: "Listing not found" });

    await Favorite.updateOne(
      { userId: req.user.id, listingId },
      { $setOnInsert: { userId: req.user.id, listingId } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (e) {
    // дубликат — это ок, мы уже в избранном
    if (e?.code === 11000) return res.json({ ok: true });
    console.error("FAVORITES_ADD_ERROR:", e?.message);
    res.status(500).json({ error: "Failed to add favorite" });
  }
});

// DELETE /api/favorites/:listingId — убрать из избранного
router.delete("/:listingId", auth, async (req, res) => {
  try {
    const listingId = String(req.params.listingId);
    if (!Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ error: "Invalid listingId" });
    }
    await Favorite.deleteOne({ userId: req.user.id, listingId });
    res.json({ ok: true });
  } catch (e) {
    console.error("FAVORITES_DELETE_ERROR:", e?.message);
    res.status(500).json({ error: "Failed to remove favorite" });
  }
});

module.exports = router;
