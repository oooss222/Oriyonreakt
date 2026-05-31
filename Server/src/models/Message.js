const { query, mapMessage } = require("../db");

function isAdminRole(role) {
  return role === "admin" || role === "super_admin";
}

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
    const isAdmin = isAdminRole(role);

    if (!peerId) {
      throw new Error("PEER_REQUIRED");
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
        AND (
          (m.sender_id = $2 AND m.receiver_id = $3)
          OR
          (m.sender_id = $3 AND m.receiver_id = $2)
        )
        ${
          isAdmin
            ? ""
            : `
        AND (
          m.sender_id = $2
          OR m.receiver_id = $2
        )
        `
        }
      ORDER BY m.created_at ASC
      `,
      isAdmin
        ? [listingId, userId, peerId]
        : [listingId, userId, peerId]
    );

    if (!isAdmin) {
      await query(
        `
        UPDATE messages
        SET is_read = true
        WHERE listing_id = $1
          AND receiver_id = $2
          AND sender_id = $3
          AND is_read = false
        `,
        [listingId, userId, peerId]
      );
    }

    return result.rows.map(mapMessage);
  }

  static async inbox({ userId, role }) {
    const isAdmin = isAdminRole(role);

    const result = await query(
      `
      WITH visible_messages AS (
        SELECT
          m.*,
          l.owner AS listing_owner,
          CASE
            WHEN m.sender_id = l.owner THEN m.receiver_id
            ELSE m.sender_id
          END AS buyer_id
        FROM messages m
        INNER JOIN listings l ON l.id = m.listing_id
        ${
          isAdmin
            ? ""
            : `
        WHERE
          m.sender_id = $1
          OR m.receiver_id = $1
        `
        }
      ),
      dialog_messages AS (
        SELECT
          *,
          listing_owner AS seller_id,
          buyer_id AS peer_buyer_id
        FROM visible_messages
      ),
      unread AS (
        SELECT
          listing_id,
          seller_id,
          peer_buyer_id,
          COUNT(*) FILTER (
            WHERE receiver_id = $1
              AND is_read = false
          )::int AS unread_count
        FROM dialog_messages
        GROUP BY listing_id, seller_id, peer_buyer_id
      ),
      latest AS (
        SELECT DISTINCT ON (
          listing_id,
          seller_id,
          peer_buyer_id
        )
          *
        FROM dialog_messages
        ORDER BY
          listing_id,
          seller_id,
          peer_buyer_id,
          created_at DESC
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
        AND unread.seller_id = latest.seller_id
        AND unread.peer_buyer_id = latest.peer_buyer_id
      LEFT JOIN listings l ON l.id = latest.listing_id
      LEFT JOIN users s ON s.id = latest.sender_id
      LEFT JOIN users r ON r.id = latest.receiver_id
      ORDER BY latest.created_at DESC
      `,
      [userId]
    );

    return result.rows.map(mapMessage);
  }
}

module.exports = MessageModel;