const { query } = require("../db");

class ChatThreadModel {
  static async upsertSettings(userId, listingId, peerId, patch = {}) {
    const fields = [];
    const values = [userId, listingId, peerId];

    if (typeof patch.isArchived === "boolean") {
      fields.push("is_archived");
      values.push(patch.isArchived);
    }

    if (typeof patch.isMuted === "boolean") {
      fields.push("is_muted");
      values.push(patch.isMuted);
    }

    if (!fields.length) {
      return this.getSettings(userId, listingId, peerId);
    }

    const insertCols = ["user_id", "listing_id", "peer_id", ...fields];
    const insertPlaceholders = insertCols.map((_, i) => `$${i + 1}`);
    const updates = fields
      .map((field) => `${field} = EXCLUDED.${field}`)
      .concat(["updated_at = now()"]);

    const result = await query(
      `
      INSERT INTO chat_thread_settings (${insertCols.join(", ")})
      VALUES (${insertPlaceholders.join(", ")})
      ON CONFLICT (user_id, listing_id, peer_id)
      DO UPDATE SET ${updates.join(", ")}
      RETURNING *
      `,
      values
    );

    return mapSettings(result.rows[0]);
  }

  static async getSettings(userId, listingId, peerId) {
    const result = await query(
      `
      SELECT *
      FROM chat_thread_settings
      WHERE user_id = $1
        AND listing_id = $2
        AND peer_id = $3
      LIMIT 1
      `,
      [userId, listingId, peerId]
    );

    return mapSettings(result.rows[0]);
  }

  static async blockUser(blockerId, blockedId) {
    if (String(blockerId) === String(blockedId)) {
      throw new Error("CANNOT_BLOCK_SELF");
    }

    await query(
      `
      INSERT INTO user_chat_blocks (blocker_id, blocked_id)
      VALUES ($1, $2)
      ON CONFLICT (blocker_id, blocked_id) DO NOTHING
      `,
      [blockerId, blockedId]
    );

    return { ok: true };
  }

  static async unblockUser(blockerId, blockedId) {
    await query(
      `
      DELETE FROM user_chat_blocks
      WHERE blocker_id = $1
        AND blocked_id = $2
      `,
      [blockerId, blockedId]
    );

    return { ok: true };
  }

  static async isBlocked(blockerId, blockedId) {
    const result = await query(
      `
      SELECT 1
      FROM user_chat_blocks
      WHERE blocker_id = $1
        AND blocked_id = $2
      LIMIT 1
      `,
      [blockerId, blockedId]
    );

    return Boolean(result.rows[0]);
  }

  static async isBlockedEitherWay(userA, userB) {
    const result = await query(
      `
      SELECT 1
      FROM user_chat_blocks
      WHERE (blocker_id = $1 AND blocked_id = $2)
         OR (blocker_id = $2 AND blocked_id = $1)
      LIMIT 1
      `,
      [userA, userB]
    );

    return Boolean(result.rows[0]);
  }

  static async listBlockedUserIds(userId) {
    const result = await query(
      `
      SELECT blocked_id
      FROM user_chat_blocks
      WHERE blocker_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return result.rows.map((row) => String(row.blocked_id));
  }
}

function mapSettings(row) {
  if (!row) {
    return {
      isArchived: false,
      isMuted: false,
    };
  }

  return {
    isArchived: Boolean(row.is_archived),
    isMuted: Boolean(row.is_muted),
    updatedAt: row.updated_at,
  };
}

module.exports = ChatThreadModel;
