const router = require("express").Router();

const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/role");
const User = require("../models/User");
const Listing = require("../models/Listing");
const Ad = require("../models/Ad");

const ALLOWED_ROLES = [
  "user",
  "moderator",
  "accountant",
  "admin",
  "super_admin",
];

const ADMIN_MANAGEABLE_ROLES = ["user", "moderator"];

function canManageTarget(actor, target) {
  const actorRole = actor?.role || "user";
  const targetRole = target?.role || "user";

  if (String(actor.id) === String(target.id)) {
    return {
      ok: false,
      error: "You cannot manage yourself",
    };
  }

  if (actorRole === "super_admin") {
    return {
      ok: true,
    };
  }

  if (actorRole === "admin") {
    if (!ADMIN_MANAGEABLE_ROLES.includes(targetRole)) {
      return {
        ok: false,
        error: "Admin can manage only users and moderators",
      };
    }

    return {
      ok: true,
    };
  }

  return {
    ok: false,
    error: "Forbidden",
  };
}

router.use(auth);

router.get("/users", requireRole("admin", "super_admin"), async (req, res) => {
  try {
    const users = await User.getAll();

    return res.json(users.map(User.sanitize));
  } catch (e) {
    console.error("ADMIN_USERS_GET_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load users",
    });
  }
});

router.put("/users/:id/role", requireRole("super_admin"), async (req, res) => {
  try {
    const role = String(req.body?.role || "").trim();

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        error: "Invalid role",
      });
    }

    const target = await User.findById(req.params.id);

    if (!target) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    if (String(target.id) === String(req.user.id) && role !== "super_admin") {
      return res.status(400).json({
        error: "Super admin cannot downgrade himself",
      });
    }

    const updated = await User.setRole(req.params.id, role);

    return res.json(User.sanitize(updated));
  } catch (e) {
    console.error("ADMIN_USER_ROLE_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to update user role",
    });
  }
});

router.post(
  "/users/:id/block",
  requireRole("admin", "super_admin"),
  async (req, res) => {
    try {
      const actor = await User.findById(req.user.id);

      if (!actor) {
        return res.status(401).json({
          error: "Current user not found",
        });
      }

      const target = await User.findById(req.params.id);

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

      const updated = await User.blockUser(req.params.id);

      return res.json(User.sanitize(updated));
    } catch (e) {
      console.error("ADMIN_USER_BLOCK_ERROR:", e?.message);

      return res.status(500).json({
        error: "Failed to block user",
      });
    }
  }
);

router.post(
  "/users/:id/unblock",
  requireRole("admin", "super_admin"),
  async (req, res) => {
    try {
      const actor = await User.findById(req.user.id);

      if (!actor) {
        return res.status(401).json({
          error: "Current user not found",
        });
      }

      const target = await User.findById(req.params.id);

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

      const updated = await User.unblockUser(req.params.id);

      return res.json(User.sanitize(updated));
    } catch (e) {
      console.error("ADMIN_USER_UNBLOCK_ERROR:", e?.message);

      return res.status(500).json({
        error: "Failed to unblock user",
      });
    }
  }
);

router.delete(
  "/listings/:id",
  requireRole("admin", "super_admin"),
  async (req, res) => {
    try {
      const listing = await Listing.adminDelete(req.params.id);

      if (!listing) {
        return res.status(404).json({
          error: "Listing not found",
        });
      }

      return res.json({
        ok: true,
        listing,
      });
    } catch (e) {
      console.error("ADMIN_LISTING_DELETE_ERROR:", e?.message);

      return res.status(500).json({
        error: "Failed to delete listing",
      });
    }
  }
);

router.get("/ads", requireRole("super_admin"), async (req, res) => {
  try {
    const ads = await Ad.findAll();
    return res.json(ads);
  } catch (e) {
    console.error("ADMIN_ADS_GET_ERROR:", e?.message);
    return res.status(500).json({ error: "Failed to load ads" });
  }
});

router.post("/ads", requireRole("super_admin"), async (req, res) => {
  try {
    const body = req.body || {};

    if (!body.imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    const ad = await Ad.create({
      title: body.title || "",
      imageUrl: body.imageUrl,
      targetUrl: body.targetUrl || "",
      placement: body.placement || "home_top",
      isActive: body.isActive !== false,
      createdBy: req.user.id,
      startsAt: body.startsAt || null,
      endsAt: body.endsAt || null,
    });

    return res.status(201).json(ad);
  } catch (e) {
    console.error("ADMIN_AD_CREATE_ERROR:", e?.message);
    return res.status(500).json({ error: "Failed to create ad" });
  }
});

router.put("/ads/:id/toggle", requireRole("super_admin"), async (req, res) => {
  try {
    const ad = await Ad.toggle(req.params.id, Boolean(req.body?.isActive));

    if (!ad) {
      return res.status(404).json({ error: "Ad not found" });
    }

    return res.json(ad);
  } catch (e) {
    console.error("ADMIN_AD_TOGGLE_ERROR:", e?.message);
    return res.status(500).json({ error: "Failed to update ad" });
  }
});

router.delete("/ads/:id", requireRole("super_admin"), async (req, res) => {
  try {
    await Ad.delete(req.params.id);
    return res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN_AD_DELETE_ERROR:", e?.message);
    return res.status(500).json({ error: "Failed to delete ad" });
  }
});

module.exports = router;