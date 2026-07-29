const { query } = require("../db");
const { buildListingFilters } = require("./Listing");

function mapSavedSearch(row) {
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    label: row.label || "",
    cat: row.cat || "",
    filters: row.filters || {},
    alertsEnabled: Boolean(row.alerts_enabled),
    lastAlertAt: row.last_alert_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class SavedSearchModel {
  static async listForUser(userId) {
    const result = await query(
      `
      SELECT *
      FROM saved_searches
      WHERE user_id = $1
      ORDER BY updated_at DESC
      LIMIT 20
      `,
      [userId]
    );

    return result.rows.map(mapSavedSearch);
  }

  static async upsert(userId, { id, label, cat = "", filters = {}, alertsEnabled = true }) {
    if (id) {
      const result = await query(
        `
        UPDATE saved_searches
        SET
          label = $3,
          cat = $4,
          filters = $5::jsonb,
          alerts_enabled = $6,
          updated_at = now()
        WHERE id = $1 AND user_id = $2
        RETURNING *
        `,
        [
          id,
          userId,
          String(label || "Поиск").trim(),
          String(cat || ""),
          JSON.stringify(filters || {}),
          Boolean(alertsEnabled),
        ]
      );

      return mapSavedSearch(result.rows[0]);
    }

    const result = await query(
      `
      INSERT INTO saved_searches (
        user_id,
        label,
        cat,
        filters,
        alerts_enabled
      )
      VALUES ($1, $2, $3, $4::jsonb, $5)
      RETURNING *
      `,
      [
        userId,
        String(label || "Поиск").trim(),
        String(cat || ""),
        JSON.stringify(filters || {}),
        Boolean(alertsEnabled),
      ]
    );

    return mapSavedSearch(result.rows[0]);
  }

  static async remove(userId, id) {
    const result = await query(
      `
      DELETE FROM saved_searches
      WHERE id = $1 AND user_id = $2
      RETURNING id
      `,
      [id, userId]
    );

    return Boolean(result.rows[0]);
  }

  static async listAlertEnabled() {
    const result = await query(
      `
      SELECT
        s.*,
        u.email,
        u.name AS user_name
      FROM saved_searches s
      JOIN users u ON u.id = s.user_id
      WHERE s.alerts_enabled = true
        AND u.email <> ''
      ORDER BY s.updated_at DESC
      `
    );

    return result.rows;
  }

  static async findMatches(savedSearch, { since }) {
    const filters = savedSearch.filters || {};
    const built = buildListingFilters({
      cat: savedSearch.cat || filters.cat || "",
      subcategory: filters.subcategory || "",
      search: filters.search || "",
      status: "approved",
      priceFrom: filters.priceFrom,
      priceTo: filters.priceTo,
      specs: filters.specs,
      location: filters.location,
      region: filters.region,
    });

    const where = built.conditions.join(" AND ");
    const values = [...built.values];
    let sinceClause = "";

    if (since) {
      values.push(since);
      sinceClause = `AND created_at > $${values.length}`;
    }

    const result = await query(
      `
      SELECT id, title, price, location, created_at
      FROM listings
      WHERE ${where}
      ${sinceClause}
      ORDER BY created_at DESC
      LIMIT 10
      `,
      values
    );

    return result.rows;
  }

  static async touchAlert(id) {
    await query(
      `
      UPDATE saved_searches
      SET last_alert_at = now(), updated_at = now()
      WHERE id = $1
      `,
      [id]
    );
  }
}

module.exports = SavedSearchModel;
