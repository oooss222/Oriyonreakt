/**
 * Kids category: specs, price presets, quick chips, and template resolver.
 * Tuned for Tajikistan marketplace (age bands, kids sizes, strollers).
 */

import { COMMON_SPEC_OPTIONS } from "./specOptions";

export const KIDS_PRICE_PRESETS = [
  { label: "Любая", from: "", to: "" },
  { label: "до 100 с.", from: "", to: "100" },
  { label: "100–300 с.", from: "100", to: "300" },
  { label: "300–700 с.", from: "300", to: "700" },
  { label: "700–1 500 с.", from: "700", to: "1500" },
  { label: "от 1 500 с.", from: "1500", to: "" },
];

export const KIDS_AGES = [
  "0–1 год",
  "1–3 года",
  "3–6 лет",
  "6–12 лет",
  "12+",
];

/** Height / Russian kids sizes commonly used in TJ markets. */
export const KIDS_CLOTHING_SIZES = [
  "56",
  "62",
  "68",
  "74",
  "80",
  "86",
  "92",
  "98",
  "104",
  "110",
  "116",
  "122",
  "128",
  "134",
  "140",
  "146",
  "152",
  "158",
  "Другой",
];

export const KIDS_SHOE_SIZES = [
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  "29",
  "30",
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",
  "Другой",
];

export const KIDS_APPAREL_SPECS = [
  { name: "Возраст", type: "select", options: KIDS_AGES },
  { name: "Размер", type: "select", options: KIDS_CLOTHING_SIZES },
  {
    name: "Состояние",
    type: "select",
    options: COMMON_SPEC_OPTIONS.clothingCondition,
  },
];

export const KIDS_SHOE_SPECS = [
  { name: "Возраст", type: "select", options: KIDS_AGES },
  { name: "Размер", type: "select", options: KIDS_SHOE_SIZES },
  {
    name: "Состояние",
    type: "select",
    options: COMMON_SPEC_OPTIONS.clothingCondition,
  },
];

export const KIDS_GOODS_SPECS = [
  { name: "Возраст", type: "select", options: KIDS_AGES },
  {
    name: "Состояние",
    type: "select",
    options: COMMON_SPEC_OPTIONS.clothingCondition,
  },
];

export const KIDS_STROLLER_SPECS = [
  {
    name: "Тип",
    type: "select",
    options: ["Коляска", "Автокресло", "Люлька", "Трансформер", "Другое"],
  },
  { name: "Возраст", type: "select", options: KIDS_AGES },
  {
    name: "Состояние",
    type: "select",
    options: COMMON_SPEC_OPTIONS.clothingCondition,
  },
];

export const KIDS_CARE_SPECS = [
  { name: "Возраст", type: "select", options: KIDS_AGES },
  {
    name: "Тип",
    type: "select",
    options: ["Питание", "Подгузники", "Уход", "Другое"],
  },
];

export const KIDS_SERVICE_SPECS = [
  {
    name: "Формат",
    type: "select",
    options: ["Няня", "Репетитор", "Кружок / секция", "Разово"],
  },
  { name: "Возраст", type: "select", options: KIDS_AGES },
];

export function resolveKidsSpecTemplate(subcategory = "") {
  const sub = String(subcategory || "").trim();
  const group = sub.includes(" — ") ? sub.split(" — ")[0] : sub;
  const item = sub.includes(" — ") ? sub.split(" — ").slice(1).join(" — ") : "";

  if (group === "Услуги") return KIDS_SERVICE_SPECS;
  if (group === "Коляски и автокресла") return KIDS_STROLLER_SPECS;
  if (
    group === "Для новорождённых" &&
    (item === "Уход" || item === "Кормление")
  ) {
    return KIDS_CARE_SPECS;
  }

  if (
    item === "Обувь" ||
    (group === "Транспорт" && /обувь/i.test(item))
  ) {
    return KIDS_SHOE_SPECS;
  }

  if (
    ["Для мальчиков", "Для девочек", "Для новорождённых"].includes(group) &&
    (item === "Одежда" || item === "Школьная форма" || !item)
  ) {
    return KIDS_APPAREL_SPECS;
  }

  if (
    ["Для мальчиков", "Для девочек"].includes(group) &&
    item === "Обувь"
  ) {
    return KIDS_SHOE_SPECS;
  }

  return KIDS_GOODS_SPECS;
}

export const KIDS_QUICK_FILTERS = [
  {
    label: "Мальчикам",
    to: "/listing?cat=kids&subcategory=" + encodeURIComponent("Для мальчиков"),
  },
  {
    label: "Девочкам",
    to: "/listing?cat=kids&subcategory=" + encodeURIComponent("Для девочек"),
  },
  {
    label: "Новорождённым",
    to:
      "/listing?cat=kids&subcategory=" +
      encodeURIComponent("Для новорождённых"),
  },
  {
    label: "Игрушки",
    to: "/listing?cat=kids&subcategory=" + encodeURIComponent("Игрушки"),
  },
  {
    label: "Коляски",
    to:
      "/listing?cat=kids&subcategory=" +
      encodeURIComponent("Коляски и автокресла"),
  },
  {
    label: "Малышам",
    to: `/listing?cat=kids&specs=${encodeURIComponent(
      JSON.stringify({ Возраст: "0–1 год" })
    )}`,
  },
  {
    label: "до 300 с.",
    to: "/listing?cat=kids&priceTo=300",
  },
];
