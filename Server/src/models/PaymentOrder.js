const { query } = require("../db");

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
}

module.exports = PaymentOrderModel;
