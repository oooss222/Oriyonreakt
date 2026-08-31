const ACTIVE_LISTING_STATUSES = ["approved", "pending"];

/** Active listing cap for private sellers. Company accounts are unlimited. */
const PRIVATE_LISTING_LIMIT = 30;

function isCompanyAccount(user = {}) {
  return user.sellerType === "company";
}

function getListingLimit(user = {}) {
  if (isCompanyAccount(user)) return null;
  return PRIVATE_LISTING_LIMIT;
}

function hasListingLimit(user = {}) {
  return getListingLimit(user) != null;
}

function canSwitchToPrivate(user = {}) {
  return true;
}

const MIN_AUTO_BUMP_INTERVAL_HOURS = 1;
const MAX_AUTO_BUMP_INTERVAL_HOURS = 720;

function normalizeAutoBumpIntervalHours(value) {
  const hours = Math.round(Number(value));

  if (!Number.isFinite(hours)) {
    return 24;
  }

  return Math.min(
    MAX_AUTO_BUMP_INTERVAL_HOURS,
    Math.max(MIN_AUTO_BUMP_INTERVAL_HOURS, hours)
  );
}

module.exports = {
  ACTIVE_LISTING_STATUSES,
  PRIVATE_LISTING_LIMIT,
  getListingLimit,
  hasListingLimit,
  isCompanyAccount,
  canSwitchToPrivate,
  MIN_AUTO_BUMP_INTERVAL_HOURS,
  MAX_AUTO_BUMP_INTERVAL_HOURS,
  normalizeAutoBumpIntervalHours,
};
