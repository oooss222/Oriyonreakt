import {
  CAR_BRANDS,
  CAR_MODELS,
  PHONE_BRANDS,
  PHONE_MODELS,
  LAPTOP_BRANDS,
  LAPTOP_MODELS,
  APPLIANCE_BRANDS,
  APPLIANCE_MODELS,
  COMMON_SPEC_OPTIONS,
} from "./specOptions";

import {
  REAL_ESTATE_SUB_SPECS,
} from "./realEstate";

export const TITLE_MAX = 80;
export const DESC_MAX = 1000;

export const CAT_LABELS = {
  realestate: "Недвижимость",
  transport: "Авто",
  furniture: "Мебель",
  phones: "Телефоны",
  electronics: "Бытовая техника",
  computers: "Компьютеры и оргтехника",
  repair: "Ремонт",
};

export const CATEGORY_SELECT_OPTIONS = [
  { value: "", label: "Все категории" },
  ...Object.entries(CAT_LABELS).map(([value, label]) => ({ value, label })),
];

const CAR_SPECS = [
  { name: "Марка", type: "select", options: CAR_BRANDS },
  { name: "Модель", type: "select", dependsOn: "Марка", optionsFrom: CAR_MODELS },
  { name: "Год", type: "select", options: COMMON_SPEC_OPTIONS.years },
  { name: "Пробег", type: "text" },
  { name: "КПП", type: "select", options: COMMON_SPEC_OPTIONS.kpp },
  { name: "Цвет", type: "select", options: COMMON_SPEC_OPTIONS.color },
  { name: "Топливо", type: "select", options: COMMON_SPEC_OPTIONS.fuel },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
];

const PARTS_SPECS = [
  { name: "Тип запчасти", type: "select", options: COMMON_SPEC_OPTIONS.partType },
  { name: "Марка авто", type: "select", options: CAR_BRANDS },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
];

const TIRES_SPECS = [
  { name: "Сезон", type: "select", options: COMMON_SPEC_OPTIONS.tireSeason },
  { name: "Диаметр", type: "select", options: COMMON_SPEC_OPTIONS.tireDiameter },
  { name: "Ширина", type: "select", options: COMMON_SPEC_OPTIONS.tireWidth },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
];

const AUTO_SERVICE_SPECS = [
  { name: "Тип услуги", type: "select", options: COMMON_SPEC_OPTIONS.autoServiceType },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
];

export const CATS = {
  realestate: {
    title: "Недвижимость",
    shortTitle: "Недвижимость",
    img: "/img/realestate.png",
    desc: "Квартиры, дома, участки и коммерция",
    featured: true,
    landingPath: "/realestate",
    subs: Object.keys(REAL_ESTATE_SUB_SPECS),
    specTemplate: REAL_ESTATE_SUB_SPECS["Квартиры"],
    subSpecTemplates: REAL_ESTATE_SUB_SPECS,
  },
  transport: {
    title: "Авто",
    shortTitle: "Авто",
    img: "/img/car.png",
    desc: "Авто, запчасти, техника",
    subs: [
      "Легковые авто",
      "Запчасти",
      "Услуги для авто",
      "Грузовики и автобусы",
      "Мототранспорт",
      "Сельхозтехника",
      "Спецтехника",
      "Прицепы",
      "Шины и диски",
      "Автохимия и автомасла",
    ],
    specTemplate: CAR_SPECS,
    subSpecTemplates: {
      "Легковые авто": CAR_SPECS,
      "Запчасти": PARTS_SPECS,
      "Услуги для авто": AUTO_SERVICE_SPECS,
      "Шины и диски": TIRES_SPECS,
    },
  },
  furniture: {
    title: "Мебель",
    shortTitle: "Мебель",
    img: "/img/furniture.png",
    desc: "Дом, офис, интерьер",
    subs: [
      "Мебель для спальни",
      "Офисная мебель",
      "Мебель для гостиной",
      "Мебель для прихожей",
      "Мебель на заказ",
    ],
    specTemplate: [
      { name: "Тип", type: "select", options: COMMON_SPEC_OPTIONS.furnitureType },
      { name: "Материал", type: "select", options: COMMON_SPEC_OPTIONS.material },
      { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
      { name: "Цвет", type: "select", options: COMMON_SPEC_OPTIONS.color },
      { name: "Размеры", type: "text" },
    ],
  },
  phones: {
    title: "Телефоны",
    shortTitle: "Телефоны",
    img: "/img/phone.png",
    desc: "Смартфоны и аксессуары",
    subs: [
      "Мобильные телефоны",
      "Планшеты",
      "Мобильные аксессуары",
      "Ремонт и сервис телефонов",
    ],
    specTemplate: [
      { name: "Производитель", type: "select", options: PHONE_BRANDS },
      {
        name: "Модель",
        type: "select",
        dependsOn: "Производитель",
        optionsFrom: PHONE_MODELS,
      },
      { name: "Память", type: "select", options: COMMON_SPEC_OPTIONS.memory },
      { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
      { name: "Гарантия", type: "select", options: COMMON_SPEC_OPTIONS.warranty },
    ],
  },
  electronics: {
    title: "Бытовая техника",
    shortTitle: "Бытовая техника",
    img: "/img/electronics.png",
    desc: "Техника для дома",
    subs: [
      "Техника для дома и кухни",
      "Видеонаблюдение и камеры",
      "Климатическая техника",
      "Обогреватели",
    ],
    specTemplate: [
      { name: "Тип", type: "select", options: COMMON_SPEC_OPTIONS.applianceType },
      { name: "Бренд", type: "select", options: APPLIANCE_BRANDS },
      {
        name: "Модель",
        type: "select",
        dependsOn: "Бренд",
        optionsFrom: APPLIANCE_MODELS,
      },
      { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
      { name: "Гарантия", type: "select", options: COMMON_SPEC_OPTIONS.warranty },
    ],
  },
  computers: {
    title: "Компьютеры и оргтехника",
    shortTitle: "Компьютеры",
    img: "/img/computers.png",
    desc: "ПК, ноутбуки, оргтехника",
    subs: ["Ноутбуки", "ПК", "Приставки", "Принтеры и сканеры"],
    specTemplate: [
      { name: "Тип", type: "select", options: COMMON_SPEC_OPTIONS.computerType },
      { name: "Бренд", type: "select", options: LAPTOP_BRANDS },
      {
        name: "Модель",
        type: "select",
        dependsOn: "Бренд",
        optionsFrom: LAPTOP_MODELS,
      },
      { name: "Процессор", type: "text" },
      { name: "ОЗУ", type: "select", options: COMMON_SPEC_OPTIONS.ram },
      { name: "Накопитель", type: "select", options: COMMON_SPEC_OPTIONS.storage },
      { name: "Видеокарта", type: "text" },
      { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
    ],
  },
  repair: {
    title: "Ремонт",
    shortTitle: "Ремонт",
    img: "/img/repair.png",
    desc: "Материалы и инструменты",
    subs: [
      "Окна и двери",
      "Дома, срубы и снаряжения",
      "Средства индивидуальной защиты",
      "Ворота и заборы",
      "Стройматериалы",
      "Инструменты",
      "Прочее для ремонта",
    ],
    specTemplate: [
      { name: "Тип", type: "select", options: COMMON_SPEC_OPTIONS.repairType },
      { name: "Материал/Бренд", type: "text" },
      { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
    ],
  },
};

export const HOME_CATEGORIES = Object.entries(CATS).map(([slug, cat]) => ({
  slug,
  title: cat.shortTitle || cat.title,
  img: cat.img,
  desc: cat.desc,
  featured: Boolean(cat.featured),
  landingPath: cat.landingPath || `/c/${slug}`,
}));

export function getCategory(slug) {
  return CATS[slug] || null;
}

export function getListSpecFilters(catKey, subcategory = "") {
  return getSpecTemplate(catKey, subcategory)
    .filter(
      (item) =>
        item.type === "select" &&
        Array.isArray(item.options) &&
        item.options.length > 0 &&
        !item.dependsOn
    )
    .map((item) => ({
      name: item.name,
      options: item.options,
    }));
}

export function parseSpecsParam(raw) {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([name, value]) =>
          String(name || "").trim() && String(value || "").trim()
      )
    );
  } catch {
    return {};
  }
}

export function getSpecTemplate(catKey, subcategory = "") {
  const cat = CATS[catKey];
  if (!cat) return [];

  if (cat.subSpecTemplates?.[subcategory]) {
    return cat.subSpecTemplates[subcategory];
  }

  return cat.specTemplate || [];
}

export function normalizeSpecItem(item) {
  return {
    name: typeof item === "string" ? item : item.name,
    type: typeof item === "string" ? "text" : item.type || "text",
    options: typeof item === "string" ? [] : item.options || [],
    dependsOn: typeof item === "string" ? "" : item.dependsOn || "",
    optionsFrom: typeof item === "string" ? null : item.optionsFrom || null,
    locked: true,
    value: "",
  };
}

export function buildSpecTemplate(catKey, subcategory = "") {
  return getSpecTemplate(catKey, subcategory).map(normalizeSpecItem);
}

export function mergeSpecsWithExisting(template, existingSpecs = []) {
  const existingMap = new Map(
    existingSpecs
      .filter((item) => item?.name)
      .map((item) => [String(item.name).trim(), String(item.value || "").trim()])
  );

  const used = new Set();

  const merged = template.map((row) => {
    used.add(row.name);
    return {
      ...row,
      value: existingMap.get(row.name) || "",
    };
  });

  for (const spec of existingSpecs) {
    const name = String(spec?.name || "").trim();
    if (!name || used.has(name)) continue;

    merged.push({
      name,
      value: String(spec.value || "").trim(),
      type: "text",
      locked: false,
      options: [],
      dependsOn: "",
      optionsFrom: null,
    });
  }

  return merged;
}

export function compactSpecsForSubmit(specs) {
  return specs
    .filter(
      (item) =>
        String(item.name || "").trim() && String(item.value || "").trim()
    )
    .map((item) => ({
      name: String(item.name || "").trim(),
      value: String(item.value || "").trim(),
    }));
}
