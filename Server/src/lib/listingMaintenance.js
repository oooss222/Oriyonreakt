const { query } = require("../db");
const SiteSettings = require("../models/SiteSettings");
const SavedSearch = require("../models/SavedSearch");
const { runWithRlsContext, SYSTEM_CONTEXT } = require("./rlsContext");
const { runPremiumListingAutoBump } = require("./premiumListingAutoBump");
const {
  isMailConfigured,
  sendListingExpiryEmail,
  sendSavedSearchAlertEmail,
} = require("./mailer");

async function archiveExpiredListings() {
  const result = await query(
    `
    UPDATE listings
    SET status = 'archived', updated_at = now()
    WHERE status = 'approved'
      AND expires_at IS NOT NULL
      AND expires_at <= now()
    RETURNING id
    `
  );

  return result.rows.length;
}

async function sendExpiryNudges() {
  if (!isMailConfigured()) {
    return 0;
  }

  const result = await query(
    `
    SELECT
      l.id,
      l.title,
      l.expires_at,
      u.id AS user_id,
      u.email,
      u.name
    FROM listings l
    JOIN users u ON u.id = l.owner
    WHERE l.status = 'approved'
      AND l.expires_at IS NOT NULL
      AND l.expires_at > now()
      AND l.expires_at <= now() + interval '7 days'
      AND l.expiry_notice_sent_at IS NULL
      AND u.email <> ''
    ORDER BY l.expires_at ASC
    LIMIT 100
    `
  );

  const grouped = new Map();

  for (const row of result.rows) {
    const key = row.user_id;
    const daysLeft = Math.max(
      1,
      Math.ceil((Date.parse(row.expires_at) - Date.now()) / 86400000)
    );

    if (!grouped.has(key)) {
      grouped.set(key, {
        email: row.email,
        name: row.name,
        listings: [],
        listingIds: [],
      });
    }

    const bucket = grouped.get(key);
    bucket.listings.push({
      id: row.id,
      title: row.title,
      daysLeft,
    });
    bucket.listingIds.push(row.id);
  }

  let sent = 0;

  for (const bucket of grouped.values()) {
    await sendListingExpiryEmail({
      to: bucket.email,
      name: bucket.name,
      listings: bucket.listings,
    });

    if (bucket.listingIds.length) {
      await query(
        `
        UPDATE listings
        SET expiry_notice_sent_at = now()
        WHERE id = ANY($1::uuid[])
        `,
        [bucket.listingIds]
      );
    }

    sent += 1;
  }

  return sent;
}

async function processSavedSearchAlerts() {
  if (!isMailConfigured()) {
    return 0;
  }

  const savedRows = await SavedSearch.listAlertEnabled();
  let sent = 0;

  for (const row of savedRows) {
    const since = row.last_alert_at || row.created_at;
    const matches = await SavedSearch.findMatches(row, { since });

    if (!matches.length) {
      continue;
    }

    await sendSavedSearchAlertEmail({
      to: row.email,
      name: row.user_name,
      searchLabel: row.label || "Поиск",
      listings: matches.map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price,
      })),
    });

    await SavedSearch.touchAlert(row.id);
    sent += 1;
  }

  return sent;
}

async function runListingMaintenance() {
  const archived = await archiveExpiredListings();
  const nudges = await sendExpiryNudges();
  const alerts = await processSavedSearchAlerts();
  const autoBump = await runPremiumListingAutoBump();

  if (archived || nudges || alerts || autoBump.usersProcessed) {
    console.log(
      "LISTING_MAINTENANCE:",
      JSON.stringify({ archived, nudges, alerts, autoBump })
    );
  }
}

function startListingMaintenanceScheduler() {
  const intervalMs = Number(process.env.LISTING_MAINTENANCE_INTERVAL_MS || 3600000);

  // Maintenance spans every owner's listings, so it needs the system role
  // explicitly now that queries default to anonymous.
  const run = () =>
    runWithRlsContext(SYSTEM_CONTEXT, runListingMaintenance).catch((error) => {
      console.error("LISTING_MAINTENANCE_ERROR:", error?.message);
    });

  setInterval(run, intervalMs);
  setTimeout(run, 15000);
}

module.exports = {
  runListingMaintenance,
  startListingMaintenanceScheduler,
};
