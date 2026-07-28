const router = require("express").Router();

const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/role");
const User = require("../models/User");
const Listing = require("../models/Listing");
const Report = require("../models/Report");
const AdminAudit = require("../models/AdminAudit");

const ADMIN_MANAGEABLE_ROLES = ["user", "moderator"];

function canManageTarget(actor, target) {
  const actorRole = actor?.role || "user";
  const targetRole = target?.role || "user";

  if (String(actor.id) === String(target.id)) {
    return { ok: false, error: "You cannot manage yourself" };
  }

  if (actorRole === "super_admin") {
    return { ok: true };
  }

  if (actorRole === "admin") {
    if (!ADMIN_MANAGEABLE_ROLES.includes(targetRole)) {
      return { ok: false, error: "Admin can manage only users and moderators" };
    }
    return { ok: true };
  }

  if (actorRole === "moderator") {
    if (targetRole === "user") {
      return { ok: true };
    }
    return { ok: false, error: "Moderator can manage only regular users" };
  }

  return { ok: false, error: "Forbidden" };
}

async function audit(req, action, targetType, targetId, details = {}) {
  try {
    await AdminAudit.log({
      actorId: req.user.id,
      action,
      targetType,
      targetId,
      details,
    });
  } catch (e) {
    console.error("MODERATION_AUDIT_LOG_ERROR:", e?.message);
  }
}

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

    await audit(req, "listing.approve", "listing", listing.id, {
      title: listing.title,
    });

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

    await audit(req, "listing.reject", "listing", listing.id, {
      title: listing.title,
      reason,
    });

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

    await audit(req, "report.review", "report", report.id, {
      listingId: report.listingId,
    });

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

    await audit(req, "report.dismiss", "report", report.id, {
      listingId: report.listingId,
    });

    return res.json(report);
  } catch (e) {
    console.error("MODERATION_REPORT_DISMISS_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to dismiss report",
    });
  }
});

router.post("/reports/:id/delete-listing", async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        error: "Report not found",
      });
    }

    const listing = await Listing.adminDelete(report.listingId);

    if (!listing) {
      return res.status(404).json({
        error: "Listing not found",
      });
    }

    await Report.updateStatus(report.id, "reviewed", req.user.id);

    await audit(req, "report.delete_listing", "report", report.id, {
      listingId: report.listingId,
      listingTitle: report.listingTitle,
    });

    return res.json({
      ok: true,
      report: { ...report, status: "reviewed" },
      listing,
    });
  } catch (e) {
    console.error("MODERATION_REPORT_DELETE_LISTING_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to delete listing from report",
    });
  }
});

router.post("/reports/:id/block-owner", async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        error: "Report not found",
      });
    }

    if (!report.listingOwnerId) {
      return res.status(404).json({
        error: "Listing owner not found",
      });
    }

    const actor = await User.findById(req.user.id);
    const target = await User.findById(report.listingOwnerId);

    if (!target) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const permission = canManageTarget(actor, target);

    if (!permission.ok) {
      return res.status(403).json({
        error: permission.error,
      });
    }

    const updated = await User.blockUser(report.listingOwnerId);

    await Report.updateStatus(report.id, "reviewed", req.user.id);

    await audit(req, "report.block_owner", "report", report.id, {
      listingId: report.listingId,
      ownerId: report.listingOwnerId,
      ownerEmail: target.email,
    });

    return res.json({
      ok: true,
      report: { ...report, status: "reviewed" },
      user: User.sanitize(updated),
    });
  } catch (e) {
    console.error("MODERATION_REPORT_BLOCK_OWNER_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to block listing owner",
    });
  }
});

module.exports = router;