const { query, mapWalletTransaction, TRANSACTION_TYPES } = require("../db");
const {
  assertEnumValue,
  safeLimit,
  safeOffset,
  bindLike,
  pickIdentifier,
} = require("../lib/sqlSafety");

const WALLET_DATE_COLUMNS = {
  created_at: "created_at",
  "wt.created_at": "wt.created_at",
};

function mapTransactionRow(row) {
  const tx = mapWalletTransaction(row);

  if (!tx) return null;

  return {
    ...tx,
    userName: row.user_name || "",
    userEmail: row.user_email || "",
  };
}

class WalletModel {
  static async recordTransaction({
    userId,
    type,
    amount,
    description = "",
    createdBy = null,
    status = "completed",
  }) {
    const result = await query(
      `
      INSERT INTO wallet_transactions (
        user_id,
        type,
        amount,
        status,
        description,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [userId, type, amount, status, description, createdBy]
    );

    return mapWalletTransaction(result.rows[0]);
  }

  static async findByUser(userId, { limit = 50, offset = 0 } = {}) {
    const safeLimitValue = safeLimit(limit, { fallback: 50, max: 100 });
    const safeOffsetValue = safeOffset(offset);

    const result = await query(
      `
      SELECT *
      FROM wallet_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [userId, safeLimitValue, safeOffsetValue]
    );

    return result.rows.map(mapWalletTransaction);
  }

  static async findPaginated({
    type = "",
    q = "",
    from = "",
    to = "",
    userId = "",
    limit = 50,
    offset = 0,
  } = {}) {
    const conditions = ["wt.status = 'completed'"];
    const values = [];

    const safeType = assertEnumValue(type, TRANSACTION_TYPES, "TYPE");

    if (safeType) {
      values.push(safeType);
      conditions.push(`wt.type = $${values.length}`);
    }

    if (userId) {
      values.push(userId);
      conditions.push(`wt.user_id = $${values.length}`);
    }

    const search = String(q || "").trim();

    if (search) {
      const idx = bindLike(values, search);

      conditions.push(`
        (
          u.email ILIKE $${idx} ESCAPE '\\'
          OR u.name ILIKE $${idx} ESCAPE '\\'
          OR wt.description ILIKE $${idx} ESCAPE '\\'
        )
      `);
    }

    if (from) {
      values.push(from);
      conditions.push(`wt.created_at >= $${values.length}::date`);
    }

    if (to) {
      values.push(to);
      conditions.push(`wt.created_at < ($${values.length}::date + interval '1 day')`);
    }

    const whereSql = `WHERE ${conditions.join(" AND ")}`;
    const safeLimitValue = safeLimit(limit, { fallback: 50, max: 100 });
    const safeOffsetValue = safeOffset(offset);

    const countResult = await query(
      `
      SELECT COUNT(*)::int AS total
      FROM wallet_transactions wt
      LEFT JOIN users u ON u.id = wt.user_id
      ${whereSql}
      `,
      values
    );

    const listValues = [...values, safeLimitValue, safeOffsetValue];
    const limitIdx = listValues.length - 1;
    const offsetIdx = listValues.length;

    const result = await query(
      `
      SELECT
        wt.*,
        u.name AS user_name,
        u.email AS user_email
      FROM wallet_transactions wt
      LEFT JOIN users u ON u.id = wt.user_id
      ${whereSql}
      ORDER BY wt.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `,
      listValues
    );

    const total = Number(countResult.rows[0]?.total || 0);

    return {
      items: result.rows.map(mapTransactionRow),
      total,
      limit: safeLimitValue,
      offset: safeOffsetValue,
      page: Math.floor(safeOffsetValue / safeLimitValue) + 1,
      totalPages: Math.max(1, Math.ceil(total / safeLimitValue)),
    };
  }

  static async getFinanceSummary() {
    const [balancesResult, periodResult, topUsersResult] = await Promise.all([
      query(`
        SELECT
          COALESCE(SUM(wallet_balance), 0)::numeric AS total_balance,
          COUNT(*) FILTER (WHERE wallet_balance > 0)::int AS users_with_balance,
          COUNT(*)::int AS users_total
        FROM users
      `),
      query(`
        SELECT
          COUNT(*) FILTER (
            WHERE created_at >= date_trunc('day', now()) AND amount > 0
          )::int AS credits_today,
          COALESCE(SUM(amount) FILTER (
            WHERE created_at >= date_trunc('day', now()) AND amount > 0
          ), 0)::numeric AS credits_sum_today,
          COUNT(*) FILTER (
            WHERE created_at >= date_trunc('day', now()) AND amount < 0
          )::int AS debits_today,
          COALESCE(SUM(amount) FILTER (
            WHERE created_at >= date_trunc('day', now()) AND amount < 0
          ), 0)::numeric AS debits_sum_today,
          COUNT(*) FILTER (
            WHERE created_at >= now() - interval '7 days'
          )::int AS tx_week,
          COALESCE(SUM(amount) FILTER (
            WHERE created_at >= now() - interval '7 days' AND amount > 0
          ), 0)::numeric AS credits_sum_week,
          COALESCE(SUM(amount) FILTER (
            WHERE created_at >= now() - interval '7 days' AND amount < 0
          ), 0)::numeric AS debits_sum_week,
          COUNT(*) FILTER (
            WHERE created_at >= now() - interval '30 days'
          )::int AS tx_month,
          COALESCE(SUM(amount) FILTER (
            WHERE created_at >= now() - interval '30 days' AND amount > 0
          ), 0)::numeric AS credits_sum_month,
          COALESCE(SUM(amount) FILTER (
            WHERE created_at >= now() - interval '30 days' AND amount < 0
          ), 0)::numeric AS debits_sum_month,
          COUNT(*) FILTER (
            WHERE created_at >= now() - interval '30 days'
              AND type = 'manual_adjustment'
          )::int AS manual_adjustments_month,
          COALESCE(SUM(amount) FILTER (
            WHERE created_at >= now() - interval '30 days'
              AND type = 'manual_adjustment'
          ), 0)::numeric AS manual_adjustments_sum_month
        FROM wallet_transactions
        WHERE status = 'completed'
      `),
      query(`
        SELECT id, name, email, wallet_balance
        FROM users
        WHERE wallet_balance > 0
        ORDER BY wallet_balance DESC
        LIMIT 5
      `),
    ]);

    const balances = balancesResult.rows[0] || {};
    const period = periodResult.rows[0] || {};

    return {
      totalBalance: Number(balances.total_balance || 0),
      usersWithBalance: Number(balances.users_with_balance || 0),
      usersTotal: Number(balances.users_total || 0),
      today: {
        credits: Number(period.credits_sum_today || 0),
        debits: Number(period.debits_sum_today || 0),
        creditCount: Number(period.credits_today || 0),
        debitCount: Number(period.debits_today || 0),
      },
      week: {
        transactions: Number(period.tx_week || 0),
        credits: Number(period.credits_sum_week || 0),
        debits: Number(period.debits_sum_week || 0),
      },
      month: {
        transactions: Number(period.tx_month || 0),
        credits: Number(period.credits_sum_month || 0),
        debits: Number(period.debits_sum_month || 0),
        manualAdjustments: Number(period.manual_adjustments_month || 0),
        manualAdjustmentsSum: Number(period.manual_adjustments_sum_month || 0),
      },
      topBalances: topUsersResult.rows.map((row) => ({
        id: row.id,
        name: row.name || "",
        email: row.email || "",
        walletBalance: Number(row.wallet_balance || 0),
      })),
    };
  }

  static _dateConditions(from, to, columnKey, values) {
    const column = pickIdentifier(columnKey, WALLET_DATE_COLUMNS);
    const conditions = [];

    if (from) {
      values.push(from);
      conditions.push(`${column} >= $${values.length}::date`);
    }

    if (to) {
      values.push(to);
      conditions.push(`${column} < ($${values.length}::date + interval '1 day')`);
    }

    return conditions;
  }

  static async getPeriodReport({ from = "", to = "" } = {}) {
    const values = [];
    const dateConditions = this._dateConditions(from, to, "created_at", values);
    const whereParts = ["status = 'completed'"];

    if (dateConditions.length) {
      whereParts.push(...dateConditions);
    }

    const whereSql = `WHERE ${whereParts.join(" AND ")}`;

    const [summaryResult, byTypeResult] = await Promise.all([
      query(
        `
        SELECT
          COUNT(*)::int AS total,
          COALESCE(SUM(amount) FILTER (WHERE amount > 0), 0)::numeric AS credits,
          COALESCE(SUM(amount) FILTER (WHERE amount < 0), 0)::numeric AS debits,
          COUNT(*) FILTER (WHERE type = 'manual_adjustment')::int AS manual_count,
          COALESCE(SUM(amount) FILTER (WHERE type = 'manual_adjustment'), 0)::numeric AS manual_sum
        FROM wallet_transactions
        ${whereSql}
        `,
        values
      ),
      query(
        `
        SELECT
          type,
          COUNT(*)::int AS count,
          COALESCE(SUM(amount), 0)::numeric AS sum
        FROM wallet_transactions
        ${whereSql}
        GROUP BY type
        ORDER BY count DESC
        `,
        values
      ),
    ]);

    const summary = summaryResult.rows[0] || {};
    const credits = Number(summary.credits || 0);
    const debits = Number(summary.debits || 0);

    return {
      from: from || null,
      to: to || null,
      totalTransactions: Number(summary.total || 0),
      credits,
      debits,
      netTurnover: credits + debits,
      manualAdjustments: Number(summary.manual_count || 0),
      manualAdjustmentsSum: Number(summary.manual_sum || 0),
      byType: byTypeResult.rows.map((row) => ({
        type: row.type,
        count: Number(row.count || 0),
        sum: Number(row.sum || 0),
      })),
    };
  }

  static async getPaymentOverview({ limit = 20 } = {}) {
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);

    const [statusResult, recentResult] = await Promise.all([
      query(`
        SELECT
          status,
          COUNT(*)::int AS count,
          COALESCE(SUM(amount), 0)::numeric AS sum
        FROM wallet_transactions
        GROUP BY status
        ORDER BY count DESC
      `),
      query(
        `
        SELECT
          wt.*,
          u.name AS user_name,
          u.email AS user_email
        FROM wallet_transactions wt
        LEFT JOIN users u ON u.id = wt.user_id
        WHERE wt.status IN ('pending', 'failed', 'cancelled')
        ORDER BY wt.created_at DESC
        LIMIT $1
        `,
        [safeLimit]
      ),
    ]);

    return {
      byStatus: statusResult.rows.map((row) => ({
        status: row.status,
        count: Number(row.count || 0),
        sum: Number(row.sum || 0),
      })),
      attention: recentResult.rows.map(mapTransactionRow),
    };
  }

  static async getPromotionRevenue({ from = "", to = "" } = {}) {
    const values = [];
    const dateConditions = this._dateConditions(from, to, "wt.created_at", values);
    const whereParts = [
      "wt.status = 'completed'",
      "wt.type = 'payment'",
      `(
        wt.description ILIKE '%VIP%'
        OR wt.description ILIKE '%TOP%'
        OR wt.description ILIKE '%продвиж%'
        OR wt.description ILIKE '%vip%'
        OR wt.description ILIKE '%top%'
      )`,
    ];

    if (dateConditions.length) {
      whereParts.push(...dateConditions.map((c) => c.replace("created_at", "wt.created_at")));
    }

    const whereSql = `WHERE ${whereParts.join(" AND ")}`;

    const [summaryResult, itemsResult] = await Promise.all([
      query(
        `
        SELECT
          COUNT(*)::int AS count,
          COALESCE(SUM(ABS(wt.amount)), 0)::numeric AS revenue
        FROM wallet_transactions wt
        ${whereSql}
        `,
        values
      ),
      query(
        `
        SELECT
          wt.*,
          u.name AS user_name,
          u.email AS user_email
        FROM wallet_transactions wt
        LEFT JOIN users u ON u.id = wt.user_id
        ${whereSql}
        ORDER BY wt.created_at DESC
        LIMIT 20
        `,
        values
      ),
    ]);

    const summary = summaryResult.rows[0] || {};

    return {
      from: from || null,
      to: to || null,
      count: Number(summary.count || 0),
      revenue: Number(summary.revenue || 0),
      recent: itemsResult.rows.map(mapTransactionRow),
    };
  }

  static async getTransactionsCsv({ from = "", to = "" } = {}) {
    const values = [];
    const dateConditions = this._dateConditions(from, to, "wt.created_at", values);
    const whereParts = ["wt.status = 'completed'"];

    if (dateConditions.length) {
      whereParts.push(...dateConditions.map((c) => c.replace("created_at", "wt.created_at")));
    }

    const whereSql = `WHERE ${whereParts.join(" AND ")}`;

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

    return result.rows;
  }
}

module.exports = WalletModel;
