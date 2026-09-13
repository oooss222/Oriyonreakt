/**
 * Client mirror of Server/src/lib/blockedDisplayNames.js
 * Blocked honorific / placeholder display names (Cyrillic + Latin).
 */

const BLOCKED_WORDS = [
  "бародар",
  "хочи",
  "ҳоҷи",
  "ака",
  "апа",
  "сохибхона",
  "соҳибхона",
  "barodar",
  "khoji",
  "hoji",
  "xoci",
  "xochi",
  "khochi",
  "hoci",
  "aka",
  "apa",
  "sohibkhona",
  "sokhibkhona",
  "soxibxona",
  "sohibxona",
  "sokhibxona",
  "sohibhona",
];

const BLOCKED_SET = new Set(BLOCKED_WORDS);

function normalizeDisplayName(name = "") {
  return String(name || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function displayNameTokens(name = "") {
  return normalizeDisplayName(name)
    .split(/[^a-zа-яҳҷғӣқў0-9]+/iu)
    .filter(Boolean);
}

export function isBlockedDisplayName(name = "") {
  const tokens = displayNameTokens(name);
  if (!tokens.length) return false;
  if (tokens.some((token) => BLOCKED_SET.has(token))) return true;
  return BLOCKED_SET.has(tokens.join(""));
}
