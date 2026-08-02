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

const REPAIR_MATERIALS_SUBS = [
  "Окна и двери",
  "Дома, срубы и снаряжения",
  "Средства индивидуальной защиты",
  "Ворота и заборы",
  "Стройматериалы",
  "Инструменты",
  "Прочее для ремонта",
];

export function resolveLegacyCategoryFilters(cat, subcategory) {
  const normalizedCat = String(cat || "").trim();
  const normalizedSub = String(subcategory || "").trim();

  if (normalizedCat === "repair") {
    return {
      cat: "services",
      subcategory: normalizedSub,
    };
  }

  const key = `${normalizedCat}::${normalizedSub}`;
  return LEGACY_SUBCATEGORY_REDIRECTS[key] || null;
}

export { REPAIR_MATERIALS_SUBS };
