const ACTIVE_LISTING_STATUSES = ["approved", "pending"];

function getListingLimit() {
  return null;
}

function hasListingLimit() {
  return false;
}

function isCompanyAccount(user = {}) {
  return user.sellerType === "company";
}

function canSwitchToPrivate() {
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
  getListingLimit,
  hasListingLimit,
  isCompanyAccount,
  canSwitchToPrivate,
  MIN_AUTO_BUMP_INTERVAL_HOURS,
  MAX_AUTO_BUMP_INTERVAL_HOURS,
  normalizeAutoBumpIntervalHours,
};
