const router = require("express").Router();

const auth = require("../middleware/auth");
const Listing = require("../models/Listing");
const Report = require("../models/Report");

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

function parseSpecsFilter(value) {
  if (!value) return undefined;

  if (typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") return undefined;

  try {
    const parsed = JSON.parse(value);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return undefined;
    }

    return parsed;
  } catch {
    return undefined;
  }
}

router.get("/stats", async (req, res) => {
  try {
    const { cat } = req.query;

    if (!cat) {
      return res.status(400).json({
        error: "cat required",
      });
    }

    const stats = await Listing.statsByCategory(String(cat).trim());

    return res.json(stats);
  } catch (e) {
    console.error("LISTINGS_STATS_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load listing stats",
    });
  }
});

function listingQueryFromReq(query) {
  const {
    cat,
    subcategory,
    search,
    priceFrom,
    priceTo,
    specs,
    location,
    region,
    owner,
  } = query;

  return {
    cat: cat || undefined,
    subcategory: subcategory || undefined,
    search: search || undefined,
    priceFrom: priceFrom || undefined,
    priceTo: priceTo || undefined,
    specs: parseSpecsFilter(specs),
    location: location || undefined,
    region: location ? undefined : region || undefined,
    owner: owner || undefined,
  };
}

router.get("/count", async (req, res) => {
  try {
    const total = await Listing.count(listingQueryFromReq(req.query));

    return res.json({ total });
  } catch (e) {
    console.error("LISTINGS_COUNT_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to count listings",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const {
      photo,
      sort,
      limit,
      offset,
    } = req.query;

    const listings = await Listing.findAll({
      ...listingQueryFromReq(req.query),
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

router.get("/suggest", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const limit = Number(req.query.limit || 8);

    const items = await Listing.suggest(q, limit);

    return res.json(items);
  } catch (e) {
    console.error("LISTINGS_SUGGEST_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load suggestions",
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

router.post("/:id/view", async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        error: "Listing not found",
      });
    }

    const views = await Listing.incrementViews(req.params.id);

    return res.json({ views });
  } catch (e) {
    console.error("LISTING_VIEW_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to record view",
    });
  }
});

router.post("/:id/report", auth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        error: "Listing not found",
      });
    }

    if (String(listing.owner) === String(req.user.id)) {
      return res.status(400).json({
        error: "Cannot report your own listing",
      });
    }

    const reason = String(req.body?.reason || "").trim();
    const details = String(req.body?.details || "").trim();

    if (!Report.isValidReason(reason)) {
      return res.status(400).json({
        error: "Invalid report reason",
      });
    }

    if (reason === "other" && details.length < 5) {
      return res.status(400).json({
        error: "Please describe the issue",
      });
    }

    const report = await Report.create({
      listingId: req.params.id,
      reporterId: req.user.id,
      reason,
      details,
    });

    return res.status(201).json(report);
  } catch (e) {
    if (e?.message === "ALREADY_REPORTED") {
      return res.status(409).json({
        error: "You have already reported this listing",
      });
    }

    console.error("LISTING_REPORT_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to submit report",
    });
  }
});

async function updateListingOwnerStatus(req, res, status) {
  try {
    const listing = await Listing.updateOwnerStatus(
      req.params.id,
      req.user.id,
      status
    );

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

    if (e?.message === "INVALID_STATUS") {
      return res.status(400).json({
        error: "Invalid status",
      });
    }

    console.error("LISTING_STATUS_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to update listing status",
    });
  }
}

router.post("/:id/sold", auth, (req, res) =>
  updateListingOwnerStatus(req, res, "sold")
);

router.post("/:id/archive", auth, (req, res) =>
  updateListingOwnerStatus(req, res, "archived")
);

router.post("/:id/republish", auth, async (req, res) => {
  try {
    const listing = await Listing.republish(req.params.id, req.user.id);

    if (!listing) {
      return res.status(404).json({
        error: "Listing not found",
      });
    }

    return res.json(listing);
  } catch (e) {
    console.error("LISTING_REPUBLISH_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to republish listing",
    });
  }
});

router.post("/:id/promote", auth, async (req, res) => {
  try {
    const { type } = req.body || {};
    const listing = await Listing.promote(
      req.params.id,
      req.user.id,
      type
    );

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

    if (e?.message === "NOT_APPROVED") {
      return res.status(400).json({
        error: "Only approved listings can be promoted",
      });
    }

    if (e?.message === "INVALID_TYPE") {
      return res.status(400).json({
        error: "Invalid promotion type",
      });
    }

    if (e?.message === "INSUFFICIENT_BALANCE") {
      return res.status(402).json({
        error: "Insufficient balance",
      });
    }

    console.error("LISTING_PROMOTE_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to promote listing",
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

router.put("/:id", auth, async (req, res) => {
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
});

router.delete("/:id", auth, async (req, res) => {
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
});

module.exports = router;