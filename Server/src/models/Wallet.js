const { query, mapWalletTransaction } = require("../db");

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
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const result = await query(
      `
      SELECT *
      FROM wallet_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [userId, safeLimit, safeOffset]
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

    if (type && type !== "all") {
      values.push(type);
      conditions.push(`wt.type = $${values.length}`);
    }

    if (userId) {
      values.push(userId);
      conditions.push(`wt.user_id = $${values.length}`);
    }

    const search = String(q || "").trim();

    if (search) {
      values.push(`%${search}%`);
      const idx = values.length;

      conditions.push(`
        (
          u.email ILIKE $${idx}
          OR u.name ILIKE $${idx}
          OR wt.description ILIKE $${idx}
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
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const countResult = await query(
      `
      SELECT COUNT(*)::int AS total
      FROM wallet_transactions wt
      LEFT JOIN users u ON u.id = wt.user_id
      ${whereSql}
      `,
      values
    );

    const listValues = [...values, safeLimit, safeOffset];
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
      limit: safeLimit,
      offset: safeOffset,
      page: Math.floor(safeOffset / safeLimit) + 1,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
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
}

module.exports = WalletModel;
