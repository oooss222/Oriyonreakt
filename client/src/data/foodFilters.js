/**
 * Food category: specs, price presets, quick chips, and template resolver.
 * Tuned for Tajikistan marketplace (samsa, plov, delivery, chefs).
 */

export const FOOD_PRICE_PRESETS = [
  { label: "Любая", from: "", to: "" },
  { label: "до 50 с.", from: "", to: "50" },
  { label: "50–150 с.", from: "50", to: "150" },
  { label: "150–300 с.", from: "150", to: "300" },
  { label: "300–700 с.", from: "300", to: "700" },
  { label: "от 700 с.", from: "700", to: "" },
];

export const FOOD_FORMATS = [
  "Доставка",
  "Самовывоз",
  "На заказ",
  "Доставка и самовывоз",
];

export const FOOD_READY_STATES = ["Свежее", "Заморозка", "Полуфабрикат"];

export const FOOD_PRODUCT_SPECS = [
  { name: "Формат", type: "select", options: FOOD_FORMATS },
  { name: "Готовность", type: "select", options: FOOD_READY_STATES },
];

export const FOOD_SERVICE_SPECS = [
  {
    name: "Формат",
    type: "select",
    options: ["Домашний повар", "Кейтеринг", "На свадьбу и той", "Разово"],
  },
  {
    name: "Выезд",
    type: "select",
    options: ["По городу", "С выездом", "Только на месте"],
  },
];

export const FOOD_SPECIAL_SPECS = [
  { name: "Формат", type: "select", options: FOOD_FORMATS },
  {
    name: "Тип питания",
    type: "select",
    options: ["Халяль", "Диетическое", "Без сахара", "Другое"],
  },
];

export function resolveFoodSpecTemplate(subcategory = "") {
  const sub = String(subcategory || "").trim();
  const group = sub.includes(" — ") ? sub.split(" — ")[0] : sub;

  if (group === "Услуги повара") return FOOD_SERVICE_SPECS;
  if (group === "Особое питание") return FOOD_SPECIAL_SPECS;
  return FOOD_PRODUCT_SPECS;
}

export const FOOD_QUICK_FILTERS = [
  {
    label: "Самса",
    to:
      "/listing?cat=food&subcategory=" +
      encodeURIComponent("Выпечка и десерты — Самса"),
  },
  {
    label: "Плов",
    to:
      "/listing?cat=food&subcategory=" +
      encodeURIComponent("Блюда — Плов и национальная кухня"),
  },
  {
    label: "Манты",
    to:
      "/listing?cat=food&subcategory=" +
      encodeURIComponent("Полуфабрикаты / заморозка — Манты и пельмени"),
  },
  {
    label: "Фастфуд",
    to: "/listing?cat=food&subcategory=" + encodeURIComponent("Фастфуд"),
  },
  {
    label: "Повар",
    to: "/listing?cat=food&subcategory=" + encodeURIComponent("Услуги повара"),
  },
  {
    label: "Доставка",
    to: `/listing?cat=food&specs=${encodeURIComponent(
      JSON.stringify({ Формат: "Доставка" })
    )}`,
  },
  {
    label: "до 150 с.",
    to: "/listing?cat=food&priceTo=150",
  },
];
