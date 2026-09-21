const LANG_STORAGE_KEY = "diyor_lang";
const SUPPORTED_LANGS = ["ru", "tg", "en"];

function getActiveLang() {
  try {
    const stored = String(localStorage.getItem(LANG_STORAGE_KEY) || "").toLowerCase();
    return SUPPORTED_LANGS.includes(stored) ? stored : "ru";
  } catch {
    return "ru";
  }
}

const WALLET_TYPE_LABELS_BY_LANG = {
  ru: {
    top_up: "Пополнение",
    payment: "Списание",
    refund: "Возврат",
    manual_adjustment: "Корректировка",
  },
  en: {
    top_up: "Top-up",
    payment: "Payment",
    refund: "Refund",
    manual_adjustment: "Adjustment",
  },
  tg: {
    top_up: "Пуркунӣ",
    payment: "Хароҷот",
    refund: "Баргардонидан",
    manual_adjustment: "Ислоҳ",
  },
};

export function getWalletTypeLabels() {
  return WALLET_TYPE_LABELS_BY_LANG[getActiveLang()] || WALLET_TYPE_LABELS_BY_LANG.ru;
}

export const getId = (item) => item?.id || item?._id;

export function normalizeTab(value) {
  if (value === "favorites") return "fav";
  if (
    [
      "fav",
      "profile",
      "wallet",
      "admin",
      "moderation",
      "my",
      "promote",
      "searches",
      "analytics",
    ].includes(value)
  ) {
    return value;
  }
  return "my";
}

export function calculateProfileCompletion(me, emailStatus, t) {
  const checks = [
    Boolean(String(me?.name || "").trim()),
    Boolean(String(me?.phone || "").trim()),
    Boolean(String(me?.whatsapp || "").trim() || String(me?.telegram || "").trim()),
    emailStatus === "verified",
    Boolean(String(me?.companyDescription || "").trim()) ||
      me?.sellerType !== "company" ||
      Boolean(String(me?.companyName || "").trim()),
  ];

  const completed = checks.filter(Boolean).length;
  const percent = Math.round((completed / checks.length) * 100);

  const hints = [];
  if (!checks[0]) hints.push(t("profile.completionHintName"));
  if (!checks[1]) hints.push(t("profile.completionHintPhone"));
  if (!checks[2]) hints.push(t("profile.completionHintContact"));
  if (!checks[3]) hints.push(t("profile.completionHintEmail"));
  if (!checks[4]) hints.push(t("profile.completionHintCompany"));

  return { percent, hints, completed, total: checks.length };
}

export function getUserInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  if (parts[0]) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return "?";
}

export function isStaffRole(role) {
  return role && role !== "user";
}

export function buildListingUrlFromSavedFilters(filters = {}) {
  const params = new URLSearchParams();

  if (filters.cat) params.set("cat", filters.cat);
  if (filters.subcategory) params.set("subcategory", filters.subcategory);
  if (filters.location) params.set("location", filters.location);
  if (filters.priceFrom) params.set("priceFrom", filters.priceFrom);
  if (filters.priceTo) params.set("priceTo", filters.priceTo);
  if (filters.sort) params.set("sort", filters.sort);

  const specEntries = Object.entries(filters.specs || {}).filter(
    ([name, value]) => String(name).trim() && String(value).trim()
  );

  if (specEntries.length) {
    params.set("specs", JSON.stringify(Object.fromEntries(specEntries)));
  }

  const query = params.toString();
  return query ? `/listing?${query}` : "/listing";
}

export function parseListingPrice(value) {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  if (!digits) return null;
  return Number(digits);
}

export function formatPhoneDisplay(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("992")) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
  }
  if (digits.length === 9) {
    return `+992 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
  }
  return phone || "";
}
