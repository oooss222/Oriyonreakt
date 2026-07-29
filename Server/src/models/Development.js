const { query } = require("../db");

function mapDevelopment(row) {
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    developer: row.developer || "",
    city: row.city || "",
    district: row.district || "",
    address: row.address || "",
    description: row.description || "",
    imageUrl: row.image_url || "",
    completionDate: row.completion_date || "",
    amenities: row.amenities || [],
    lat: row.lat != null ? Number(row.lat) : null,
    lng: row.lng != null ? Number(row.lng) : null,
  };
}

class DevelopmentModel {
  static async list({ city = "" } = {}) {
    const values = [];
    let where = "1=1";

    if (city) {
      values.push(String(city).trim());
      where += ` AND city = $${values.length}`;
    }

    const result = await query(
      `
      SELECT *
      FROM re_developments
      WHERE ${where}
      ORDER BY name ASC
      `,
      values
    );

    return result.rows.map(mapDevelopment);
  }

  static async findBySlug(slug) {
    const result = await query(
      `
      SELECT *
      FROM re_developments
      WHERE slug = $1
      LIMIT 1
      `,
      [String(slug || "").trim()]
    );

    return mapDevelopment(result.rows[0]);
  }
}

module.exports = DevelopmentModel;
