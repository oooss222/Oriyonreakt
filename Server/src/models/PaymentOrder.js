const { query, PAYMENT_ORDER_STATUSES } = require("../db");
const { assertEnumValue, safeLimit, safeOffset } = require("../lib/sqlSafety");

function mapPaymentOrder(row) {
  if (!row) return null;

  return {
    id: row.id,
    _id: row.id,
    userId: row.user_id,
    orderId: row.order_id,
    amount: Number(row.amount || 0),
    status: row.status,
    provider: row.provider,
    transactionId: row.transaction_id || "",
    providerStatus: row.provider_status || "",
    callbackPayload: row.callback_payload || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class PaymentOrderModel {
  static async create({ userId, orderId, amount, provider = "alif" }) {
    const result = await query(
      `
      INSERT INTO payment_orders (
        user_id,
        order_id,
        amount,
        provider
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [userId, orderId, amount, provider]
    );

    return mapPaymentOrder(result.rows[0]);
  }

  static async findByOrderId(orderId) {
    const result = await query(
      `
      SELECT *
      FROM payment_orders
      WHERE order_id = $1
      LIMIT 1
      `,
      [orderId]
    );

    return mapPaymentOrder(result.rows[0]);
  }

  static async findById(id) {
    const result = await query(
      `
      SELECT *
      FROM payment_orders
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    return mapPaymentOrder(result.rows[0]);
  }

  static async updateStatus(orderId, { status, transactionId, providerStatus, callbackPayload }) {
    const result = await query(
      `
      UPDATE payment_orders
      SET
        status = COALESCE($2, status),
        transaction_id = COALESCE($3, transaction_id),
        provider_status = COALESCE($4, provider_status),
        callback_payload = COALESCE($5::jsonb, callback_payload),
        updated_at = now()
      WHERE order_id = $1
      RETURNING *
      `,
      [
        orderId,
        status || null,
        transactionId || null,
        providerStatus || null,
        callbackPayload ? JSON.stringify(callbackPayload) : null,
      ]
    );

    return mapPaymentOrder(result.rows[0]);
  }

  static async markPaid(orderId, { transactionId, providerStatus, callbackPayload }) {
    const result = await query(
      `
      UPDATE payment_orders
      SET
        status = 'paid',
        transaction_id = COALESCE($2, transaction_id),
        provider_status = COALESCE($3, provider_status),
        callback_payload = COALESCE($4::jsonb, callback_payload),
        updated_at = now()
      WHERE order_id = $1 AND status <> 'paid'
      RETURNING *
      `,
      [
        orderId,
        transactionId || null,
        providerStatus || null,
        callbackPayload ? JSON.stringify(callbackPayload) : null,
      ]
    );

    return mapPaymentOrder(result.rows[0]);
  }

  static async listForAdmin({ status = "", limit = 50, offset = 0 } = {}) {
    const values = [];
    let where = "WHERE 1=1";

    if (status) {
      const safeStatus = assertEnumValue(status, PAYMENT_ORDER_STATUSES, "STATUS");
      values.push(safeStatus);
      where += ` AND po.status = $${values.length}`;
    }

    values.push(safeLimit(limit, { fallback: 50, max: 200 }));
    const limitIdx = values.length;
    values.push(safeOffset(offset));
    const offsetIdx = values.length;

    const result = await query(
      `
      SELECT
        po.*,
        u.email AS user_email,
        u.name AS user_name
      FROM payment_orders po
      LEFT JOIN users u ON u.id = po.user_id
      ${where}
      ORDER BY po.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `,
      values
    );

    const countResult = await query(
      `
      SELECT
        status,
        COUNT(*)::int AS count,
        COALESCE(SUM(amount), 0) AS sum
      FROM payment_orders
      GROUP BY status
      ORDER BY status
      `
    );

    return {
      items: result.rows.map((row) => ({
        ...mapPaymentOrder(row),
        userEmail: row.user_email || "",
        userName: row.user_name || "",
      })),
      byStatus: countResult.rows.map((row) => ({
        status: row.status,
        count: Number(row.count || 0),
        sum: Number(row.sum || 0),
      })),
    };
  }
}

module.exports = PaymentOrderModel;
