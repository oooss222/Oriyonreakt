const LANG_STORAGE_KEY = "oriyon_lang";
const SUPPORTED_LANGS = ["ru", "tg", "en"];

// format.js is plain JS (not a component), so it can't call useI18n(). It
// reads the same localStorage key the i18n provider persists to, so number/
// date formatting and the handful of strings below follow whatever language
// the user actually picked instead of always rendering in Russian.
function getActiveLang() {
  try {
    const stored = String(localStorage.getItem(LANG_STORAGE_KEY) || "").toLowerCase();
    return SUPPORTED_LANGS.includes(stored) ? stored : "ru";
  } catch {
    return "ru";
  }
}

function getActiveLocale() {
  const lang = getActiveLang();
  return lang === "en" ? "en-US" : lang === "tg" ? "tg-TJ" : "ru-RU";
}

const STRINGS = {
  ru: {
    priceNotSet: "Цена не указана",
    views: (count) => `${count} просмотров`,
    justNow: "только что",
    minAgo: (n) => `${n} мин назад`,
    hoursAgo: (n) => `${n} ч назад`,
    yesterday: "вчера",
    daysAgo: (n) => `${n} дн. назад`,
    weeksAgo: (n) => `${n} нед. назад`,
    new: "Новое",
  },
  en: {
    priceNotSet: "Price not set",
    views: (count) => `${count} views`,
    justNow: "just now",
    minAgo: (n) => `${n} min ago`,
    hoursAgo: (n) => `${n}h ago`,
    yesterday: "yesterday",
    daysAgo: (n) => `${n}d ago`,
    weeksAgo: (n) => `${n}w ago`,
    new: "New",
  },
  tg: {
    priceNotSet: "Нарх нишон дода нашудааст",
    views: (count) => `${count} дидан`,
    justNow: "ҳозир",
    minAgo: (n) => `${n} дақ. пеш`,
    hoursAgo: (n) => `${n} соат пеш`,
    yesterday: "дирӯз",
    daysAgo: (n) => `${n} рӯз пеш`,
    weeksAgo: (n) => `${n} ҳафта пеш`,
    new: "Нав",
  },
};

function strings() {
  return STRINGS[getActiveLang()] || STRINGS.ru;
}

export function parsePriceNumber(value) {
  if (value == null || value === "") return null;

  const n = Number(String(value).replace(/\s/g, "").replace(",", "."));

  return Number.isFinite(n) ? n : null;
}

export function formatPrice(value, { emptyLabel, currency = "TJS" } = {}) {
  const n = parsePriceNumber(value);

  if (n == null) {
    if (value == null || value === "") {
      return emptyLabel ?? strings().priceNotSet;
    }

    return String(value);
  }

  return `${n.toLocaleString(getActiveLocale())} ${currency}`;
}

export function formatViewCount(count) {
  return Number(count || 0).toLocaleString(getActiveLocale());
}

export function formatPublicId(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) {
    return String(value || "");
  }

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatRegistrationDate(dateStr) {
  if (!dateStr || Number.isNaN(Date.parse(dateStr))) {
    return null;
  }

  return new Date(dateStr).toLocaleDateString(getActiveLocale(), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatViewsLabel(count) {
  return strings().views(formatViewCount(count));
}

export function formatMoney(value, { currency = "TJS", emptyLabel = "" } = {}) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return emptyLabel;
  }

  return `${numeric.toLocaleString(getActiveLocale(), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export function getListingDisplayDate(listing) {
  const created = listing?.createdAt ? new Date(listing.createdAt) : null;
  const bumped = listing?.bumpedAt ? new Date(listing.bumpedAt) : null;

  if (bumped && !Number.isNaN(bumped.getTime())) {
    if (!created || Number.isNaN(created.getTime()) || bumped > created) {
      return bumped;
    }
  }

  if (created && !Number.isNaN(created.getTime())) {
    return created;
  }

  return null;
}

export function formatListingDate(listing, { emptyLabel = "", withTime = false } = {}) {
  const date = getListingDisplayDate(listing);

  if (!date) {
    return emptyLabel;
  }

  if (withTime) {
    return date.toLocaleString(getActiveLocale());
  }

  return date.toLocaleDateString(getActiveLocale());
}

export function formatListingTimeAgo(listing, { emptyLabel } = {}) {
  const s = strings();
  const date = getListingDisplayDate(listing);

  if (!date) {
    return emptyLabel ?? s.new;
  }

  const diffMs = Date.now() - date.getTime();

  if (diffMs < 0) {
    return emptyLabel ?? s.new;
  }

  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return s.justNow;
  if (diffMin < 60) return s.minAgo(diffMin);
  if (diffHr < 24) return s.hoursAgo(diffHr);
  if (diffDays === 1) return s.yesterday;
  if (diffDays < 7) return s.daysAgo(diffDays);
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return s.weeksAgo(weeks);
  }

  return date.toLocaleDateString(getActiveLocale(), {
    day: "numeric",
    month: "short",
  });
}

export function isListingDateUpdated(listing) {
  const created = listing?.createdAt ? new Date(listing.createdAt) : null;
  const bumped = listing?.bumpedAt ? new Date(listing.bumpedAt) : null;

  return Boolean(
    bumped &&
      !Number.isNaN(bumped.getTime()) &&
      created &&
      !Number.isNaN(created.getTime()) &&
      bumped.getTime() > created.getTime()
  );
}
