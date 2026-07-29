const { query } = require("../db");

function mapReview(row) {
  if (!row) return null;

  return {
    id: row.id,
    sellerId: row.seller_id,
    reviewerId: row.reviewer_id,
    listingId: row.listing_id,
    rating: Number(row.rating || 0),
    comment: row.comment || "",
    reviewerName: row.reviewer_name || "",
    createdAt: row.created_at,
  };
}

class ReviewModel {
  static async getSellerSummary(sellerId) {
    const result = await query(
      `
      SELECT
        COUNT(*)::int AS count,
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS average
      FROM seller_reviews
      WHERE seller_id = $1
      `,
      [sellerId]
    );

    const row = result.rows[0] || {};

    return {
      count: Number(row.count || 0),
      average: Number(row.average || 0),
    };
  }

  static async listForSeller(sellerId, { limit = 20, offset = 0 } = {}) {
    const result = await query(
      `
      SELECT
        r.*,
        u.name AS reviewer_name
      FROM seller_reviews r
      LEFT JOIN users u ON u.id = r.reviewer_id
      WHERE r.seller_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [sellerId, limit, offset]
    );

    return result.rows.map(mapReview);
  }

  static async create({ sellerId, reviewerId, listingId, rating, comment = "" }) {
    const numericRating = Number(rating);

    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      throw new Error("INVALID_RATING");
    }

    if (String(sellerId) === String(reviewerId)) {
      throw new Error("SELF_REVIEW");
    }

    const result = await query(
      `
      INSERT INTO seller_reviews (
        seller_id,
        reviewer_id,
        listing_id,
        rating,
        comment
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (seller_id, reviewer_id, listing_id)
      DO UPDATE SET
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        created_at = now()
      RETURNING *
      `,
      [sellerId, reviewerId, listingId || null, numericRating, String(comment || "").trim()]
    );

    const created = mapReview(result.rows[0]);

    if (!created) {
      return null;
    }

    const reviewer = await query(
      `SELECT name FROM users WHERE id = $1 LIMIT 1`,
      [reviewerId]
    );

    return {
      ...created,
      reviewerName: reviewer.rows[0]?.name || "",
    };
  }
}

module.exports = ReviewModel;
