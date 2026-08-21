import { getListingDisplayDate } from "../lib/format";

function mergeDeep(base, extra) {
  const result = { ...base };

  for (const [key, value] of Object.entries(extra || {})) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      base[key] &&
      typeof base[key] === "object"
    ) {
      result[key] = { ...base[key], ...value };
    } else {
      result[key] = value;
    }
  }

  return result;
}

export function mergeLocale(base, extra) {
  return mergeDeep(base, extra);
}

export function formatListingTimeAgo(listing, t, { emptyLabel } = {}) {
  const date = getListingDisplayDate(listing);
  const fallback = emptyLabel ?? t("date.new");

  if (!date) return fallback;

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return fallback;

  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return t("date.justNow");
  if (diffMin < 60) return t("date.minutesAgo", { count: diffMin });
  if (diffHr < 24) return t("date.hoursAgo", { count: diffHr });
  if (diffDays === 1) return t("date.yesterday");
  if (diffDays < 7) return t("date.daysAgo", { count: diffDays });
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return t("date.weeksAgo", { count: weeks });
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

export function formatDayLabel(value, t) {
  if (!value) return "";

  const date = new Date(value);
  const today = new Date();
  const diffDays = Math.floor(
    (today.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) /
      86400000
  );

  if (diffDays === 0) return t("date.today");
  if (diffDays === 1) return t("date.yesterday");

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

export function formatNightsLabel(count, t) {
  const n = Number(count) || 0;
  if (n <= 0) return "";

  const mod10 = n % 10;
  const mod100 = n % 100;

  let word = t("listing.nights5");
  if (mod10 === 1 && mod100 !== 11) word = t("listing.night");
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    word = t("listing.nights2");
  }

  return `${n} ${word}`;
}

export function getQuickReplies(t, business = false) {
  if (business) {
    return [
      t("chat.bizQuick1"),
      t("chat.bizQuick2"),
      t("chat.bizQuick3"),
      t("chat.bizQuick4"),
    ];
  }

  return [
    t("chat.quick1"),
    t("chat.quick2"),
    t("chat.quick3"),
    t("chat.quick4"),
  ];
}

export function getBusinessBenefits(t) {
  return [
    t("business.benefit1"),
    t("business.benefit2"),
    t("business.benefit3"),
    t("business.benefit4"),
    t("business.benefit5"),
  ];
}

export function formatPromotionDaysLabel(t, days) {
  const value = Number(days);

  if (value === 1) return t("promotion.day1");
  if (value >= 2 && value <= 4) return t("promotion.daysFew", { count: value });
  return t("promotion.daysMany", { count: value });
}

export function pluralRealEstateListings(t, count) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return t("realestate.listingOne");
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return t("realestate.listingFew");
  }

  return t("realestate.listingMany");
}
