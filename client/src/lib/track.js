import { api } from "./api";
import {
  applyEventToProfile,
  getDefaultCity,
  getOrCreateSessionId,
  readRecommendationProfile,
  writeRecommendationProfile,
} from "./recommendationProfile";
import { hasAnalyticsConsent } from "./cookieConsent";

const queue = [];
let flushTimer = null;
let flushing = false;

function scheduleFlush() {
  if (flushTimer) return;

  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    flushEvents();
  }, 2000);
}

async function flushEvents() {
  if (flushing || !queue.length) return;

  flushing = true;
  const batch = queue.splice(0, 20);

  try {
    const profile = readRecommendationProfile();

    await api.trackEvents({
      sessionId: profile.sid || getOrCreateSessionId(),
      city: profile.city || getDefaultCity(),
      events: batch,
    });
  } catch {
    queue.unshift(...batch);
    scheduleFlush();
  } finally {
    flushing = false;

    if (queue.length) {
      scheduleFlush();
    }
  }
}

export function trackEvent(event) {
  if (!event?.type || !hasAnalyticsConsent()) return;

  const payload = {
    ...event,
    ts: event.ts || Date.now(),
    city: event.city || getDefaultCity(),
  };

  const profile = applyEventToProfile(readRecommendationProfile(), payload);
  writeRecommendationProfile(profile);

  queue.push(payload);
  scheduleFlush();
}

export function trackListingView(listing) {
  if (!listing) return;

  trackEvent({
    type: "listing_view",
    listingId: listing.id || listing._id,
    cat: listing.cat,
    subcategory: listing.subcategory,
    price: listing.price,
    meta: { source: "ad_details" },
  });
}

export function trackListingClick(listing, meta = {}) {
  if (!listing) return;

  trackEvent({
    type: "listing_click",
    listingId: listing.id || listing._id,
    cat: listing.cat,
    subcategory: listing.subcategory,
    price: listing.price,
    meta,
  });
}

export function trackSearch(query, filters = {}) {
  const normalized = String(query || "").trim();
  if (!normalized) return;

  trackEvent({
    type: "search",
    query: normalized,
    cat: filters.cat || "",
    meta: filters,
  });
}

export function trackFavorite(listing) {
  if (!listing) return;

  trackEvent({
    type: "favorite",
    listingId: listing.id || listing._id,
    cat: listing.cat,
    subcategory: listing.subcategory,
    price: listing.price,
  });
}

export function trackContactIntent(listing, channel = "message") {
  if (!listing) return;

  trackEvent({
    type: "contact_intent",
    listingId: listing.id || listing._id,
    cat: listing.cat,
    subcategory: listing.subcategory,
    price: listing.price,
    meta: { channel },
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (!queue.length) return;
    flushEvents();
  });
}
