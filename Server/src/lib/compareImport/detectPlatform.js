const ALLOWED_HOSTS = new Set([
  "somon.tj",
  "www.somon.tj",
  "paydo.tj",
  "www.paydo.tj",
  "alon.tj",
  "www.alon.tj",
  "savdo.tj",
  "www.savdo.tj",
]);

const PLATFORM_BY_HOST = {
  "somon.tj": "somon",
  "www.somon.tj": "somon",
  "paydo.tj": "paydo",
  "www.paydo.tj": "paydo",
  "alon.tj": "alon",
  "www.alon.tj": "alon",
  "savdo.tj": "savdo",
  "www.savdo.tj": "savdo",
};

function normalizeUrl(raw = "") {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed;

  try {
    parsed = new URL(withProtocol);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) {
    return null;
  }

  parsed.hash = "";
  return parsed.toString();
}

function detectPlatform(url = "") {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return PLATFORM_BY_HOST[host] || "other";
  } catch {
    return "other";
  }
}

module.exports = {
  ALLOWED_HOSTS,
  normalizeUrl,
  detectPlatform,
};
