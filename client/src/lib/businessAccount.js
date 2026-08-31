export const MIN_AUTO_BUMP_INTERVAL_HOURS = 1;
export const MAX_AUTO_BUMP_INTERVAL_HOURS = 720;

export const BUSINESS_BENEFITS = [
  "Логотип компании на странице и в объявлениях",
  "Instagram и адреса магазинов в профиле",
  "Бренд-страница с описанием компании",
  "Автообновление дат всех объявлений по расписанию",
  "Бейдж «Премиум» и верификация модератором",
];

export const PRIVATE_LISTING_LIMIT = 30;

export function getListingLimit(user) {
  if (isCompanyAccount(user)) return null;
  return PRIVATE_LISTING_LIMIT;
}

export function hasListingLimit(user) {
  return getListingLimit(user) != null;
}

export function isCompanyAccount(user) {
  return user?.sellerType === "company";
}

export function sellerTypeLabel(type) {
  return type === "company" ? "Премиум" : "Частное лицо";
}

export function getDisplayName(user) {
  if (!user) return "Продавец";
  if (user.sellerType === "company" && user.companyName) {
    return user.companyName;
  }
  return user.name || "Продавец";
}

export function parseCompanyAddresses(value = "") {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function normalizeAutoBumpIntervalHours(value, fallback = 24) {
  const hours = Math.round(Number(value));

  if (!Number.isFinite(hours)) {
    return fallback;
  }

  return Math.min(
    MAX_AUTO_BUMP_INTERVAL_HOURS,
    Math.max(MIN_AUTO_BUMP_INTERVAL_HOURS, hours)
  );
}

export function formatAutoBumpInterval(hours) {
  const value = Number(hours);

  if (!Number.isFinite(value) || value <= 0) return "Не задано";

  if (value === 1) return "Каждый час";

  if (value % 24 === 0) {
    const days = value / 24;
    if (days === 1) return "Раз в сутки";
    return `Раз в ${days} дн.`;
  }

  return `Каждые ${value} ч.`;
}
