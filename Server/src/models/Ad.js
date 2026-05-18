const { query, mapAd } = require("../db");

class AdModel {
  static async create(data) {
    const result = await query(
      `
      INSERT INTO ads (
        title,
        image_url,
        target_url,
        placement,
        is_active,
        created_by,
        starts_at,
        ends_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8
      )
      RETURNING *
      `,
      [
        data.title || "",
        data.imageUrl,
        data.targetUrl || "",
        data.placement || "home_top",
        data.isActive !== false,
        data.createdBy || null,
        data.startsAt || null,
        data.endsAt || null,
      ]
    );

    return mapAd(result.rows[0]);
  }

  static async findAll() {
    const result = await query(
      `
      SELECT *
      FROM ads
      ORDER BY created_at DESC
      `
    );

    return result.rows.map(mapAd);
  }

  static async findActiveByPlacement(placement) {
    const result = await query(
      `
      SELECT *
      FROM ads
      WHERE placement = $1
        AND is_active = true
        AND (
          starts_at IS NULL
          OR starts_at <= now()
        )
        AND (
          ends_at IS NULL
          OR ends_at >= now()
        )
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [placement]
    );

    return mapAd(result.rows[0]);
  }

  static async delete(id) {
    await query(
      `
      DELETE FROM ads
      WHERE id = $1
      `,
      [id]
    );

    return true;
  }

  static async toggle(id, isActive) {
    const result = await query(
      `
      UPDATE ads
      SET
        is_active = $2,
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id, isActive]
    );

    return mapAd(result.rows[0]);
  }
}

module.exports = AdModel;