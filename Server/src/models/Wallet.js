const { query, mapWalletTransaction } = require("../db");

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
}

module.exports = WalletModel;
