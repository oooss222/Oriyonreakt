/**
 * Lifestyle categories (food, kids, travel, clothing, construction):
 * quick chips for landings + legacy subcategory aliases for filters.
 */
import aliases from "@shared/lifestyleSubcategoryAliases.json";

export const LIFESTYLE_SUBCATEGORY_ALIASES = aliases;

/** Reverse map: new subcategory → [old strings that should still match]. */
const ALIASES_BY_TARGET = (() => {
  const map = Object.create(null);
  for (const [from, to] of Object.entries(LIFESTYLE_SUBCATEGORY_ALIASES)) {
    if (!map[to]) map[to] = [];
    if (from !== to) map[to].push(from);
  }
  return map;
})();

export function expandSubcategoryFilterValues(subcategory = "") {
  const value = String(subcategory || "").trim();
  if (!value) return [];
  const extras = ALIASES_BY_TARGET[value] || [];
  return [value, ...extras];
}

export function normalizeLifestyleSubcategory(subcategory = "") {
  const value = String(subcategory || "").trim();
  return LIFESTYLE_SUBCATEGORY_ALIASES[value] || value;
}

export const LIFESTYLE_QUICK_CHIPS = {
  food: [
    { label: "Самса", subcategory: "Выпечка — Самса" },
    {
      label: "Плов",
      subcategory: "Готовая еда — Плов и национальная кухня",
    },
    {
      label: "Манты",
      subcategory: "Полуфабрикаты — Манты и пельмени",
    },
    { label: "Повар", subcategory: "Услуги повара — Домашний повар" },
    { label: "Кейтеринг", subcategory: "Услуги повара — Кейтеринг" },
  ],
  kids: [
    { label: "Коляски", subcategory: "Коляски и автокресла — Коляски" },
    {
      label: "Автокресла",
      subcategory: "Коляски и автокресла — Автокресла",
    },
    { label: "Игрушки", subcategory: "Игрушки — Развивающие" },
    { label: "Школа", subcategory: "Одежда и обувь — Школьная форма" },
    { label: "Няни", subcategory: "Услуги — Няни" },
  ],
  travel: [
    {
      label: "Фанские горы",
      subcategory: "Туры по Таджикистану — Фанские горы",
    },
    {
      label: "Памир",
      subcategory: "Туры по Таджикистану — Памир и Хорог",
    },
    { label: "Гиды", subcategory: "Экскурсии и гиды — Гиды" },
    {
      label: "Базы отдыха",
      subcategory: "Базы отдыха — Базы и дома отдыха",
    },
    {
      label: "Аренда авто",
      subcategory: "Транспорт и билеты — Аренда авто",
    },
  ],
  clothing: [
    { label: "Курта", subcategory: "Национальная одежда — Курта" },
    { label: "Чапан", subcategory: "Национальная одежда — Чапан" },
    { label: "Женское", subcategory: "Женская — Платья" },
    { label: "Мужское", subcategory: "Мужская — Рубашки и футболки" },
    { label: "Обувь", subcategory: "Обувь — Кроссовки" },
  ],
  construction: [
    { label: "Цемент", subcategory: "Материалы — Цемент и сыпучие" },
    { label: "Окна ПВХ", subcategory: "Окна и двери — Окна ПВХ" },
    {
      label: "Аренда техники",
      subcategory: "Аренда техники — Экскаваторы и погрузчики",
    },
    {
      label: "Ремонт квартир",
      subcategory: "Услуги мастеров — Ремонт квартир",
    },
    { label: "Электрика", subcategory: "Электрика — Кабели и провода" },
  ],
};

export function getLifestyleQuickChips(slug) {
  return LIFESTYLE_QUICK_CHIPS[slug] || [];
}
