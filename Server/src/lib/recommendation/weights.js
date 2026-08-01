const EVENT_WEIGHT = {
  listing_view: 1,
  listing_click: 2,
  search: 3,
  favorite: 4,
  contact_intent: 10,
};

const PROFILE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const COLD_START_THRESHOLD = 3;

function timeDecay(ts, now = Date.now()) {
  const ageMs = Math.max(0, now - Number(ts || 0));
  const days = ageMs / (24 * 60 * 60 * 1000);
  return Math.exp(-days / 7);
}

function parsePrice(value) {
  if (value == null || value === "") return null;
  const n = Number(String(value).replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((sorted.length - 1) * p))
  );
  return sorted[index];
}

module.exports = {
  EVENT_WEIGHT,
  PROFILE_WINDOW_MS,
  COLD_START_THRESHOLD,
  timeDecay,
  parsePrice,
  percentile,
};
