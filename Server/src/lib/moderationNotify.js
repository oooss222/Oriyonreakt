const User = require("../models/User");
const Listing = require("../models/Listing");
const { sendListingModerationEmail } = require("./mailer");

const MODERATOR_ROLES = new Set(["moderator", "admin", "super_admin"]);

async function getPendingCount() {
  return Listing.countPending();
}

function emitModerationQueue(io, payload = {}) {
  if (!io) return;

  io.to("moderators").emit("moderation:queue", payload);
}

async function notifyModerators(io, { type, listing } = {}) {
  const pendingCount = await getPendingCount();

  emitModerationQueue(io, {
    type: type || "update",
    listing: listing || null,
    pendingCount,
    at: new Date().toISOString(),
  });
}

async function notifySellerModerationResult(listing, action, reason = "") {
  if (!listing?.owner) return;

  try {
    const owner = await User.findById(listing.owner);

    if (!owner?.email) return;

    await sendListingModerationEmail({
      to: owner.email,
      name: owner.name,
      title: listing.title,
      listingId: listing.id,
      action,
      reason,
    });
  } catch (e) {
    console.error("MODERATION_SELLER_EMAIL_ERROR:", e?.message);
  }
}

function isModeratorRole(role) {
  return MODERATOR_ROLES.has(role);
}

module.exports = {
  MODERATOR_ROLES,
  isModeratorRole,
  emitModerationQueue,
  notifyModerators,
  notifySellerModerationResult,
  getPendingCount,
};
