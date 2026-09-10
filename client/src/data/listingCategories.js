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
  { name: "Тип", type: "select", options: COMMON_SPEC_OPTIONS.autoChemicalType || ["Масло", "Антифриз", "Омыватель", "Другое"] },
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

const FOOD_GROUPS = buildGroupedCategory([
  ["Выпечка и десерты", ["Торты", "Пироги", "Пирожки", "Самса", "Кексы", "Печенье", "Восточные сладости", "Десерты", "Другое"]],
  ["Полуфабрикаты", ["Манты", "Пельмени", "Самса", "Котлеты", "Голубцы", "Тесто", "Замороженные продукты", "Другое"]],
  ["Услуги повара", ["Домашний повар", "Повар на мероприятие", "Повар на свадьбу", "Повар для семьи", "Кейтеринг", "Другое"]],
  ["Особое питание", ["Диетическое питание", "Здоровое питание", "Вегетарианское питание", "Детское питание", "Питание без сахара", "Питание без глютена", "Другое"]],
  ["Блюда", ["Национальная кухня", "Европейская кухня", "Азиатская кухня", "Домашние блюда", "Салаты", "Супы", "Горячие блюда", "Завтраки", "Другое"]],
]);
FOOD_GROUPS.subs.push("Другое");

const KIDS_GROUPS = buildGroupedCategory([
  ["Детская одежда", ["Для новорождённых", "Для девочек", "Для мальчиков", "Верхняя одежда", "Обувь", "Школьная одежда", "Праздничная одежда", "Другое"]],
  ["Игрушки", ["Развивающие игрушки", "Конструкторы", "Машинки", "Куклы", "Мягкие игрушки", "Настольные игры", "Игрушки для малышей", "Другое"]],
  ["Детская мебель", ["Детские кроватки", "Кровати", "Столы", "Стулья", "Шкафы", "Комоды", "Манежи", "Другое"]],
  ["Детские коляски и транспорт", ["Коляски", "Прогулочные коляски", "Автокресла", "Велосипеды", "Самокаты", "Электромобили", "Другое"]],
  ["Детское питание", ["Смеси", "Каши", "Пюре", "Детские напитки", "Сладости", "Другое"]],
  ["Товары для новорождённых", ["Подгузники", "Пеленки", "Бутылочки", "Соски", "Средства ухода", "Одежда для новорождённых", "Другое"]],
  ["Детские товары для школы", ["Рюкзаки", "Канцелярия", "Учебные материалы", "Школьные принадлежности", "Другое"]],
  ["Услуги для детей", ["Репетиторы", "Няни", "Детские кружки", "Спортивные секции", "Подготовка к школе", "Другое"]],
]);
KIDS_GROUPS.subs.push("Другое");

const TRAVEL_GROUPS = buildGroupedCategory([
  ["Туры и путешествия", ["Туры по Таджикистану", "Туры за границу", "Экскурсии", "Горные туры", "Семейные туры", "Групповые туры", "Индивидуальные туры", "Другое"]],
  ["Отдых", ["Базы отдыха", "Дома отдыха", "Горные домики", "Кемпинги", "Глэмпинг", "Отдых у озера", "Отдых в горах", "Другое"]],
  ["Гостиницы и жильё", ["Отели", "Хостелы", "Гостевые дома", "Квартиры посуточно", "Дома посуточно", "Виллы", "Другое"]],
  ["Экскурсии и гиды", ["Гиды", "Экскурсоводы", "Групповые экскурсии", "Индивидуальные экскурсии", "Исторические экскурсии", "Горные экскурсии", "Другое"]],
  ["Аренда транспорта", ["Автомобили", "Внедорожники", "Микроавтобусы", "Мотоциклы", "Велосипеды", "Автомобили с водителем", "Другое"]],
  ["Билеты", ["Авиабилеты", "Железнодорожные билеты", "Автобусные билеты", "Другие билеты"]],
  ["Туристическое снаряжение", ["Палатки", "Спальные мешки", "Рюкзаки", "Туристическая мебель", "Походное оборудование", "Альпинистское снаряжение", "Другое"]],
  ["Туристические услуги", ["Трансфер", "Страхование", "Визовые услуги", "Организация путешествий", "Бронирование", "Другое"]],
]);
TRAVEL_GROUPS.subs.push("Другое");

const CLOTHING_GROUPS = buildGroupedCategory([
  ["Женская одежда", ["Платья", "Костюмы", "Брюки", "Джинсы", "Юбки", "Блузки и рубашки", "Футболки", "Свитера", "Верхняя одежда", "Национальная одежда", "Спортивная одежда", "Домашняя одежда", "Другое"]],
  ["Мужская одежда", ["Костюмы", "Рубашки", "Футболки", "Брюки", "Джинсы", "Куртки", "Пальто", "Свитера", "Спортивная одежда", "Национальная одежда", "Домашняя одежда", "Другое"]],
  ["Детская одежда", ["Для мальчиков", "Для девочек", "Для новорождённых", "Школьная одежда", "Верхняя одежда", "Спортивная одежда", "Другое"]],
  ["Обувь", ["Женская обувь", "Мужская обувь", "Детская обувь", "Кроссовки", "Ботинки", "Туфли", "Сандалии", "Домашняя обувь", "Другое"]],
  ["Верхняя одежда", ["Куртки", "Пальто", "Пуховики", "Плащи", "Жилеты", "Шубы", "Другое"]],
  ["Спортивная одежда", ["Спортивные костюмы", "Футболки", "Шорты", "Леггинсы", "Куртки", "Другое"]],
  ["Аксессуары", ["Сумки", "Рюкзаки", "Ремни", "Кошельки", "Головные уборы", "Шарфы", "Перчатки", "Другое"]],
  ["Национальная одежда", ["Курта", "Чапан", "Атлас", "Адрас", "Национальные платья", "Национальные костюмы", "Другое"]],
]);
CLOTHING_GROUPS.subs.push("Другое");

const CONSTRUCTION_GROUPS = buildGroupedCategory([
  ["Строительные материалы", ["Цемент", "Кирпич", "Газоблок", "Песок", "Щебень", "Гравий", "Гипсокартон", "Штукатурка", "Краска", "Другое"]],
  ["Отделочные материалы", ["Обои", "Ламинат", "Линолеум", "Плитка", "Керамогранит", "Потолочные материалы", "Декоративные материалы", "Другое"]],
  ["Инструменты", ["Электроинструменты", "Строительные инструменты", "Ручные инструменты", "Измерительные инструменты", "Сварочное оборудование", "Лестницы", "Другое"]],
  ["Строительная техника", ["Экскаваторы", "Погрузчики", "Краны", "Бетономешалки", "Компрессоры", "Генераторы", "Другая спецтехника"]],
  ["Строительные услуги", ["Строительство домов", "Ремонт квартир", "Ремонт домов", "Каменщики", "Электрики", "Сантехники", "Сварщики", "Кровельщики", "Малярные работы", "Плиточные работы", "Другое"]],
  ["Проектирование", ["Архитектурное проектирование", "Проектирование домов", "Дизайн интерьера", "3D-визуализация", "Чертежи", "Другое"]],
  ["Окна и двери", ["Пластиковые окна", "Алюминиевые окна", "Деревянные окна", "Межкомнатные двери", "Входные двери", "Гаражные ворота", "Другое"]],
  ["Кровля", ["Кровельные материалы", "Металлочерепица", "Профнастил", "Мягкая кровля", "Водосточные системы", "Монтаж кровли", "Другое"]],
  ["Электрика", ["Кабели", "Провода", "Розетки", "Выключатели", "Освещение", "Электрощиты", "Электрооборудование", "Другое"]],
  ["Сантехника", ["Трубы", "Смесители", "Раковины", "Унитазы", "Ванны", "Душевые кабины", "Водонагреватели", "Другое"]],
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
    img: "/img/food.svg",
    desc: "Выпечка, полуфабрикаты, готовые блюда и услуги поваров",
    subs: FOOD_GROUPS.subs,
    subGroups: FOOD_GROUPS.subGroups,
    specTemplate: [],
  },
  kids: {
    title: "Детский мир",
    shortTitle: "Детский мир",
    img: "/img/kids.svg",
    desc: "Одежда, игрушки, коляски, мебель и товары для детей",
    subs: KIDS_GROUPS.subs,
    subGroups: KIDS_GROUPS.subGroups,
    specTemplate: [],
  },
  travel: {
    title: "Путешествия",
    shortTitle: "Путешествия",
    img: "/img/travel.svg",
    desc: "Туры, жильё, экскурсии, билеты и аренда транспорта",
    subs: TRAVEL_GROUPS.subs,
    subGroups: TRAVEL_GROUPS.subGroups,
    specTemplate: [],
  },
  clothing: {
    title: "Одежда",
    shortTitle: "Одежда",
    img: "/img/clothing.svg",
    desc: "Женская, мужская и детская одежда, обувь и аксессуары",
    subs: CLOTHING_GROUPS.subs,
    subGroups: CLOTHING_GROUPS.subGroups,
    specTemplate: [],
  },
  construction: {
    title: "Строительство",
    shortTitle: "Строительство",
    img: "/img/construction.svg",
    desc: "Материалы, инструменты, техника и строительные услуги",
    subs: CONSTRUCTION_GROUPS.subs,
    subGroups: CONSTRUCTION_GROUPS.subGroups,
    specTemplate: [],
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
