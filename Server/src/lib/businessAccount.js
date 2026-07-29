const PRIVATE_LISTING_LIMIT = 10;
const COMPANY_LISTING_LIMIT = 100;

const ACTIVE_LISTING_STATUSES = ["approved", "pending"];

function getListingLimit(user = {}) {
  if (user.sellerType === "company") {
    return COMPANY_LISTING_LIMIT;
  }

  return PRIVATE_LISTING_LIMIT;
}

function isCompanyAccount(user = {}) {
  return user.sellerType === "company";
}

function canSwitchToPrivate(user = {}, activeListings = 0) {
  return activeListings <= PRIVATE_LISTING_LIMIT;
}

module.exports = {
  PRIVATE_LISTING_LIMIT,
  COMPANY_LISTING_LIMIT,
  ACTIVE_LISTING_STATUSES,
  getListingLimit,
  isCompanyAccount,
  canSwitchToPrivate,
};
