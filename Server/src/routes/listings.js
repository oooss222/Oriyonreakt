const router = require("express").Router();

const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/role");
const Listing = require("../models/Listing");

function normalizeArray(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

router.get("/", async (req, res) => {
  try {
    const {
      cat,
      subcategory,
      search,
      priceFrom,
      priceTo,
      photo,
      sort,
      limit,
      offset,
    } = req.query;

    const listings = await Listing.findAll({
      cat: cat || undefined,
      subcategory: subcategory || undefined,
      search: search || undefined,
      priceFrom: priceFrom || undefined,
      priceTo: priceTo || undefined,
      photo: photo || undefined,
      sort: sort || "new",
      limit: Number(limit || 50),
      offset: Number(offset || 0),
    });

    return res.json(listings);
  } catch (e) {
    console.error("LISTINGS_GET_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load listings",
    });
  }
});

router.get("/mine", auth, async (req, res) => {
  try {
    const listings = await Listing.findByOwner(req.user.id);

    return res.json(listings);
  } catch (e) {
    console.error("LISTINGS_MINE_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load user listings",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        error: "Listing not found",
      });
    }

    return res.json(listing);
  } catch (e) {
    console.error("LISTING_GET_ONE_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load listing",
    });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const body = req.body || {};

    const title = String(body.title || "").trim();
    const cat = String(body.cat || "").trim();

    if (!title || !cat) {
      return res.status(400).json({
        error: "title and cat required",
      });
    }

    const listing = await Listing.create({
      title,
      price: String(body.price || "").trim(),
      description: String(body.description || "").trim(),
      location: String(body.location || "").trim(),
      cat,
      subcategory: String(body.subcategory || "").trim(),
      images: normalizeArray(body.images),
      specs: normalizeArray(body.specs),
      owner: req.user.id,
    });

    return res.status(201).json(listing);
  } catch (e) {
    console.error("LISTING_CREATE_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to create listing",
    });
  }
});

router.put(
  "/:id",
  auth,
  requireRole("moderator", "admin", "super_admin"),
  async (req, res) => {
    try {
      const body = req.body || {};

      const listing = await Listing.update(req.params.id, req.user.id, {
        title: body.title ? String(body.title).trim() : undefined,
        price: body.price ? String(body.price).trim() : undefined,
        description: body.description
          ? String(body.description).trim()
          : undefined,
        location: body.location ? String(body.location).trim() : undefined,
        cat: body.cat ? String(body.cat).trim() : undefined,
        subcategory: body.subcategory
          ? String(body.subcategory).trim()
          : undefined,
        images: body.images ? normalizeArray(body.images) : undefined,
        specs: body.specs ? normalizeArray(body.specs) : undefined,
      });

      if (!listing) {
        return res.status(404).json({
          error: "Listing not found",
        });
      }

      return res.json(listing);
    } catch (e) {
      if (e?.message === "FORBIDDEN") {
        return res.status(403).json({
          error: "Forbidden",
        });
      }

      console.error("LISTING_UPDATE_ERROR:", e?.message);

      return res.status(500).json({
        error: "Failed to update listing",
      });
    }
  }
);

router.delete(
  "/:id",
  auth,
  requireRole("moderator", "admin", "super_admin"),
  async (req, res) => {
    try {
      const deleted = await Listing.delete(req.params.id, req.user.id);

      if (!deleted) {
        return res.status(404).json({
          error: "Listing not found",
        });
      }

      return res.json({
        ok: true,
      });
    } catch (e) {
      if (e?.message === "FORBIDDEN") {
        return res.status(403).json({
          error: "Forbidden",
        });
      }

      console.error("LISTING_DELETE_ERROR:", e?.message);

      return res.status(500).json({
        error: "Failed to delete listing",
      });
    }
  }
);

module.exports = router;