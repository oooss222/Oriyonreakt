const router = require("express").Router();
const auth = require("../middleware/auth");
const Review = require("../models/Review");

router.get("/seller/:sellerId", async (req, res) => {
  try {
    const [summary, items] = await Promise.all([
      Review.getSellerSummary(req.params.sellerId),
      Review.listForSeller(req.params.sellerId, {
        limit: Number(req.query.limit) || 20,
        offset: Number(req.query.offset) || 0,
      }),
    ]);

    return res.json({
      summary,
      items,
    });
  } catch (e) {
    console.error("REVIEWS_LIST_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load reviews",
    });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const sellerId = String(req.body?.sellerId || "").trim();
    const listingId = String(req.body?.listingId || "").trim() || null;
    const rating = Number(req.body?.rating || 0);
    const comment = String(req.body?.comment || "").trim();

    if (!sellerId) {
      return res.status(400).json({
        error: "sellerId required",
      });
    }

    const review = await Review.create({
      sellerId,
      reviewerId: req.user.id,
      listingId,
      rating,
      comment,
    });

    const summary = await Review.getSellerSummary(sellerId);

    return res.status(201).json({
      review,
      summary,
    });
  } catch (e) {
    if (e?.message === "INVALID_RATING") {
      return res.status(400).json({
        error: "Rating must be between 1 and 5",
      });
    }

    if (e?.message === "SELF_REVIEW") {
      return res.status(400).json({
        error: "You cannot review yourself",
      });
    }

    console.error("REVIEW_CREATE_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to save review",
    });
  }
});

module.exports = router;
