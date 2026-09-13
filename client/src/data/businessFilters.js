/**
 * Business category ("Все для бизнеса"): specs, price presets, quick chips.
 * Taxonomy aligned with Somon.tj /vsyo-dlya-biznesa.
 */

import { COMMON_SPEC_OPTIONS } from "./specOptions";

export const BUSINESS_PRICE_PRESETS = [
  { label: "Любая", from: "", to: "" },
  { label: "до 1 000 с.", from: "", to: "1000" },
  { label: "1 000–10 000 с.", from: "1000", to: "10000" },
  { label: "10 000–50 000 с.", from: "10000", to: "50000" },
  { label: "50 000–200 000 с.", from: "50000", to: "200000" },
  { label: "от 200 000 с.", from: "200000", to: "" },
];

export const BUSINESS_GOODS_SPECS = [
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

export const BUSINESS_SALE_SPECS = [
  {
    name: "Тип сделки",
    type: "select",
    options: ["Продажа"],
  },
  {
    name: "Формат",
    type: "select",
    options: ["Действующий", "Под ключ", "Доля", "Другое"],
  },
];

export const BUSINESS_RENTAL_SPECS = [
  {
    name: "Тип сделки",
    type: "select",
    options: ["Аренда"],
  },
  {
    name: "Единица",
    type: "select",
    options: ["За день", "За месяц", "За год"],
  },
];

export function resolveBusinessSpecTemplate(subcategory = "") {
  const sub = String(subcategory || "").trim();
  const group = sub.includes(" — ") ? sub.split(" — ")[0] : sub;

  if (group === "Бизнес на продажу") return BUSINESS_SALE_SPECS;
  if (group === "Готовый бизнес в аренду") return BUSINESS_RENTAL_SPECS;
  return BUSINESS_GOODS_SPECS;
}

export const BUSINESS_QUICK_FILTERS = [
  {
    label: "Оборудование",
    to: "/listing?cat=business&subcategory=" + encodeURIComponent("Оборудование"),
  },
  {
    label: "Магазин",
    to:
      "/listing?cat=business&subcategory=" +
      encodeURIComponent("Бизнес на продажу — Торговля, магазины"),
  },
  {
    label: "Кафе / общепит",
    to:
      "/listing?cat=business&subcategory=" +
      encodeURIComponent("Бизнес на продажу — Кафе, рестораны, общепит"),
  },
  {
    label: "Автосервис",
    to:
      "/listing?cat=business&subcategory=" +
      encodeURIComponent(
        "Бизнес на продажу — Автосервисы, автомойки, шиномонтаж"
      ),
  },
  {
    label: "Аренда бизнеса",
    to:
      "/listing?cat=business&subcategory=" +
      encodeURIComponent("Готовый бизнес в аренду"),
  },
  {
    label: "Кассы / терминалы",
    to:
      "/listing?cat=business&subcategory=" +
      encodeURIComponent("Оборудование — Терминалы / кассовые аппараты"),
  },
  {
    label: "до 10 000 с.",
    to: "/listing?cat=business&priceTo=10000",
  },
];
