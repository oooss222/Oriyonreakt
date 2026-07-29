const router = require("express").Router();

const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/role");
const { query, mapUser } = require("../db");
const User = require("../models/User");
const Listing = require("../models/Listing");
const Wallet = require("../models/Wallet");
const AdminAudit = require("../models/AdminAudit");
const SiteSettings = require("../models/SiteSettings");
const { toCsv } = require("../lib/csv");
const { isMailConfigured } = require("../lib/mailer");
const { sendFinanceReport } = require("../lib/financeReport");

const FINANCE_AUDIT_ACTIONS = ["wallet.adjust"];
const ACCOUNTANT_EXPORT_TYPES = ["users", "transactions"];

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

router.get("/analytics", requireRole("admin", "super_admin"), async (req, res) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 7), 90);

    const [registrationsResult, categoriesResult, moderatorsResult] =
      await Promise.all([
        query(
          `
          SELECT
            to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
            COUNT(*)::int AS count
          FROM users
          WHERE created_at >= now() - ($1::int || ' days')::interval
          GROUP BY 1
          ORDER BY 1 ASC
          `,
          [days]
        ),
        query(
          `
          SELECT
            COALESCE(NULLIF(cat, ''), 'unknown') AS cat,
            COUNT(*)::int AS count
          FROM listings
          WHERE status = 'approved'
          GROUP BY 1
          ORDER BY count DESC, cat ASC
          LIMIT 12
          `
        ),
        query(
          `
          SELECT
            a.actor_id,
            u.name AS actor_name,
            u.email AS actor_email,
            COUNT(*) FILTER (WHERE a.action = 'listing.approve')::int AS approvals,
            COUNT(*) FILTER (WHERE a.action = 'listing.reject')::int AS rejections,
            COUNT(*) FILTER (WHERE a.action LIKE 'report.%')::int AS report_actions,
            COUNT(*)::int AS total_actions
          FROM admin_audit_log a
          LEFT JOIN users u ON u.id = a.actor_id
          WHERE a.created_at >= now() - ($1::int || ' days')::interval
          GROUP BY a.actor_id, u.name, u.email
          HAVING COUNT(*) > 0
          ORDER BY total_actions DESC, actor_name ASC
          LIMIT 20
          `,
          [days]
        ),
      ]);

    return res.json({
      days,
      registrationsByDay: registrationsResult.rows.map((row) => ({
        day: row.day,
        count: Number(row.count || 0),
      })),
      listingsByCategory: categoriesResult.rows.map((row) => ({
        cat: row.cat,
        count: Number(row.count || 0),
      })),
      moderatorActivity: moderatorsResult.rows.map((row) => ({
        actorId: row.actor_id,
        name: row.actor_name || "—",
        email: row.actor_email || "",
        approvals: Number(row.approvals || 0),
        rejections: Number(row.rejections || 0),
        reportActions: Number(row.report_actions || 0),
        totalActions: Number(row.total_actions || 0),
      })),
    });
  } catch (e) {
    console.error("ADMIN_ANALYTICS_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load analytics",
    });
  }
});

router.get("/settings", requireRole("super_admin"), async (req, res) => {
  try {
    const settings = await SiteSettings.get();
    return res.json(settings);
  } catch (e) {
    console.error("ADMIN_SETTINGS_GET_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load settings",
    });
  }
});

router.put("/settings", requireRole("super_admin"), async (req, res) => {
  try {
    const updated = await SiteSettings.update(req.body || {}, req.user.id);

    await audit(req, "settings.update", "settings", null, {
      vipPrice: updated.vipPrice,
      topPrice: updated.topPrice,
      bumpPrice: updated.bumpPrice,
      registrationEnabled: updated.registrationEnabled,
    });

    return res.json(updated);
  } catch (e) {
    console.error("ADMIN_SETTINGS_PUT_ERROR:", e?.message, e?.stack);

    return res.status(500).json({
      error: e?.message || "Failed to update settings",
    });
  }
});

router.get(
  "/export/:type",
  requireRole("admin", "super_admin", "accountant"),
  async (req, res) => {
    try {
      const type = String(req.params.type || "").trim();

      if (!["users", "listings", "transactions"].includes(type)) {
        return res.status(400).json({
          error: "Invalid export type",
        });
      }

      const actorRole = req.user?.role || "user";

      if (actorRole === "accountant" && !ACCOUNTANT_EXPORT_TYPES.includes(type)) {
        return res.status(403).json({
          error: "Accountant can export only users and transactions",
        });
      }

      let csv = "";
      let filename = "export.csv";

      const from = String(req.query.from || "").trim();
      const to = String(req.query.to || "").trim();

      if (type === "users") {
        let users;

        if (from || to) {
          const conditions = [];
          const values = [];

          if (from) {
            values.push(from);
            conditions.push(`created_at >= $${values.length}::date`);
          }

          if (to) {
            values.push(to);
            conditions.push(`created_at < ($${values.length}::date + interval '1 day')`);
          }

          const whereSql = conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

          const result = await query(
            `
            SELECT *
            FROM users
            ${whereSql}
            ORDER BY created_at DESC
            `,
            values
          );

          users = result.rows.map(mapUser);
        } else {
          users = await User.getAll();
        }

        csv = toCsv(users, [
          { label: "ID", value: (row) => row.id },
          { label: "Email", value: (row) => row.email },
          { label: "Имя", value: (row) => row.name },
          { label: "Телефон", value: (row) => row.phone },
          { label: "Роль", value: (row) => row.role },
          {
            label: "Заблокирован",
            value: (row) => (row.isBlocked ? "yes" : "no"),
          },
          { label: "Баланс", value: (row) => row.walletBalance },
          { label: "Создан", value: (row) => row.createdAt },
        ]);

        filename = "users.csv";
      }

      if (type === "listings") {
        const result = await query(
          `
          SELECT
            l.*,
            u.email AS owner_email
          FROM listings l
          LEFT JOIN users u ON u.id = l.owner
          ORDER BY l.created_at DESC
          `
        );

        csv = toCsv(result.rows, [
          { label: "ID", value: (row) => row.id },
          { label: "Название", value: (row) => row.title },
          { label: "Цена", value: (row) => row.price },
          { label: "Категория", value: (row) => row.cat },
          { label: "Подкатегория", value: (row) => row.subcategory },
          { label: "Статус", value: (row) => row.status },
          { label: "Город", value: (row) => row.location },
          { label: "Владелец", value: (row) => row.owner },
          { label: "Email владельца", value: (row) => row.owner_email },
          { label: "Создано", value: (row) => row.created_at },
        ]);

        filename = "listings.csv";
      }

      if (type === "transactions") {
        const conditions = ["wt.status = 'completed'"];
        const values = [];

        if (from) {
          values.push(from);
          conditions.push(`wt.created_at >= $${values.length}::date`);
        }

        if (to) {
          values.push(to);
          conditions.push(`wt.created_at < ($${values.length}::date + interval '1 day')`);
        }

        const whereSql = `WHERE ${conditions.join(" AND ")}`;

        const result = await query(
          `
          SELECT
            wt.*,
            u.email AS user_email,
            u.name AS user_name
          FROM wallet_transactions wt
          LEFT JOIN users u ON u.id = wt.user_id
          ${whereSql}
          ORDER BY wt.created_at DESC
          `,
          values
        );

        csv = toCsv(result.rows, [
          { label: "ID", value: (row) => row.id },
          { label: "User ID", value: (row) => row.user_id },
          { label: "Email", value: (row) => row.user_email },
          { label: "Имя", value: (row) => row.user_name },
          { label: "Тип", value: (row) => row.type },
          { label: "Сумма", value: (row) => row.amount },
          { label: "Статус", value: (row) => row.status },
          { label: "Описание", value: (row) => row.description },
          { label: "Создано", value: (row) => row.created_at },
        ]);

        filename = "transactions.csv";
      }

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      return res.send(csv);
    } catch (e) {
      console.error("ADMIN_EXPORT_ERROR:", e?.message);

      return res.status(500).json({
        error: "Failed to export data",
      });
    }
  }
);

router.get(
  "/finance/summary",
  requireRole("super_admin", "accountant"),
  async (req, res) => {
    try {
      const summary = await Wallet.getFinanceSummary();

      return res.json(summary);
    } catch (e) {
      console.error("ADMIN_FINANCE_SUMMARY_ERROR:", e?.message);

      return res.status(500).json({
        error: "Failed to load finance summary",
      });
    }
  }
);

router.get(
  "/finance/transactions",
  requireRole("super_admin", "accountant"),
  async (req, res) => {
    try {
      const type = String(req.query.type || "all").trim();
      const q = String(req.query.q || "").trim();
      const from = String(req.query.from || "").trim();
      const to = String(req.query.to || "").trim();
      const userId = String(req.query.userId || "").trim();
      const limit = Number(req.query.limit || 25);
      const page = Math.max(Number(req.query.page) || 1, 1);
      const offset = (page - 1) * Math.min(Math.max(limit, 1), 100);

      const result = await Wallet.findPaginated({
        type,
        q,
        from,
        to,
        userId,
        limit,
        offset,
      });

      return res.json({
        items: result.items,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (e) {
      console.error("ADMIN_FINANCE_TX_ERROR:", e?.message);

      return res.status(500).json({
        error: "Failed to load transactions",
      });
    }
  }
);

router.get(
  "/finance/reports",
  requireRole("super_admin", "accountant"),
  async (req, res) => {
    try {
      const from = String(req.query.from || "").trim();
      const to = String(req.query.to || "").trim();

      const report = await Wallet.getPeriodReport({ from, to });

      return res.json(report);
    } catch (e) {
      console.error("ADMIN_FINANCE_REPORTS_ERROR:", e?.message);

      return res.status(500).json({
        error: "Failed to load finance report",
      });
    }
  }
);

router.get(
  "/finance/payments",
  requireRole("super_admin", "accountant"),
  async (req, res) => {
    try {
      const overview = await Wallet.getPaymentOverview({
        limit: Number(req.query.limit) || 20,
      });

      return res.json({
        ...overview,
        gatewayConfigured: false,
        mailConfigured: isMailConfigured(),
      });
    } catch (e) {
      console.error("ADMIN_FINANCE_PAYMENTS_ERROR:", e?.message);

      return res.status(500).json({
        error: "Failed to load payment overview",
      });
    }
  }
);

router.get(
  "/finance/promotions",
  requireRole("super_admin", "accountant"),
  async (req, res) => {
    try {
      const from = String(req.query.from || "").trim();
      const to = String(req.query.to || "").trim();

      const [promotions, settings] = await Promise.all([
        Wallet.getPromotionRevenue({ from, to }),
        SiteSettings.getPublic(),
      ]);

      return res.json({
        ...promotions,
        vipPrice: settings.vipPrice,
        topPrice: settings.topPrice,
      });
    } catch (e) {
      console.error("ADMIN_FINANCE_PROMOTIONS_ERROR:", e?.message);

      return res.status(500).json({
        error: "Failed to load promotion revenue",
      });
    }
  }
);

router.get(
  "/finance/audit",
  requireRole("super_admin", "accountant"),
  async (req, res) => {
    try {
      const from = String(req.query.from || "").trim();
      const to = String(req.query.to || "").trim();
      const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
      const offset = Math.max(Number(req.query.offset) || 0, 0);

      const items = await AdminAudit.findRecent({
        actions: FINANCE_AUDIT_ACTIONS,
        from,
        to,
        limit,
        offset,
      });

      return res.json(items);
    } catch (e) {
      console.error("ADMIN_FINANCE_AUDIT_ERROR:", e?.message);

      return res.status(500).json({
        error: "Failed to load finance audit log",
      });
    }
  }
);

router.post(
  "/finance/send-report",
  requireRole("super_admin", "accountant"),
  async (req, res) => {
    try {
      const from = String(req.body?.from || "").trim();
      const to = String(req.body?.to || "").trim();
      let email = String(req.body?.email || "").trim();

      if (!email) {
        const settings = await SiteSettings.get();
        email = settings.accountantReportEmail;
      }

      if (!email) {
        return res.status(400).json({
          error: "Report email is not configured",
        });
      }

      const result = await sendFinanceReport({
        to: email,
        from,
        toDate: to,
      });

      return res.json({
        ok: true,
        ...result,
      });
    } catch (e) {
      console.error("ADMIN_FINANCE_SEND_REPORT_ERROR:", e?.message);

      return res.status(500).json({
        error: e.message || "Failed to send finance report",
      });
    }
  }
);

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

router.get(
  "/users",
  requireRole("admin", "super_admin", "accountant"),
  async (req, res) => {
    try {
      const q = String(req.query.q || "").trim();
    const role = String(req.query.role || "all").trim();
    const status = String(req.query.status || "all").trim();
    const sort = String(req.query.sort || "created_desc").trim();
    const limit = Number(req.query.limit || 25);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * Math.min(Math.max(limit, 1), 100);

    const result = await User.findPaginated({
      q,
      role,
      status,
      sort,
      limit,
      offset,
    });

    return res.json({
      items: result.items.map(User.sanitize),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (e) {
    console.error("ADMIN_USERS_GET_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load users",
    });
  }
  }
);

router.get(
  "/users/:id",
  requireRole("admin", "super_admin", "accountant"),
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
  requireRole("admin", "super_admin", "accountant"),
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