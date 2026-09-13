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
import { REPAIR_MATERIALS_SUBS } from "./categoryConsolidation";
import {
  CLOTHING_APPAREL_SPECS,
  resolveClothingSpecTemplate,
} from "./clothingFilters";
import {
  FOOD_PRODUCT_SPECS,
  resolveFoodSpecTemplate,
} from "./foodFilters";

import { REAL_ESTATE_SUB_SPECS } from "./realEstate";
import { DEFAULT_REAL_ESTATE_BROWSE_PATH } from "./realEstate";

export const TITLE_MAX = 80;
export const DESC_MAX = 1000;

export const CAT_LABELS = {
  realestate: "Недвижимость",
  transport: "Авто",
  furniture: "Мебель",
  phones: "Телефоны",
  electronics: "Бытовая техника",
  computers: "Компьютеры и оргтехника",
  services: "Услуги",
  repair: "Ремонт",
  food: "Еда",
  kids: "Детский мир",
  travel: "Путешествия",
  clothing: "Одежда",
  construction: "Строительство",
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
  { name: "Кузов", type: "select", options: COMMON_SPEC_OPTIONS.bodyType },
  { name: "Привод", type: "select", options: COMMON_SPEC_OPTIONS.drive },
  { name: "Объем", type: "select", options: COMMON_SPEC_OPTIONS.engineVolume },
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

const GENERIC_VEHICLE_SPECS = [
  { name: "Марка", type: "text" },
  { name: "Модель", type: "text" },
  { name: "Год", type: "select", options: COMMON_SPEC_OPTIONS.years },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
];

const AUTO_CHEMICALS_SPECS = [
  { name: "Тип", type: "select", options: COMMON_SPEC_OPTIONS.autoChemicalType },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
];

const AUTO_REPAIR_SERVICE_SPECS = [
  { name: "Тип услуги", type: "select", options: COMMON_SPEC_OPTIONS.autoServiceType },
  { name: "Формат", type: "select", options: COMMON_SPEC_OPTIONS.serviceFormat },
  { name: "Опыт", type: "select", options: COMMON_SPEC_OPTIONS.serviceExperience },
];

const PHONE_REPAIR_SERVICE_SPECS = [
  { name: "Тип услуги", type: "select", options: COMMON_SPEC_OPTIONS.phoneRepairType },
  { name: "Формат", type: "select", options: COMMON_SPEC_OPTIONS.serviceFormat },
  { name: "Опыт", type: "select", options: COMMON_SPEC_OPTIONS.serviceExperience },
];

const TECH_REPAIR_SERVICE_SPECS = [
  { name: "Тип техники", type: "select", options: COMMON_SPEC_OPTIONS.techRepairType },
  { name: "Формат", type: "select", options: COMMON_SPEC_OPTIONS.serviceFormat },
  { name: "Опыт", type: "select", options: COMMON_SPEC_OPTIONS.serviceExperience },
];

const SERVICE_SPECS = [
  { name: "Формат", type: "select", options: COMMON_SPEC_OPTIONS.serviceFormat },
  { name: "Опыт", type: "select", options: COMMON_SPEC_OPTIONS.serviceExperience },
  { name: "Срок выполнения", type: "text" },
];

const REPAIR_MATERIALS_SPECS = [
  { name: "Тип", type: "select", options: COMMON_SPEC_OPTIONS.repairType },
  { name: "Материал/Бренд", type: "text" },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
];

const REPAIR_MATERIALS_SUB_TEMPLATES = Object.fromEntries(
  REPAIR_MATERIALS_SUBS.map((name) => [name, REPAIR_MATERIALS_SPECS])
);

// Builds a flat, DB-compatible `subs` list ("Группа — Пункт") from a
// two-level {group, items[]} definition, so listings keep storing a single
// subcategory string while the picker UI can still show groups. Reused
// item names across groups (e.g. every group's own "Другое") stay unique
// once prefixed with their group.
function buildGroupedCategory(groupDefs) {
  const subGroups = groupDefs.map(([group, items]) => ({ group, items }));
  const subs = subGroups.flatMap(({ group, items }) =>
    items.map((item) => `${group} — ${item}`)
  );

  return { subGroups, subs };
}

/**
 * Simplified TJ-market taxonomies (fewer groups, less duplication).
 * Old "Group — Item" strings are mapped in categoryLifestyle.js aliases
 * so existing listings still match filters.
 */
/** Paydo-style top-level groups (tiles on category landing). */
const FOOD_GROUPS = buildGroupedCategory([
  [
    "Выпечка и десерты",
    ["Самса", "Торты и десерты", "Лепёшки и хлеб", "Восточные сладости", "Другое"],
  ],
  [
    "Блюда",
    [
      "Плов и национальная кухня",
      "Шашлык и гриль",
      "Домашние блюда",
      "Салаты и закуски",
      "Супы",
      "Завтраки",
      "Другое",
    ],
  ],
  [
    "Фастфуд",
    ["Шаурма", "Бургеры", "Пицца", "Другое"],
  ],
  [
    "Полуфабрикаты / заморозка",
    ["Манты и пельмени", "Заморозка", "Тесто и заготовки", "Другое"],
  ],
  [
    "Услуги повара",
    ["Домашний повар", "Кейтеринг", "На свадьбу и той", "Другое"],
  ],
  [
    "Особое питание",
    ["Халяль", "Диетическое", "Другое"],
  ],
]);
FOOD_GROUPS.subs.push("Другое");

const KIDS_GROUPS = buildGroupedCategory([
  [
    "Для мальчиков",
    ["Одежда", "Обувь", "Школьная форма", "Другое"],
  ],
  [
    "Для девочек",
    ["Одежда", "Обувь", "Школьная форма", "Другое"],
  ],
  [
    "Для новорождённых",
    ["Одежда", "Уход", "Кормление", "Другое"],
  ],
  [
    "Игрушки",
    [
      "Развивающие",
      "Конструкторы",
      "Куклы и мягкие",
      "Машинки и транспорт",
      "Настольные игры",
      "Другое",
    ],
  ],
  [
    "Коляски и автокресла",
    ["Коляски", "Автокресла", "Другое"],
  ],
  [
    "Транспорт",
    ["Велосипеды и самокаты", "Электромобили", "Другое"],
  ],
  [
    "Мебель",
    ["Кроватки", "Столы и стулья", "Шкафы и комоды", "Другое"],
  ],
  [
    "Услуги",
    ["Няни", "Репетиторы", "Кружки и секции", "Другое"],
  ],
]);
KIDS_GROUPS.subs.push("Другое");

const TRAVEL_GROUPS = buildGroupedCategory([
  [
    "Туры по Таджикистану",
    [
      "Фанские горы",
      "Памир и Хорог",
      "Искандеркуль",
      "Семь озёр",
      "Худжанд и Согд",
      "Другие маршруты",
    ],
  ],
  [
    "Туры за границу",
    ["Узбекистан", "Турция", "ОАЭ", "Россия", "Другое"],
  ],
  [
    "Экскурсии и гиды",
    ["Гиды", "Групповые экскурсии", "Индивидуальные", "Горные маршруты", "Другое"],
  ],
  [
    "Базы отдыха",
    ["Базы и дома отдыха", "Горные домики", "Кемпинг и глэмпинг", "Другое"],
  ],
  [
    "Транспорт и билеты",
    [
      "Аренда авто",
      "Авто с водителем",
      "Трансфер",
      "Авиа и ж/д билеты",
      "Другое",
    ],
  ],
  [
    "Снаряжение",
    ["Палатки и спальники", "Рюкзаки", "Альпинизм", "Другое"],
  ],
]);
TRAVEL_GROUPS.subs.push("Другое");

const CLOTHING_GROUPS = buildGroupedCategory([
  [
    "Для свадьбы",
    ["Платья", "Костюмы", "Национальная", "Другое"],
  ],
  [
    "Женщинам",
    [
      "Платья",
      "Блузки и рубашки",
      "Брюки и джинсы",
      "Верхняя одежда",
      "Спортивная",
      "Другое",
    ],
  ],
  [
    "Мужчинам",
    [
      "Рубашки и футболки",
      "Брюки и джинсы",
      "Костюмы",
      "Верхняя одежда",
      "Спортивная",
      "Другое",
    ],
  ],
  [
    "Национальная одежда",
    ["Курта", "Чапан", "Национальные платья", "Костюмы", "Другое"],
  ],
  [
    "Обувь",
    ["Женская", "Мужская", "Кроссовки", "Сезонная", "Другое"],
  ],
  [
    "Сумки и чемоданы",
    ["Сумки", "Рюкзаки", "Чемоданы", "Другое"],
  ],
  [
    "Аксессуары",
    ["Головные уборы", "Ремни и кошельки", "Очки", "Другое"],
  ],
  [
    "Ювелирные украшения",
    ["Кольца", "Серьги", "Цепочки", "Другое"],
  ],
  [
    "Ткани",
    ["Атлас и адрас", "Метраж", "Другое"],
  ],
]);
CLOTHING_GROUPS.subs.push("Другое");

const CONSTRUCTION_GROUPS = buildGroupedCategory([
  [
    "Материалы",
    [
      "Цемент и сыпучие",
      "Кирпич и блоки",
      "Отделка",
      "Кровля",
      "Другое",
    ],
  ],
  [
    "Окна и двери",
    ["Окна ПВХ", "Двери", "Ворота", "Другое"],
  ],
  [
    "Электрика",
    ["Кабели и провода", "Розетки и свет", "Щиты и оборудование", "Другое"],
  ],
  [
    "Сантехника",
    ["Трубы и смесители", "Ванны и кабины", "Водонагреватели", "Другое"],
  ],
  [
    "Инструменты",
    ["Электроинструмент", "Ручной инструмент", "Другое"],
  ],
  [
    "Аренда техники",
    [
      "Экскаваторы и погрузчики",
      "Бетономешалки",
      "Генераторы",
      "Другая техника",
    ],
  ],
  [
    "Услуги мастеров",
    [
      "Ремонт квартир",
      "Строительство домов",
      "Электрика и сантехника",
      "Отделочные работы",
      "Другое",
    ],
  ],
  [
    "Проектирование",
    ["Архитектура", "Дизайн интерьера", "Другое"],
  ],
]);
CONSTRUCTION_GROUPS.subs.push("Другое");

export const CATS = {
  realestate: {
    title: "Недвижимость",
    shortTitle: "Недвижимость",
    img: "/img/realestate.png",
    desc: "Квартиры, дома, участки и коммерция",
    featured: true,
    landingPath: DEFAULT_REAL_ESTATE_BROWSE_PATH,
    subs: Object.keys(REAL_ESTATE_SUB_SPECS),
    specTemplate: REAL_ESTATE_SUB_SPECS["Квартиры"],
    subSpecTemplates: REAL_ESTATE_SUB_SPECS,
  },
  transport: {
    title: "Авто",
    shortTitle: "Авто",
    img: "/img/car.png",
    desc: "Авто и запчасти",
    subs: [
      "Легковые авто",
      "Запчасти",
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
      "Шины и диски": TIRES_SPECS,
      "Грузовики и автобусы": GENERIC_VEHICLE_SPECS,
      "Мототранспорт": GENERIC_VEHICLE_SPECS,
      "Сельхозтехника": GENERIC_VEHICLE_SPECS,
      "Спецтехника": GENERIC_VEHICLE_SPECS,
      "Прицепы": GENERIC_VEHICLE_SPECS,
      "Автохимия и автомасла": AUTO_CHEMICALS_SPECS,
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
    desc: "Смартфоны, планшеты и аксессуары",
    subs: [
      "Мобильные телефоны",
      "Планшеты",
      "Мобильные аксессуары",
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
    shortTitle: "Техника",
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
  services: {
    title: "Услуги",
    shortTitle: "Услуги",
    img: "/img/services.png",
    desc: "Специалисты, ремонт, обучение и сервис",
    subs: [
      "Ремонт и строительство",
      ...REPAIR_MATERIALS_SUBS,
      "Красота и здоровье",
      "Образование и репетиторы",
      "IT и digital",
      "Юридические услуги",
      "Бухгалтерия и финансы",
      "Клининг и уборка",
      "Перевозки и грузчики",
      "Ремонт авто",
      "Ремонт телефонов и планшетов",
      "Ремонт компьютеров и бытовой техники",
      "Фото и видео",
      "Организация мероприятий",
      "Другое",
    ],
    specTemplate: SERVICE_SPECS,
    subSpecTemplates: {
      "Ремонт авто": AUTO_REPAIR_SERVICE_SPECS,
      "Ремонт телефонов и планшетов": PHONE_REPAIR_SERVICE_SPECS,
      "Ремонт компьютеров и бытовой техники": TECH_REPAIR_SERVICE_SPECS,
      ...REPAIR_MATERIALS_SUB_TEMPLATES,
    },
  },
  repair: {
    title: "Ремонт",
    shortTitle: "Ремонт",
    img: "/img/repair.png",
    desc: "Материалы и инструменты",
    hiddenFromHome: true,
    subs: REPAIR_MATERIALS_SUBS,
    specTemplate: REPAIR_MATERIALS_SPECS,
  },
  food: {
    title: "Еда",
    shortTitle: "Еда",
    img: "/img/food.png",
    desc: "Национальная кухня, выпечка, полуфабрикаты и услуги поваров",
    subs: FOOD_GROUPS.subs,
    subGroups: FOOD_GROUPS.subGroups,
    specTemplate: FOOD_PRODUCT_SPECS,
    resolveSpecTemplate: resolveFoodSpecTemplate,
  },
  kids: {
    title: "Детский мир",
    shortTitle: "Детский мир",
    img: "/img/kids.png",
    desc: "Одежда, игрушки, коляски, мебель и услуги для детей",
    subs: KIDS_GROUPS.subs,
    subGroups: KIDS_GROUPS.subGroups,
    specTemplate: [
      {
        name: "Возраст",
        type: "select",
        options: ["0–1 год", "1–3 года", "3–6 лет", "6–12 лет", "12+"],
      },
      {
        name: "Состояние",
        type: "select",
        options: COMMON_SPEC_OPTIONS.clothingCondition,
      },
    ],
  },
  travel: {
    title: "Путешествия",
    shortTitle: "Путешествия",
    img: "/img/travel.png",
    desc: "Туры по Таджикистану, гиды, базы отдыха, трансфер и снаряжение",
    subs: TRAVEL_GROUPS.subs,
    subGroups: TRAVEL_GROUPS.subGroups,
    // Посуточное жильё — в недвижимости; здесь туры и сервис.
    crossLinks: [
      {
        label: "Квартиры и дома посуточно",
        to: "/realestate/dushanbe/kvartiry/posutochno",
      },
    ],
    specTemplate: [
      {
        name: "Направление",
        type: "select",
        options: [
          "По Таджикистану",
          "Узбекистан",
          "Турция",
          "ОАЭ",
          "Россия",
          "Другое",
        ],
      },
      {
        name: "Тип",
        type: "select",
        options: ["Тур", "Экскурсия", "База отдыха", "Транспорт", "Снаряжение"],
      },
    ],
  },
  clothing: {
    title: "Одежда",
    shortTitle: "Одежда",
    img: "/img/clothing.png",
    desc: "Женская и мужская одежда, национальная, обувь и аксессуары",
    subs: CLOTHING_GROUPS.subs,
    subGroups: CLOTHING_GROUPS.subGroups,
    // Детская одежда — основной раздел в «Детский мир».
    crossLinks: [
      {
        label: "Детская одежда и обувь",
        to: "/c/kids",
      },
    ],
    specTemplate: CLOTHING_APPAREL_SPECS,
    resolveSpecTemplate: resolveClothingSpecTemplate,
  },
  construction: {
    title: "Строительство",
    shortTitle: "Строительство",
    img: "/img/construction.png",
    desc: "Материалы, аренда техники, окна, электрика и услуги мастеров",
    subs: CONSTRUCTION_GROUPS.subs,
    subGroups: CONSTRUCTION_GROUPS.subGroups,
    specTemplate: [
      {
        name: "Тип сделки",
        type: "select",
        options: ["Продажа", "Аренда", "Услуга"],
      },
      {
        name: "Состояние",
        type: "select",
        options: COMMON_SPEC_OPTIONS.condition,
      },
    ],
  },
};

export const HOME_CATEGORIES = Object.entries(CATS)
  .filter(([, cat]) => !cat.hiddenFromHome)
  .map(([slug, cat]) => ({
  slug,
  title: cat.shortTitle || cat.title,
  fullTitle: cat.title,
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

  const sub = String(subcategory || "").trim();

  if (sub && cat.subSpecTemplates?.[sub]) {
    return cat.subSpecTemplates[sub];
  }

  if (typeof cat.resolveSpecTemplate === "function") {
    return cat.resolveSpecTemplate(sub) || cat.specTemplate || [];
  }

  if (sub.includes(" — ") && cat.subSpecTemplates) {
    const group = sub.split(" — ")[0];
    if (cat.subSpecTemplates[group]) {
      return cat.subSpecTemplates[group];
    }
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
  const templateNames = new Set(template.map((row) => row.name));
  const existingMap = new Map(
    existingSpecs
      .filter((item) => item?.name && templateNames.has(String(item.name).trim()))
      .map((item) => [String(item.name).trim(), String(item.value || "").trim()])
  );

  return template.map((row) => ({
    ...row,
    value: existingMap.get(row.name) || "",
  }));
}

export function filterSpecsToTemplate(catKey, subcategory, specs = []) {
  const templateNames = new Set(
    buildSpecTemplate(catKey, subcategory).map((row) => row.name)
  );

  return specs.filter((row) => templateNames.has(row.name));
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
