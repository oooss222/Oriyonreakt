const PROFILE_KEY = "oriyon_pref";
const SESSION_KEY = "oriyon_sid";
const PROFILE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_VIEWED = 20;
const MAX_SEARCHES = 10;
const MAX_PRICES = 40;

export const EVENT_WEIGHT = {
  listing_view: 1,
  listing_click: 2,
  search: 3,
  favorite: 4,
  contact_intent: 10,
};

function randomId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `sid_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateSessionId() {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;

    const next = randomId();
    localStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return randomId();
  }
}

export function getDefaultCity() {
  try {
    return localStorage.getItem("oriyon_city") || "Душанбе";
  } catch {
    return "Душанбе";
  }
}

export function setDefaultCity(city) {
  try {
    if (city) localStorage.setItem("oriyon_city", city);
  } catch {
    // ignore storage errors
  }
}

function parsePrice(value) {
  if (value == null || value === "") return null;
  const n = Number(String(value).replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function pruneProfile(profile, now = Date.now()) {
  const next = {
    v: 1,
    sid: profile.sid || getOrCreateSessionId(),
    city: profile.city || getDefaultCity(),
    updatedAt: now,
    cats: profile.cats && typeof profile.cats === "object" ? profile.cats : {},
    prices: Array.isArray(profile.prices) ? profile.prices : [],
    viewed: Array.isArray(profile.viewed) ? profile.viewed : [],
    searches: Array.isArray(profile.searches) ? profile.searches : [],
    contacted:
      profile.contacted && typeof profile.contacted === "object"
        ? profile.contacted
        : {},
  };

  next.viewed = next.viewed.filter(
    (item) => now - Number(item?.ts || 0) <= PROFILE_TTL_MS
  );
  next.prices = next.prices.slice(-MAX_PRICES);
  next.searches = next.searches.slice(-MAX_SEARCHES);

  return next;
}

export function readRecommendationProfile() {
  try {
    const raw = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
    if (!raw || typeof raw !== "object") {
      return pruneProfile({ sid: getOrCreateSessionId(), city: getDefaultCity() });
    }

    return pruneProfile(raw);
  } catch {
    return pruneProfile({ sid: getOrCreateSessionId(), city: getDefaultCity() });
  }
}

export function writeRecommendationProfile(profile) {
  const next = pruneProfile(profile);

  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }

  return next;
}

function timeDecay(ts, now = Date.now()) {
  const days = Math.max(0, now - Number(ts || 0)) / (24 * 60 * 60 * 1000);
  return Math.exp(-days / 7);
}

export function applyEventToProfile(profile, event, now = Date.now()) {
  const next = pruneProfile(profile, now);
  const weight = (EVENT_WEIGHT[event.type] || 0) * timeDecay(event.ts || now, now);
  if (weight <= 0) return next;

  if (event.city) {
    next.city = event.city;
    setDefaultCity(event.city);
  }

  if (event.cat) {
    next.cats[event.cat] = next.cats[event.cat] || { w: 0, subs: {} };
    next.cats[event.cat].w += weight;

    if (event.subcategory) {
      next.cats[event.cat].subs[event.subcategory] =
        (next.cats[event.cat].subs[event.subcategory] || 0) + weight;
    }
  }

  const price = parsePrice(event.price);
  if (price) next.prices.push(price);

  if (event.listingId && (event.type === "listing_view" || event.type === "listing_click")) {
    next.viewed = next.viewed.filter(
      (item) => String(item.id) !== String(event.listingId)
    );
    next.viewed.push({
      id: String(event.listingId),
      ts: event.ts || now,
      contacted: Boolean(next.contacted[String(event.listingId)]),
    });
    next.viewed = next.viewed.slice(-MAX_VIEWED);
  }

  if (event.type === "contact_intent" && event.listingId) {
    next.contacted[String(event.listingId)] = event.ts || now;
    next.viewed = next.viewed.map((item) =>
      String(item.id) === String(event.listingId)
        ? { ...item, contacted: true }
        : item
    );
  }

  if (event.type === "search" && event.query) {
    next.searches.push(String(event.query).trim().slice(0, 80));
    next.searches = next.searches.slice(-MAX_SEARCHES);
  }

  next.updatedAt = now;
  return next;
}

export function encodeProfileForHeader(profile) {
  const json = JSON.stringify(profile);
  return btoa(
    encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
  );
}

export function getRecommendationHeaders(profile = readRecommendationProfile()) {
  return {
    "X-Oriyon-Session": profile.sid || getOrCreateSessionId(),
    "X-Oriyon-Profile": encodeProfileForHeader(profile),
  };
}
