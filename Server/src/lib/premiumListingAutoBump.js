const { query } = require("../db");
const Listing = require("../models/Listing");

async function runPremiumListingAutoBump() {
  const dueUsers = await query(
    `
    SELECT
      id,
      listing_auto_bump_interval_hours AS interval_hours
    FROM users
    WHERE seller_type = 'company'
      AND listing_auto_bump_enabled = true
      AND listing_auto_bump_interval_hours > 0
      AND (
        listing_auto_bump_last_at IS NULL
        OR listing_auto_bump_last_at
          + (listing_auto_bump_interval_hours || ' hours')::interval <= now()
      )
    ORDER BY listing_auto_bump_last_at NULLS FIRST
    LIMIT 50
    `
  );

  let usersProcessed = 0;
  let listingsUpdated = 0;

  for (const row of dueUsers.rows) {
    const count = await Listing.bumpAllApprovedForOwner(row.id);

    await query(
      `
      UPDATE users
      SET listing_auto_bump_last_at = now(), updated_at = now()
      WHERE id = $1
      `,
      [row.id]
    );

    usersProcessed += 1;
    listingsUpdated += count;
  }

  return { usersProcessed, listingsUpdated };
}

module.exports = {
  runPremiumListingAutoBump,
};
