const router = require("express").Router();

const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/role");
const { query } = require("../db");
const User = require("../models/User");
const Listing = require("../models/Listing");
const Wallet = require("../models/Wallet");
const AdminAudit = require("../models/AdminAudit");

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
    console.error("ADMIN_AUDIT_LOG_ERROR:", e?.message);
  }
}

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

router.get("/stats", requireRole("admin", "super_admin"), async (req, res) => {
  try {
    const [usersResult, listingsResult, reportsResult, walletResult] =
      await Promise.all([
        query(`
          SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE is_blocked)::int AS blocked,
            COUNT(*) FILTER (WHERE NOT is_blocked)::int AS active,
            COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days')::int AS new_week,
            COUNT(*) FILTER (WHERE role = 'super_admin')::int AS super_admins,
            COUNT(*) FILTER (WHERE role = 'moderator')::int AS moderators
          FROM users
        `),
        query(`
          SELECT status, COUNT(*)::int AS count
          FROM listings
          GROUP BY status
        `),
        query(`
          SELECT COUNT(*)::int AS pending
          FROM listing_reports
          WHERE status = 'pending'
        `),
        query(`
          SELECT COALESCE(SUM(wallet_balance), 0)::numeric AS total_balance
          FROM users
        `),
      ]);

    const users = usersResult.rows[0] || {};
    const listingsByStatus = listingsResult.rows.reduce((acc, row) => {
      acc[row.status] = Number(row.count || 0);
      return acc;
    }, {});

    const listingsTotal = Object.values(listingsByStatus).reduce(
      (sum, count) => sum + count,
      0
    );

    return res.json({
      users: {
        total: Number(users.total || 0),
        active: Number(users.active || 0),
        blocked: Number(users.blocked || 0),
        newWeek: Number(users.new_week || 0),
        superAdmins: Number(users.super_admins || 0),
        moderators: Number(users.moderators || 0),
      },
      listings: {
        total: listingsTotal,
        pending: Number(listingsByStatus.pending || 0),
        approved: Number(listingsByStatus.approved || 0),
        rejected: Number(listingsByStatus.rejected || 0),
        sold: Number(listingsByStatus.sold || 0),
        archived: Number(listingsByStatus.archived || 0),
      },
      reports: {
        pending: Number(reportsResult.rows[0]?.pending || 0),
      },
      wallet: {
        totalBalance: Number(walletResult.rows[0]?.total_balance || 0),
      },
    });
  } catch (e) {
    console.error("ADMIN_STATS_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load admin stats",
    });
  }
});

router.get("/audit", requireRole("admin", "super_admin"), async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const action = String(req.query.action || "").trim();

    const items = await AdminAudit.findRecent({ limit, offset, action });

    return res.json(items);
  } catch (e) {
    console.error("ADMIN_AUDIT_GET_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load audit log",
    });
  }
});

router.get("/listings", requireRole("admin", "super_admin"), async (req, res) => {
  try {
    const status = String(req.query.status || "all");
    const search = String(req.query.q || "").trim();
    const cat = String(req.query.cat || "").trim();
    const owner = String(req.query.owner || "").trim();
    const limit = Number(req.query.limit || 50);
    const offset = Number(req.query.offset || 0);

    const listings = await Listing.findForAdmin({
      status,
      search,
      cat,
      owner,
      limit,
      offset,
    });

    return res.json(listings);
  } catch (e) {
    console.error("ADMIN_LISTINGS_GET_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load listings",
    });
  }
});

router.post(
  "/listings/:id/status",
  requireRole("admin", "super_admin"),
  async (req, res) => {
    try {
      const status = String(req.body?.status || "").trim();

      let listing;

      try {
        listing = await Listing.adminSetStatus(req.params.id, status);
      } catch (e) {
        if (e.message === "INVALID_STATUS") {
          return res.status(400).json({
            error: "Invalid status",
          });
        }

        throw e;
      }

      if (!listing) {
        return res.status(404).json({
          error: "Listing not found",
        });
      }

      await audit(req, "listing.status_change", "listing", listing.id, {
        status,
        title: listing.title,
      });

      return res.json(listing);
    } catch (e) {
      console.error("ADMIN_LISTING_STATUS_ERROR:", e?.message);

      return res.status(500).json({
        error: "Failed to update listing status",
      });
    }
  }
);

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

router.get(
  "/users/:id",
  requireRole("admin", "super_admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      const [listingsResult, transactions] = await Promise.all([
        query(
          `
          SELECT status, COUNT(*)::int AS count
          FROM listings
          WHERE owner = $1
          GROUP BY status
          `,
          [req.params.id]
        ),
        Wallet.findByUser(req.params.id, { limit: 30 }),
      ]);

      const listings = listingsResult.rows.reduce(
        (acc, row) => {
          acc[row.status] = Number(row.count || 0);
          acc.total += Number(row.count || 0);
          return acc;
        },
        { total: 0 }
      );

      return res.json({
        user: {
          ...User.sanitize(user),
          lastSeen: user.lastSeen || null,
        },
        listings,
        transactions,
      });
    } catch (e) {
      console.error("ADMIN_USER_GET_ERROR:", e?.message);

      return res.status(500).json({
        error: "Failed to load user",
      });
    }
  }
);

router.get(
  "/users/:id/wallet/transactions",
  requireRole("admin", "super_admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
      const offset = Math.max(Number(req.query.offset) || 0, 0);

      const transactions = await Wallet.findByUser(req.params.id, {
        limit,
        offset,
      });

      return res.json(transactions);
    } catch (e) {
      console.error("ADMIN_USER_WALLET_TX_ERROR:", e?.message);

      return res.status(500).json({
        error: "Failed to load wallet transactions",
      });
    }
  }
);

router.post(
  "/users/:id/wallet/adjust",
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const amount = Number(req.body?.amount);
      const description = String(req.body?.description || "").trim();

      if (!Number.isFinite(amount) || amount === 0) {
        return res.status(400).json({
          error: "Invalid amount",
        });
      }

      const target = await User.findById(req.params.id);

      if (!target) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      let updated;

      try {
        updated = await User.adjustWallet(req.params.id, amount, {
          description,
          createdBy: req.user.id,
        });
      } catch (e) {
        if (e.message === "INSUFFICIENT_BALANCE") {
          return res.status(400).json({
            error: "Insufficient wallet balance",
          });
        }

        if (e.message === "INVALID_AMOUNT") {
          return res.status(400).json({
            error: "Invalid amount",
          });
        }

        throw e;
      }

      const transactions = await Wallet.findByUser(req.params.id, { limit: 30 });

      await audit(req, "wallet.adjust", "user", req.params.id, {
        amount,
        description,
        email: target.email,
      });

      return res.json({
        user: User.sanitize(updated),
        transactions,
      });
    } catch (e) {
      console.error("ADMIN_USER_WALLET_ADJUST_ERROR:", e?.message);

      return res.status(500).json({
        error: "Failed to adjust wallet",
      });
    }
  }
);

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

    await audit(req, "user.role_change", "user", req.params.id, {
      role,
      email: target.email,
    });

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

      await audit(req, "user.block", "user", req.params.id, {
        email: target.email,
      });

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

      await audit(req, "user.unblock", "user", req.params.id, {
        email: target.email,
      });

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

      await audit(req, "listing.delete", "listing", listing.id, {
        title: listing.title,
      });

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

module.exports = router;