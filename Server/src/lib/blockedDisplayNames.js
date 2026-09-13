/**
 * Blocked display names for registration / profile (honorific placeholders).
 * Match whole tokens in Cyrillic or Latin, case-insensitive.
 */

const BLOCKED_WORDS = [
  // Cyrillic
  "бародар",
  "хочи",
  "ҳоҷи",
  "ака",
  "апа",
  "сохибхона",
  "соҳибхона",
  // Latin / translit
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

function isBlockedDisplayName(name = "") {
  const tokens = displayNameTokens(name);
  if (!tokens.length) return false;

  if (tokens.some((token) => BLOCKED_SET.has(token))) return true;

  // "Сохиб Хона" / "Sohib Khona" as one forbidden phrase
  const compact = tokens.join("");
  if (BLOCKED_SET.has(compact)) return true;

  return false;
}

module.exports = {
  BLOCKED_WORDS,
  isBlockedDisplayName,
  normalizeDisplayName,
};
