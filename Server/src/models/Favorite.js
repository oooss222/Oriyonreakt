const { query } = require("../db");
const ListingModel = require("./Listing");

class FavoriteModel {
  static async add(userId, listingId) {
    await query(
      `
      INSERT INTO favorites (
        user_id,
        listing_id
      )
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
      [userId, listingId]
    );

    return true;
  }

  static async remove(userId, listingId) {
    await query(
      `
      DELETE FROM favorites
      WHERE user_id = $1
      AND listing_id = $2
      `,
      [userId, listingId]
    );

    return true;
  }

  static async getUserFavorites(userId) {
    const result = await query(
      `
      SELECT listing_id
      FROM favorites
      WHERE user_id = $1
      `,
      [userId]
    );

    const ids = result.rows.map((r) => r.listing_id);

    const listings = await Promise.all(
      ids.map((id) => ListingModel.findById(id))
    );

    return listings.filter(Boolean);
  }

  static async isFavorite(userId, listingId) {
    const result = await query(
      `
      SELECT 1
      FROM favorites
      WHERE user_id = $1
      AND listing_id = $2
      LIMIT 1
      `,
      [userId, listingId]
    );

    return result.rows.length > 0;
  }
}

module.exports = FavoriteModel;