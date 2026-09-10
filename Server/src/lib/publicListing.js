/**
 * Moderation bookkeeping that anonymous visitors must not see. Leaving these on
 * the public feed exposed reviewer ids and internal notes, and previous_snapshot
 * alone is a full copy of the listing, so it also bloated every response.
 *
 * Owners still receive them through /listings/mine, and staff through the admin
 * and moderation routes.
 */
const PRIVATE_FIELDS = [
  "rejectionReason",
  "moderatedBy",
  "moderatedAt",
  "moderationFlags",
  "previousSnapshot",
  "autoModerationReason",
  "appealStatus",
  "appealText",
  "appealAt",
  "expiryNoticeSentAt",
];

function toPublicListing(listing) {
  if (!listing || typeof listing !== "object") return listing;

  const copy = { ...listing };

  for (const field of PRIVATE_FIELDS) {
    delete copy[field];
  }

  return copy;
}

function toPublicListings(listings) {
  return Array.isArray(listings) ? listings.map(toPublicListing) : listings;
}

module.exports = {
  PRIVATE_FIELDS,
  toPublicListing,
  toPublicListings,
};
