/**
 * Blocked display names for registration / profile.
 * Match whole tokens in Cyrillic or Latin, case-insensitive.
 * Also reject one-letter, digits-only, and symbols-only names.
 */

const BLOCKED_WORDS = [
  // Honorifics / placeholders
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

  // Roles / generic placeholders
  "продавец",
  "продавцы",
  "продавщица",
  "покупатель",
  "админ",
  "администратор",
  "модератор",
  "имя",
  "хозяин",
  "хозяйка",
  "владелец",
  "владелица",
  "пользователь",
  "гость",
  "магазин",
  "поддержка",
  "тест",
  "фурӯшанда",
  "фуршанда",
  "корбар",
  "ном",
  "user",
  "username",
  "users",
  "admin",
  "administrator",
  "moderator",
  "seller",
  "buyer",
  "guest",
  "shop",
  "store",
  "support",
  "test",
  "name",
  "furushanda",
  "korbar",

  // Brands (phones, cars, etc.)
  "apple",
  "samsung",
  "iphone",
  "galaxy",
  "xiaomi",
  "huawei",
  "oppo",
  "vivo",
  "realme",
  "redmi",
  "honor",
  "nokia",
  "oneplus",
  "poco",
  "infinix",
  "tecno",
  "pixel",
  "эппл",
  "самсунг",
  "айфон",
  "галакси",
  "сяоми",
  "хуавей",
  "toyota",
  "lexus",
  "honda",
  "mercedes",
  "mercedesbenz",
  "bmw",
  "hyundai",
  "kia",
  "nissan",
  "mazda",
  "audi",
  "volkswagen",
  "tesla",
  "chevrolet",
  "ford",
  "mitsubishi",
  "subaru",
  "porsche",
  "lada",
  "daewoo",
  "ravon",
  "тойота",
  "лексус",
  "хонда",
  "мерседес",
  "бмв",
  "хендай",
  "хундай",
  "киа",
  "ниссан",
  "мазда",
  "ауди",
  "фольксваген",
  "тесла",
  "шевроле",
  "форд",
  "лада",
];

const BLOCKED_SET = new Set(BLOCKED_WORDS);
const LETTER_RE = /[a-zа-яҳҷғӣқў]/iu;

const BLOCKED_DISPLAY_NAME_ERROR =
  "Укажите настоящее имя. Нельзя использовать одну букву, только цифры или символы, а также слова вроде «Продавец», «Админ», «User», «Apple», «Toyota».";

function normalizeDisplayName(name = "") {
  return String(name || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function displayNameLetters(name = "") {
  return normalizeDisplayName(name).replace(/[^a-zа-яҳҷғӣқў]+/giu, "");
}

function displayNameAlnum(name = "") {
  return normalizeDisplayName(name).replace(/[^a-zа-яҳҷғӣқў0-9]+/giu, "");
}

function displayNameTokens(name = "") {
  return normalizeDisplayName(name)
    .split(/[^a-zа-яҳҷғӣқў0-9]+/iu)
    .filter(Boolean);
}

function isBlockedWord(value = "") {
  return Boolean(value) && BLOCKED_SET.has(value);
}

function isBlockedDisplayName(name = "") {
  const raw = String(name || "").trim();
  if (!raw) return false;

  const letters = displayNameLetters(raw);
  const alnum = displayNameAlnum(raw);

  // Only symbols / punctuation / emoji
  if (!alnum) return true;

  // Only digits (optionally mixed with symbols)
  if (!letters) return true;

  // A single letter, even with digits or symbols ("A", "И.", "A1")
  if (letters.length < 2) return true;

  const tokens = displayNameTokens(raw);
  if (tokens.some((token) => isBlockedWord(token))) return true;

  // "Сохиб Хона" / "Mercedes Benz" as one forbidden phrase
  if (isBlockedWord(tokens.join(""))) return true;

  // "admin1", "iphone15", "user!!!" after stripping digits
  const letterTokens = tokens
    .map((token) => token.replace(/[0-9]+/g, ""))
    .filter((token) => LETTER_RE.test(token));
  if (letterTokens.some((token) => isBlockedWord(token))) return true;

  if (isBlockedWord(letters)) return true;

  return false;
}

module.exports = {
  BLOCKED_WORDS,
  BLOCKED_DISPLAY_NAME_ERROR,
  isBlockedDisplayName,
  normalizeDisplayName,
};
