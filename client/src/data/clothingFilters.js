/**
 * Clothing category: specs, price presets, quick chips, and template resolver.
 * Tuned for Tajikistan marketplace (sizes, seasons, national wear).
 */

import { COMMON_SPEC_OPTIONS } from "./specOptions";

export const CLOTHING_PRICE_PRESETS = [
  { label: "Любая", from: "", to: "" },
  { label: "до 100 с.", from: "", to: "100" },
  { label: "100–300 с.", from: "100", to: "300" },
  { label: "300–700 с.", from: "300", to: "700" },
  { label: "700–1 500 с.", from: "700", to: "1500" },
  { label: "от 1 500 с.", from: "1500", to: "" },
];

/** Letter + common EU sizes used in TJ markets. */
export const CLOTHING_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
  "42",
  "44",
  "46",
  "48",
  "50",
  "52",
  "54",
  "56",
  "Универсальный",
  "Другой",
];

export const SHOE_SIZES = [
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
  "Другой",
];

export const CLOTHING_SEASONS = ["Лето", "Зима", "Демисезон", "Всесезон"];

export const CLOTHING_COLORS = [
  "Чёрный",
  "Белый",
  "Серый",
  "Бежевый",
  "Синий",
  "Красный",
  "Зелёный",
  "Коричневый",
  "Розовый",
  "Цветной",
  "Другой",
];

export const CLOTHING_APPAREL_SPECS = [
  { name: "Размер", type: "select", options: CLOTHING_SIZES },
  {
    name: "Состояние",
    type: "select",
    options: COMMON_SPEC_OPTIONS.clothingCondition,
  },
  { name: "Сезон", type: "select", options: CLOTHING_SEASONS },
  { name: "Цвет", type: "select", options: CLOTHING_COLORS },
];

export const CLOTHING_SHOE_SPECS = [
  { name: "Размер", type: "select", options: SHOE_SIZES },
  {
    name: "Состояние",
    type: "select",
    options: COMMON_SPEC_OPTIONS.clothingCondition,
  },
  { name: "Сезон", type: "select", options: CLOTHING_SEASONS },
  { name: "Цвет", type: "select", options: CLOTHING_COLORS },
];

export const CLOTHING_ACCESSORY_SPECS = [
  {
    name: "Состояние",
    type: "select",
    options: COMMON_SPEC_OPTIONS.clothingCondition,
  },
  { name: "Цвет", type: "select", options: CLOTHING_COLORS },
];

export const CLOTHING_JEWELRY_SPECS = [
  {
    name: "Состояние",
    type: "select",
    options: COMMON_SPEC_OPTIONS.clothingCondition,
  },
  {
    name: "Материал",
    type: "select",
    options: ["Золото", "Серебро", "Бижутерия", "Другое"],
  },
];

export const CLOTHING_FABRIC_SPECS = [
  {
    name: "Тип ткани",
    type: "select",
    options: ["Атлас", "Адрас", "Хлопок", "Шёлк", "Другое"],
  },
  {
    name: "Формат",
    type: "select",
    options: ["Метраж", "Отрез", "Готовое изделие"],
  },
];

export function resolveClothingSpecTemplate(subcategory = "") {
  const sub = String(subcategory || "").trim();
  const group = sub.includes(" — ") ? sub.split(" — ")[0] : sub;

  if (group === "Обувь") return CLOTHING_SHOE_SPECS;
  if (group === "Ювелирные украшения") return CLOTHING_JEWELRY_SPECS;
  if (group === "Ткани") return CLOTHING_FABRIC_SPECS;
  if (group === "Аксессуары" || group === "Сумки и чемоданы") {
    return CLOTHING_ACCESSORY_SPECS;
  }

  return CLOTHING_APPAREL_SPECS;
}

export const CLOTHING_QUICK_FILTERS = [
  {
    label: "Женское",
    to: "/listing?cat=clothing&subcategory=" + encodeURIComponent("Женщинам"),
  },
  {
    label: "Мужское",
    to: "/listing?cat=clothing&subcategory=" + encodeURIComponent("Мужчинам"),
  },
  {
    label: "Свадьба",
    to: "/listing?cat=clothing&subcategory=" + encodeURIComponent("Для свадьбы"),
  },
  {
    label: "Национальная",
    to:
      "/listing?cat=clothing&subcategory=" +
      encodeURIComponent("Национальная одежда"),
  },
  {
    label: "Обувь",
    to: "/listing?cat=clothing&subcategory=" + encodeURIComponent("Обувь"),
  },
  {
    label: "Новое",
    to: `/listing?cat=clothing&specs=${encodeURIComponent(
      JSON.stringify({ Состояние: "Новое" })
    )}`,
  },
  {
    label: "до 300 с.",
    to: "/listing?cat=clothing&priceTo=300",
  },
];
