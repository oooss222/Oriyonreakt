const router = require("express").Router();

const auth = require("../middleware/auth");
const Listing = require("../models/Listing");
const Report = require("../models/Report");
const { assertImagesWithinLimit } = require("../lib/listingPhotoLimits");

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
    const { cat, location } = req.query;

    if (!cat) {
      return res.status(400).json({
        error: "cat required",
      });
    }

    const stats = await Listing.statsByCategory(
      String(cat).trim(),
      "approved",
      location ? String(location).trim() : ""
    );

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
    sellerType,
    areaFrom,
    areaTo,
    floorFrom,
    floorTo,
    floorNotFirst,
    floorNotLast,
    pricePerSqmFrom,
    pricePerSqmTo,
    guestsMin,
    yearFrom,
    yearTo,
    mileageFrom,
    mileageTo,
    onlyWithPhotos,
    verifiedOnly,
  } = query;

  const normalizedSellerType = String(sellerType || "").trim();

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
    sellerType:
      normalizedSellerType === "company" || normalizedSellerType === "private"
        ? normalizedSellerType
        : undefined,
    areaFrom: areaFrom || undefined,
    areaTo: areaTo || undefined,
    floorFrom: floorFrom || undefined,
    floorTo: floorTo || undefined,
    floorNotFirst:
      floorNotFirst === "1" || floorNotFirst === "true" ? true : undefined,
    floorNotLast:
      floorNotLast === "1" || floorNotLast === "true" ? true : undefined,
    pricePerSqmFrom: pricePerSqmFrom || undefined,
    pricePerSqmTo: pricePerSqmTo || undefined,
    guestsMin: guestsMin || undefined,
    yearFrom: yearFrom || undefined,
    yearTo: yearTo || undefined,
    mileageFrom: mileageFrom || undefined,
    mileageTo: mileageTo || undefined,
    onlyWithPhotos:
      onlyWithPhotos === "1" || onlyWithPhotos === "true" ? true : undefined,
    verifiedOnly:
      verifiedOnly === "1" || verifiedOnly === "true" ? true : undefined,
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

    const { notifyModerators } = require("../lib/moderationNotify");
    await notifyModerators(req.app.get("io"), {
      type: "report_created",
      listing,
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

router.post("/:id/appeal", auth, async (req, res) => {
  try {
    const text = String(req.body?.text || req.body?.reason || "").trim();

    const listing = await Listing.submitAppeal(
      req.params.id,
      req.user.id,
      text
    );

    if (!listing) {
      return res.status(404).json({
        error: "Listing not found",
      });
    }

    const { notifyModerators } = require("../lib/moderationNotify");
    await notifyModerators(req.app.get("io"), {
      type: "appeal_submitted",
      listing,
    });

    return res.json(listing);
  } catch (e) {
    if (e?.message === "APPEAL_TOO_SHORT") {
      return res.status(400).json({
        error: "Appeal text must be at least 10 characters",
      });
    }

    if (e?.message === "NOT_REJECTED") {
      return res.status(400).json({
        error: "Only rejected listings can be appealed",
      });
    }

    if (e?.message === "APPEAL_ALREADY_PENDING") {
      return res.status(409).json({
        error: "Appeal is already pending",
      });
    }

    console.error("LISTING_APPEAL_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to submit appeal",
    });
  }
});

router.post("/:id/republish", auth, async (req, res) => {
  try {
    const existing = await Listing.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        error: "Listing not found",
      });
    }

    if (String(existing.owner) !== String(req.user.id)) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    if (!["approved", "pending"].includes(existing.status)) {
      try {
        await require("../models/User").assertCanCreateListing(req.user.id);
      } catch (e) {
        if (e?.message === "LISTING_LIMIT_REACHED") {
          return res.status(403).json({
            error: "Listing limit reached",
            limit: e.limit,
            activeListings: e.activeListings,
            sellerType: e.sellerType,
          });
        }

        throw e;
      }
    }

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
    const { type, days } = req.body || {};
    const listing = await Listing.promote(
      req.params.id,
      req.user.id,
      type,
      days
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

    if (e?.message === "INVALID_DAYS") {
      return res.status(400).json({
        error: "Invalid promotion duration",
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

    try {
      await require("../models/User").assertCanCreateListing(req.user.id);
    } catch (e) {
      if (e?.message === "LISTING_LIMIT_REACHED") {
        return res.status(403).json({
          error: "Listing limit reached",
          limit: e.limit,
          activeListings: e.activeListings,
          sellerType: e.sellerType,
        });
      }

      throw e;
    }

    const images = normalizeArray(body.images);

    try {
      assertImagesWithinLimit(images, cat);
    } catch (e) {
      if (e?.message === "PHOTO_LIMIT_EXCEEDED") {
        return res.status(400).json({
          error: `Maximum ${e.limit} images allowed for this category`,
          limit: e.limit,
        });
      }

      throw e;
    }

    const listing = await Listing.create({
      title,
      price: String(body.price || "").trim(),
      description: String(body.description || "").trim(),
      location: String(body.location || "").trim(),
      cat,
      subcategory: String(body.subcategory || "").trim(),
      images,
      specs: normalizeArray(body.specs),
      owner: req.user.id,
      lat: body.lat ?? body.reLat,
      lng: body.lng ?? body.reLng,
    });

    const moderated = await Listing.processModeration(listing.id, {
      isUpdate: false,
      io: req.app.get("io"),
    });

    return res.status(201).json(moderated || listing);
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
    const existing = await Listing.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        error: "Listing not found",
      });
    }

    if (String(existing.owner) !== String(req.user.id)) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    const cat = body.cat ? String(body.cat).trim() : existing.cat;
    const images = body.images ? normalizeArray(body.images) : undefined;

    if (images) {
      try {
        assertImagesWithinLimit(images, cat);
      } catch (e) {
        if (e?.message === "PHOTO_LIMIT_EXCEEDED") {
          return res.status(400).json({
            error: `Maximum ${e.limit} images allowed for this category`,
            limit: e.limit,
          });
        }

        throw e;
      }
    }

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
      images,
      specs: body.specs ? normalizeArray(body.specs) : undefined,
      lat: body.lat ?? body.reLat,
      lng: body.lng ?? body.reLng,
    });

    if (!listing) {
      return res.status(404).json({
        error: "Listing not found",
      });
    }

    const moderated = await Listing.processModeration(listing.id, {
      isUpdate: true,
      io: req.app.get("io"),
    });

    return res.json(moderated || listing);
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