/**
 * Construction category: specs, price presets, quick chips, and template resolver.
 * Tuned for TJ market (materials, rental, master services).
 */

import { COMMON_SPEC_OPTIONS } from "./specOptions";

export const CONSTRUCTION_PRICE_PRESETS = [
  { label: "Любая", from: "", to: "" },
  { label: "до 500 с.", from: "", to: "500" },
  { label: "500–2 000 с.", from: "500", to: "2000" },
  { label: "2 000–10 000 с.", from: "2000", to: "10000" },
  { label: "10 000–50 000 с.", from: "10000", to: "50000" },
  { label: "от 50 000 с.", from: "50000", to: "" },
];

export const CONSTRUCTION_MATERIAL_SPECS = [
  {
    name: "Тип сделки",
    type: "select",
    options: ["Продажа"],
  },
];

export const CONSTRUCTION_GOODS_SPECS = [
  {
    name: "Тип сделки",
    type: "select",
    options: ["Продажа"],
  },
  {
    name: "Состояние",
    type: "select",
    options: COMMON_SPEC_OPTIONS.condition,
  },
];

export const CONSTRUCTION_TOOL_SPECS = [
  {
    name: "Тип сделки",
    type: "select",
    options: ["Продажа", "Аренда"],
  },
  {
    name: "Состояние",
    type: "select",
    options: COMMON_SPEC_OPTIONS.condition,
  },
];

export const CONSTRUCTION_RENTAL_SPECS = [
  {
    name: "Тип сделки",
    type: "select",
    options: ["Аренда"],
  },
  {
    name: "Единица",
    type: "select",
    options: ["За час", "За день", "За смену", "За месяц"],
  },
];

export const CONSTRUCTION_SERVICE_SPECS = [
  {
    name: "Тип сделки",
    type: "select",
    options: ["Услуга"],
  },
  {
    name: "Формат",
    type: "select",
    options: ["Разовая", "Под ключ", "По договору"],
  },
];

export const CONSTRUCTION_DESIGN_SPECS = [
  {
    name: "Тип сделки",
    type: "select",
    options: ["Услуга"],
  },
  {
    name: "Формат",
    type: "select",
    options: ["Архитектура", "Дизайн интерьера", "Смета", "Другое"],
  },
];

export function resolveConstructionSpecTemplate(subcategory = "") {
  const sub = String(subcategory || "").trim();
  const group = sub.includes(" — ") ? sub.split(" — ")[0] : sub;

  if (group === "Аренда техники") return CONSTRUCTION_RENTAL_SPECS;
  if (group === "Услуги мастеров") return CONSTRUCTION_SERVICE_SPECS;
  if (group === "Проектирование") return CONSTRUCTION_DESIGN_SPECS;
  if (group === "Материалы") return CONSTRUCTION_MATERIAL_SPECS;
  if (group === "Инструменты") return CONSTRUCTION_TOOL_SPECS;
  return CONSTRUCTION_GOODS_SPECS;
}

export const CONSTRUCTION_QUICK_FILTERS = [
  {
    label: "Материалы",
    to:
      "/listing?cat=construction&subcategory=" + encodeURIComponent("Материалы"),
  },
  {
    label: "Цемент",
    to:
      "/listing?cat=construction&subcategory=" +
      encodeURIComponent("Материалы — Цемент и сыпучие"),
  },
  {
    label: "Окна ПВХ",
    to:
      "/listing?cat=construction&subcategory=" +
      encodeURIComponent("Окна и двери — Окна ПВХ"),
  },
  {
    label: "Аренда техники",
    to:
      "/listing?cat=construction&subcategory=" +
      encodeURIComponent("Аренда техники"),
  },
  {
    label: "Ремонт",
    to:
      "/listing?cat=construction&subcategory=" +
      encodeURIComponent("Услуги мастеров — Ремонт квартир"),
  },
  {
    label: "Электрика",
    to:
      "/listing?cat=construction&subcategory=" +
      encodeURIComponent("Электрика"),
  },
  {
    label: "до 2 000 с.",
    to: "/listing?cat=construction&priceTo=2000",
  },
];
