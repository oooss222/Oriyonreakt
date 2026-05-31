const { query, mapMessage } = require("../db");

class MessageModel {
  static async create({ listingId, senderId, text, receiverId }) {
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

  let finalReceiverId = receiverId || listing.owner;

  if (String(listing.owner) === String(senderId)) {
    if (!receiverId) {
      const lastDialogResult = await query(
        `
        SELECT sender_id
        FROM messages
        WHERE listing_id = $1
          AND sender_id <> $2
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [listingId, senderId]
      );

      finalReceiverId = lastDialogResult.rows[0]?.sender_id;
    }

    if (!finalReceiverId) {
      throw new Error("RECEIVER_REQUIRED");
    }
  }

  if (String(finalReceiverId) === String(senderId)) {
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
    [listingId, senderId, finalReceiverId, text]
  );

  return mapMessage(result.rows[0]);
}

  static async getThread({ listingId, userId, role, peerId }) {
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

    await query(
      `
      UPDATE messages
      SET is_read = true
      WHERE listing_id = $1
        AND receiver_id = $2
        AND is_read = false
      `,
      [listingId, userId]
    );
  }

  const result = await query(
    `
    SELECT
      m.*,
      0::int AS unread_count,
      l.title AS listing_title,
      l.images->0->>'url' AS listing_image,
      s.name AS sender_name,
      s.email AS sender_email,
    s.last_seen AS sender_last_seen,
    r.name AS receiver_name,
    r.email AS receiver_email,
    r.last_seen AS receiver_last_seen
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
    WITH dialog_messages AS (
      SELECT
        m.*,
        LEAST(m.sender_id, m.receiver_id) AS user_a,
        GREATEST(m.sender_id, m.receiver_id) AS user_b
      FROM messages m
      ${isAdmin ? "" : "WHERE m.sender_id = $1 OR m.receiver_id = $1"}
    ),
    unread AS (
      SELECT
        listing_id,
        user_a,
        user_b,
        COUNT(*) FILTER (
          WHERE receiver_id = $1
            AND is_read = false
        )::int AS unread_count
      FROM dialog_messages
      GROUP BY listing_id, user_a, user_b
    ),
    latest AS (
      SELECT DISTINCT ON (listing_id, user_a, user_b)
        *
      FROM dialog_messages
      ORDER BY listing_id, user_a, user_b, created_at DESC
    )
    SELECT
      latest.*,
      COALESCE(unread.unread_count, 0)::int AS unread_count,
      l.title AS listing_title,
      l.images->0->>'url' AS listing_image,
      s.name AS sender_name,
      s.email AS sender_email,
    s.last_seen AS sender_last_seen,
    r.name AS receiver_name,
    r.email AS receiver_email,
    r.last_seen AS receiver_last_seen
    FROM latest
    LEFT JOIN unread
      ON unread.listing_id = latest.listing_id
      AND unread.user_a = latest.user_a
      AND unread.user_b = latest.user_b
    LEFT JOIN listings l ON l.id = latest.listing_id
    LEFT JOIN users s ON s.id = latest.sender_id
    LEFT JOIN users r ON r.id = latest.receiver_id
    ORDER BY latest.created_at DESC
    `,
    isAdmin ? [userId] : [userId]
  );

  return result.rows.map(mapMessage);
}
}

module.exports = MessageModel;