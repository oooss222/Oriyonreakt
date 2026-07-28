const router = require("express").Router();

const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/role");
const Listing = require("../models/Listing");
const Report = require("../models/Report");

router.use(auth);
router.use(requireRole("moderator", "admin", "super_admin"));

router.get("/listings", async (req, res) => {
  try {
    const status = String(req.query.status || "pending");
    const limit = Number(req.query.limit || 100);
    const offset = Number(req.query.offset || 0);

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        error: "Invalid status",
      });
    }

    const listings = await Listing.findForModeration({
      status,
      limit,
      offset,
    });

    return res.json(listings);
  } catch (e) {
    console.error("MODERATION_LISTINGS_GET_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load moderation listings",
    });
  }
});

router.post("/listings/:id/approve", async (req, res) => {
  try {
    const listing = await Listing.approve(req.params.id, req.user.id);

    if (!listing) {
      return res.status(404).json({
        error: "Listing not found",
      });
    }

    return res.json(listing);
  } catch (e) {
    console.error("MODERATION_APPROVE_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to approve listing",
    });
  }
});

router.post("/listings/:id/reject", async (req, res) => {
  try {
    const reason = String(req.body?.reason || "").trim();

    if (!reason) {
      return res.status(400).json({
        error: "Rejection reason is required",
      });
    }

    if (reason.length < 5) {
      return res.status(400).json({
        error: "Rejection reason is too short",
      });
    }

    const listing = await Listing.reject(req.params.id, req.user.id, reason);

    if (!listing) {
      return res.status(404).json({
        error: "Listing not found",
      });
    }

    return res.json(listing);
  } catch (e) {
    console.error("MODERATION_REJECT_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to reject listing",
    });
  }
});

router.get("/reports", async (req, res) => {
  try {
    const status = String(req.query.status || "pending");
    const limit = Number(req.query.limit || 100);
    const offset = Number(req.query.offset || 0);

    if (!["pending", "reviewed", "dismissed"].includes(status)) {
      return res.status(400).json({
        error: "Invalid status",
      });
    }

    const reports = await Report.findForModeration({
      status,
      limit,
      offset,
    });

    return res.json(reports);
  } catch (e) {
    console.error("MODERATION_REPORTS_GET_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load reports",
    });
  }
});

router.post("/reports/:id/review", async (req, res) => {
  try {
    const report = await Report.updateStatus(
      req.params.id,
      "reviewed",
      req.user.id
    );

    if (!report) {
      return res.status(404).json({
        error: "Report not found",
      });
    }

    return res.json(report);
  } catch (e) {
    console.error("MODERATION_REPORT_REVIEW_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to update report",
    });
  }
});

router.post("/reports/:id/dismiss", async (req, res) => {
  try {
    const report = await Report.updateStatus(
      req.params.id,
      "dismissed",
      req.user.id
    );

    if (!report) {
      return res.status(404).json({
        error: "Report not found",
      });
    }

    return res.json(report);
  } catch (e) {
    console.error("MODERATION_REPORT_DISMISS_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to dismiss report",
    });
  }
});

module.exports = router;