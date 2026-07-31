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
    ["fav", "profile", "wallet", "admin", "moderation", "my", "promote", "searches"].includes(
      value
    )
  ) {
    return value;
  }
  return "my";
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

  const hints = [];
  if (!checks[0]) hints.push("Укажите имя");
  if (!checks[1]) hints.push("Добавьте телефон");
  if (!checks[2]) hints.push("Укажите WhatsApp или Telegram");
  if (!checks[3]) hints.push("Подтвердите email");
  if (!checks[4]) hints.push("Заполните описание или название компании");

  return { percent, hints, completed, total: checks.length };
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
