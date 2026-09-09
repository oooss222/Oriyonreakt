export const WALLET_TYPE_LABELS = {
  top_up: "Пополнение",
  payment: "Списание",
  refund: "Возврат",
  manual_adjustment: "Корректировка",
};

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

/** Lifecycle states a listing can be in, in the order the dashboard shows them. */
export const LISTING_STATUSES = ["approved", "pending", "rejected", "sold", "archived"];

const STATUS_META = {
  approved: { tone: "success", labelKey: "profile.statusApproved" },
  pending: { tone: "warning", labelKey: "profile.statusPending" },
  rejected: { tone: "danger", labelKey: "profile.statusRejected" },
  sold: { tone: "neutral", labelKey: "profile.statusSold" },
  archived: { tone: "neutral", labelKey: "profile.statusArchived" },
};

export function getListingStatus(listing) {
  const status = listing?.status || "pending";
  return STATUS_META[status] ? status : "pending";
}

export function getListingStatusMeta(status, t) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return { tone: meta.tone, label: t(meta.labelKey) };
}

export function summarizeListings(items = []) {
  return items.reduce(
    (acc, ad) => {
      const status = getListingStatus(ad);
      acc.total += 1;
      acc[status] += 1;
      if (ad.vip) acc.vip += 1;
      if (ad.top) acc.top += 1;
      if (ad.bumpedAt || ad.bumped_at) acc.bump += 1;
      if (!ad.vip && !ad.top) acc.none += 1;
      return acc;
    },
    {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      sold: 0,
      archived: 0,
      vip: 0,
      top: 0,
      bump: 0,
      none: 0,
    }
  );
}

export function calculateProfileCompletion(me, emailStatus) {
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

  const hintKeys = [
    "profile.hintName",
    "profile.hintPhone",
    "profile.hintMessenger",
    "profile.hintEmail",
    "profile.hintCompany",
  ].filter((_, index) => !checks[index]);

  return { percent, hintKeys, completed, total: checks.length };
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
