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

const CLOTHING_KIDS_TO_KIDS = {
  "Детская одежда — Для новорождённых": "Одежда и обувь — Для новорождённых",
  "Детская одежда — Для девочек": "Одежда и обувь — Для девочек",
  "Детская одежда — Для мальчиков": "Одежда и обувь — Для мальчиков",
  "Детская одежда — Школьная одежда": "Одежда и обувь — Школьная форма",
  "Детская одежда — Обувь": "Одежда и обувь — Обувь",
  "Детская одежда — Верхняя одежда": "Одежда и обувь — Другое",
  "Детская одежда — Спортивная одежда": "Одежда и обувь — Другое",
  "Детская одежда — Другое": "Одежда и обувь — Другое",
  "Обувь — Детская обувь": "Одежда и обувь — Обувь",
};

const TRAVEL_DAILY_TO_REALESTATE = {
  "Гостиницы и жильё — Квартиры посуточно": {
    cat: "realestate",
    path: "/realestate/dushanbe/kvartiry/posutochno",
  },
  "Гостиницы и жильё — Дома посуточно": {
    cat: "realestate",
    path: "/realestate/dushanbe/doma/posutochno",
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

/** Old goods-only repair subs → construction (they are not services). */
const REPAIR_MATERIALS_TO_CONSTRUCTION = {
  "Окна и двери": "Окна и двери",
  "Ворота и заборы": "Окна и двери — Ворота",
  Стройматериалы: "Материалы",
  Инструменты: "Инструменты",
  "Дома, срубы и снаряжения": "Материалы — Другое",
  "Средства индивидуальной защиты": "Инструменты — Другое",
  "Прочее для ремонта": "Другое",
};

export function resolveLegacyCategoryFilters(cat, subcategory) {
  const normalizedCat = String(cat || "").trim();
  const normalizedSub = String(subcategory || "").trim();

  if (normalizedCat === "repair") {
    return {
      cat: "construction",
      subcategory:
        REPAIR_MATERIALS_TO_CONSTRUCTION[normalizedSub] || normalizedSub,
    };
  }

  // Goods that used to live under Services → Construction.
  if (
    normalizedCat === "services" &&
    REPAIR_MATERIALS_TO_CONSTRUCTION[normalizedSub]
  ) {
    return {
      cat: "construction",
      subcategory: REPAIR_MATERIALS_TO_CONSTRUCTION[normalizedSub],
    };
  }

  if (normalizedCat === "clothing" && CLOTHING_KIDS_TO_KIDS[normalizedSub]) {
    return {
      cat: "kids",
      subcategory: CLOTHING_KIDS_TO_KIDS[normalizedSub],
    };
  }

  if (normalizedCat === "travel" && TRAVEL_DAILY_TO_REALESTATE[normalizedSub]) {
    return TRAVEL_DAILY_TO_REALESTATE[normalizedSub];
  }

  const key = `${normalizedCat}::${normalizedSub}`;
  return LEGACY_SUBCATEGORY_REDIRECTS[key] || null;
}

export { REPAIR_MATERIALS_SUBS, REPAIR_MATERIALS_TO_CONSTRUCTION };
