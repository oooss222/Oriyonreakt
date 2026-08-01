/** Legacy cat/sub pairs merged into the Services category. */
export const LEGACY_SUBCATEGORY_REDIRECTS = {
  "transport::Услуги для авто": {
    cat: "services",
    subcategory: "Ремонт авто",
  },
  "phones::Ремонт и сервис телефонов": {
    cat: "services",
    subcategory: "Ремонт телефонов и планшетов",
  },
  "services::Ремонт техники": {
    cat: "services",
    subcategory: "Ремонт компьютеров и бытовой техники",
  },
};

export function resolveLegacyCategoryFilters(cat, subcategory) {
  const key = `${cat}::${String(subcategory || "").trim()}`;
  return LEGACY_SUBCATEGORY_REDIRECTS[key] || null;
}
