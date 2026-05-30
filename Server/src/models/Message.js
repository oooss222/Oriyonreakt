const { query, mapMessage } = require("../db");

class MessageModel {
  static async create({ listingId, senderId, text }) {
    const listingResult = await query(
      `
      SELECT owner
      FROM listings
      WHERE id = $1
      LIMIT 1
      `,
      [listingId]
    );

    const listing = listingResult.rows[0];

    if (!listing) {
      throw new Error("LISTING_NOT_FOUND");
    }

    if (String(listing.owner) === String(senderId)) {
      throw new Error("CANNOT_MESSAGE_YOURSELF");
    }

    const result = await query(
      `
      INSERT INTO messages (
        listing_id,
        sender_id,
        receiver_id,
        text
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [listingId, senderId, listing.owner, text]
    );

    return mapMessage(result.rows[0]);
  }

  static async getThread({ listingId, userId, role }) {
    const isAdmin = role === "admin" || role === "super_admin";

    const values = [listingId];

    let accessSql = "";

    if (!isAdmin) {
      values.push(userId);

      accessSql = `
        AND (
          m.sender_id = $2
          OR m.receiver_id = $2
        )
      `;
    }

    const result = await query(
      `
      SELECT
        m.*,
        l.title AS listing_title,
        l.images->0->>'url' AS listing_image,
        s.name AS sender_name,
        s.email AS sender_email,
        r.name AS receiver_name,
        r.email AS receiver_email
      FROM messages m
      LEFT JOIN listings l ON l.id = m.listing_id
      LEFT JOIN users s ON s.id = m.sender_id
      LEFT JOIN users r ON r.id = m.receiver_id
      WHERE m.listing_id = $1
      ${accessSql}
      ORDER BY m.created_at ASC
      `,
      values
    );

    return result.rows.map(mapMessage);
  }

  static async inbox({ userId, role }) {
    const isAdmin = role === "admin" || role === "super_admin";

    const result = await query(
      `
      SELECT DISTINCT ON (m.listing_id, LEAST(m.sender_id, m.receiver_id), GREATEST(m.sender_id, m.receiver_id))
        m.*,
        l.title AS listing_title,
        l.images->0->>'url' AS listing_image,
        s.name AS sender_name,
        s.email AS sender_email,
        r.name AS receiver_name,
        r.email AS receiver_email
      FROM messages m
      LEFT JOIN listings l ON l.id = m.listing_id
      LEFT JOIN users s ON s.id = m.sender_id
      LEFT JOIN users r ON r.id = m.receiver_id
      ${isAdmin ? "" : "WHERE m.sender_id = $1 OR m.receiver_id = $1"}
      ORDER BY
        m.listing_id,
        LEAST(m.sender_id, m.receiver_id),
        GREATEST(m.sender_id, m.receiver_id),
        m.created_at DESC
      `,
      isAdmin ? [] : [userId]
    );

    return result.rows.map(mapMessage);
  }
}

module.exports = MessageModel;