const ALLOWED_TYPES = new Set([
  "listing_view",
  "listing_click",
  "search",
  "favorite",
  "contact_intent",
]);

const { query } = require("../db");

class UserEvent {
  static isAllowedType(type) {
    return ALLOWED_TYPES.has(String(type || "").trim());
  }

  static async insertBatch(events = [], meta = {}) {
    const { userId = null, sessionId = "", city = "" } = meta;
    const rows = [];

    for (const event of events) {
      const type = String(event.type || "").trim();
      if (!this.isAllowedType(type)) continue;

      rows.push({
        userId,
        sessionId: String(sessionId || event.sessionId || "").trim(),
        eventType: type,
        listingId: event.listingId ? String(event.listingId) : null,
        cat: event.cat ? String(event.cat).trim() : "",
        subcategory: event.subcategory ? String(event.subcategory).trim() : "",
        price: event.price != null ? String(event.price) : "",
        payload: event.meta && typeof event.meta === "object" ? event.meta : {},
        city: String(city || event.city || "").trim(),
        createdAt: event.ts ? new Date(Number(event.ts)) : new Date(),
      });
    }

    if (!rows.length) return 0;

    const values = [];
    const placeholders = rows
      .map((row, index) => {
        const base = index * 10;
        values.push(
          row.userId,
          row.sessionId,
          row.eventType,
          row.listingId,
          row.cat,
          row.subcategory,
          row.price,
          JSON.stringify(row.payload),
          row.city,
          row.createdAt
        );
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}::jsonb, $${base + 9}, $${base + 10})`;
      })
      .join(", ");

    await query(
      `
      INSERT INTO user_events (
        user_id,
        session_id,
        event_type,
        listing_id,
        cat,
        subcategory,
        price,
        payload,
        city,
        created_at
      )
      VALUES ${placeholders}
      `,
      values
    );

    return rows.length;
  }

  static async findRecentByIdentity({ userId, sessionId, days = 7, limit = 500 }) {
    const safeLimit = Math.min(Math.max(Number(limit) || 500, 1), 1000);
    const safeDays = Math.min(Math.max(Number(days) || 7, 1), 30);
    const values = [];
    let identityClause = "";

    if (userId) {
      values.push(userId);
      identityClause = "user_id = $1";
    } else if (sessionId) {
      values.push(String(sessionId));
      identityClause = "session_id = $1";
    } else {
      return [];
    }

    values.push(String(safeDays));
    values.push(safeLimit);

    const result = await query(
      `
      SELECT
        user_id,
        session_id,
        event_type,
        listing_id,
        cat,
        subcategory,
        price,
        payload,
        city,
        created_at
      FROM user_events
      WHERE ${identityClause}
        AND created_at >= now() - ($2::text || ' days')::interval
      ORDER BY created_at DESC
      LIMIT $3
      `,
      values
    );

    return result.rows;
  }
}

module.exports = UserEvent;
