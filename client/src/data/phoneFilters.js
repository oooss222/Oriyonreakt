/**
 * Phones category filters copied from Paydo
 * (Телефоны / Планшеты / Аксессуары для телефона).
 * Spec keys stay compatible with existing listings.
 */

import {
  COMMON_SPEC_OPTIONS,
  PHONE_BRANDS,
  PHONE_MODELS,
} from "./specOptions";

export const PHONE_STORAGE = [
  "32 GB",
  "64 GB",
  "128 GB",
  "256 GB",
  "512 GB",
  "1 TB",
];

export const TABLET_STORAGE = [
  "4 GB",
  "8 GB",
  "16 GB",
  "32 GB",
  "64 GB",
  "128 GB",
  "256 GB",
  "512 GB",
  "1 TB",
];

export const PHONE_RAM = ["2 GB", "3 GB", "4 GB", "6 GB", "8 GB", "12 GB", "16 GB"];

export const TABLET_TYPES = ["Планшет", "Графический планшет"];

export const PHONE_ACCESSORY_TYPES = [
  "Чехлы",
  "Защитные стёкла и плёнки",
  "Зарядные устройства",
  "Повербанки",
  "Держатели и подставки",
  "Аксессуары для съёмки",
  "Игровые аксессуары",
  "Карты памяти и накопители",
  "Прочие аксессуары",
];

export const TABLET_BRANDS = [
  "Acer",
  "Alcatel",
  "Amazon",
  "Apple",
  "Asus",
  "BlackBerry",
  "Chuwi",
  "Dell",
  "Fujitsu",
  "Google",
  "HP",
  "Huawei",
  "Lenovo",
  "LG",
  "Microsoft",
  "Motorola",
  "Panasonic",
  "Realme",
  "Samsung",
  "Sony",
  "Teclast",
  "ViewSonic",
  "Xiaomi",
  "Zebra",
  "Другое",
];

export const TABLET_MODELS = {
  Apple: [
    "iPad",
    "iPad (9-го поколения)",
    "iPad (10-го поколения)",
    "iPad Air",
    "iPad Air M2",
    "iPad Pro 11",
    "iPad Pro 13",
    "iPad mini",
  ],
  Samsung: [
    "Galaxy Tab A8",
    "Galaxy Tab A9",
    "Galaxy Tab S6 Lite",
    "Galaxy Tab S9",
    "Galaxy Tab S9 FE",
    "Galaxy Tab S10",
  ],
  Xiaomi: ["Redmi Pad", "Redmi Pad SE", "Redmi Pad Pro", "Pad 6", "Pad 6S Pro"],
  Huawei: ["MatePad", "MatePad 11", "MatePad SE", "MatePad Pro"],
  Lenovo: ["Tab M10", "Tab M11", "Tab P11", "Tab P12"],
  Honor: ["Pad X8", "Pad X9", "Pad 9"],
  Google: ["Pixel Tablet"],
  Microsoft: ["Surface Go", "Surface Pro"],
  Amazon: ["Fire HD 8", "Fire HD 10"],
  Realme: ["Pad", "Pad Mini", "Pad 2"],
};

export const PHONE_DEVICE_SPECS = [
  { name: "Производитель", type: "select", options: PHONE_BRANDS },
  {
    name: "Модель",
    type: "select",
    dependsOn: "Производитель",
    optionsFrom: PHONE_MODELS,
  },
  { name: "Память", type: "select", options: PHONE_STORAGE },
  { name: "Оперативная память", type: "select", options: PHONE_RAM },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
  { name: "Цвет", type: "select", options: COMMON_SPEC_OPTIONS.color },
  { name: "Гарантия", type: "select", options: COMMON_SPEC_OPTIONS.warranty },
];

export const TABLET_DEVICE_SPECS = [
  { name: "Тип", type: "select", options: TABLET_TYPES },
  { name: "Производитель", type: "select", options: TABLET_BRANDS },
  {
    name: "Модель",
    type: "select",
    dependsOn: "Производитель",
    optionsFrom: TABLET_MODELS,
  },
  { name: "Память", type: "select", options: TABLET_STORAGE },
  { name: "Оперативная память", type: "select", options: PHONE_RAM },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
  { name: "Гарантия", type: "select", options: COMMON_SPEC_OPTIONS.warranty },
];

export const PHONE_ACCESSORY_SPECS = [
  { name: "Тип аксессуара", type: "select", options: PHONE_ACCESSORY_TYPES },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
  { name: "Гарантия", type: "select", options: COMMON_SPEC_OPTIONS.warranty },
];

export function resolvePhoneSpecTemplate(subcategory = "") {
  const sub = String(subcategory || "").trim();

  if (sub === "Планшеты") return TABLET_DEVICE_SPECS;
  if (sub === "Мобильные аксессуары") return PHONE_ACCESSORY_SPECS;

  return PHONE_DEVICE_SPECS;
}
