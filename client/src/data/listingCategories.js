import {
  CAR_BRANDS,
  CAR_MODELS,
  LAPTOP_BRANDS,
  LAPTOP_MODELS,
  APPLIANCE_BRANDS,
  APPLIANCE_MODELS,
  COMMON_SPEC_OPTIONS,
} from "./specOptions";
import {
  PHONE_DEVICE_SPECS,
  resolvePhoneSpecTemplate,
} from "./phoneFilters";
import { REPAIR_MATERIALS_SUBS } from "./categoryConsolidation";
import {
  CLOTHING_APPAREL_SPECS,
  resolveClothingSpecTemplate,
} from "./clothingFilters";
import {
  FOOD_PRODUCT_SPECS,
  resolveFoodSpecTemplate,
} from "./foodFilters";
import {
  KIDS_GOODS_SPECS,
  resolveKidsSpecTemplate,
} from "./kidsFilters";
import {
  TRAVEL_TOUR_SPECS,
  resolveTravelSpecTemplate,
} from "./travelFilters";
import {
  CONSTRUCTION_GOODS_SPECS,
  resolveConstructionSpecTemplate,
} from "./constructionFilters";
import {
  BUSINESS_GOODS_SPECS,
  resolveBusinessSpecTemplate,
} from "./businessFilters";

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
  business: "Все для бизнеса",
};

export const CATEGORY_SELECT_OPTIONS = [
  { value: "", label: "Все категории" },
  ...Object.entries(CAT_LABELS).map(([value, label]) => ({ value, label })),
];

const CAR_SPECS = [
  { name: "Марка", type: "select", options: CAR_BRANDS },
  { name: "Модель", type: "select", dependsOn: "Марка", optionsFrom: CAR_MODELS },
  { name: "Комплектация", type: "text" },
  { name: "Год", type: "select", options: COMMON_SPEC_OPTIONS.years },
  { name: "Пробег", type: "text" },
  { name: "Кузов", type: "select", options: COMMON_SPEC_OPTIONS.bodyType },
  { name: "Привод", type: "select", options: COMMON_SPEC_OPTIONS.drive },
  { name: "Объем", type: "select", options: COMMON_SPEC_OPTIONS.engineVolume },
  { name: "КПП", type: "select", options: COMMON_SPEC_OPTIONS.kpp },
  { name: "Цвет", type: "select", options: COMMON_SPEC_OPTIONS.color },
  { name: "Цвет салона", type: "select", options: COMMON_SPEC_OPTIONS.interiorColor },
  { name: "Топливо", type: "select", options: COMMON_SPEC_OPTIONS.fuel },
  { name: "Мест", type: "select", options: COMMON_SPEC_OPTIONS.seats },
  { name: "Руль", type: "select", options: COMMON_SPEC_OPTIONS.steeringWheel },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
];

const PARTS_SPECS = [
  { name: "Тип запчасти", type: "select", options: COMMON_SPEC_OPTIONS.partType },
  { name: "Марка авто", type: "select", options: CAR_BRANDS },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
];

const TIRES_SPECS = [
  {
    name: "Тип",
    type: "select",
    options: ["Шины", "Диски", "Комплект"],
  },
  { name: "Сезон", type: "select", options: COMMON_SPEC_OPTIONS.tireSeason },
  { name: "Диаметр", type: "select", options: COMMON_SPEC_OPTIONS.tireDiameter },
  { name: "Ширина", type: "select", options: COMMON_SPEC_OPTIONS.tireWidth },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
];

const TRUCK_SPECS = [
  { name: "Марка", type: "text" },
  { name: "Модель", type: "text" },
  { name: "Год", type: "select", options: COMMON_SPEC_OPTIONS.years },
  { name: "Топливо", type: "select", options: COMMON_SPEC_OPTIONS.fuel },
  { name: "КПП", type: "select", options: COMMON_SPEC_OPTIONS.kpp },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
];

const MOTO_SPECS = [
  { name: "Марка", type: "text" },
  { name: "Модель", type: "text" },
  { name: "Год", type: "select", options: COMMON_SPEC_OPTIONS.years },
  {
    name: "Тип",
    type: "select",
    options: ["Мотоцикл", "Скутер", "Квадроцикл", "Другое"],
  },
  { name: "Объем", type: "select", options: COMMON_SPEC_OPTIONS.engineVolume },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
];

const HEAVY_VEHICLE_SPECS = [
  { name: "Марка", type: "text" },
  { name: "Модель", type: "text" },
  { name: "Год", type: "select", options: COMMON_SPEC_OPTIONS.years },
  { name: "Топливо", type: "select", options: COMMON_SPEC_OPTIONS.fuel },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
];

const TRAILER_SPECS = [
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
];

const FURNITURE_SPECS = [
  { name: "Тип", type: "select", options: COMMON_SPEC_OPTIONS.furnitureType },
  { name: "Материал", type: "select", options: COMMON_SPEC_OPTIONS.material },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
  { name: "Цвет", type: "select", options: COMMON_SPEC_OPTIONS.color },
  { name: "Размеры", type: "text" },
];

const FURNITURE_CUSTOM_SPECS = [
  { name: "Тип", type: "select", options: COMMON_SPEC_OPTIONS.furnitureType },
  { name: "Материал", type: "select", options: COMMON_SPEC_OPTIONS.material },
  { name: "Цвет", type: "select", options: COMMON_SPEC_OPTIONS.color },
  { name: "Размеры", type: "text" },
];

function resolveFurnitureSpecTemplate(subcategory = "") {
  return subcategory === "Мебель на заказ" ? FURNITURE_CUSTOM_SPECS : FURNITURE_SPECS;
}

const HOME_APPLIANCE_TYPES = [
  "Холодильник",
  "Стиральная машина",
  "Плита",
  "Телевизор",
  "Пылесос",
  "Микроволновка",
  "Водонагреватель",
  "Другое",
];

const CCTV_TYPES = ["Камера", "Регистратор", "Комплект видеонаблюдения", "Другое"];
const CCTV_BRANDS = ["Hikvision", "Dahua", "Xiaomi", "TP-Link", "Imou", "Другое"];
const CLIMATE_TYPES = ["Кондиционер", "Вентилятор", "Увлажнитель", "Очиститель воздуха", "Другое"];
const HEATER_TYPES = ["Масляный", "Конвектор", "Инфракрасный", "Тепловентилятор", "Другое"];

const ELECTRONICS_HOME_SPECS = [
  { name: "Тип", type: "select", options: HOME_APPLIANCE_TYPES },
  { name: "Бренд", type: "select", options: APPLIANCE_BRANDS },
  {
    name: "Модель",
    type: "select",
    dependsOn: "Бренд",
    optionsFrom: APPLIANCE_MODELS,
  },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
  { name: "Гарантия", type: "select", options: COMMON_SPEC_OPTIONS.warranty },
];

const ELECTRONICS_CCTV_SPECS = [
  { name: "Тип", type: "select", options: CCTV_TYPES },
  { name: "Бренд", type: "select", options: CCTV_BRANDS },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
  { name: "Гарантия", type: "select", options: COMMON_SPEC_OPTIONS.warranty },
];

const ELECTRONICS_CLIMATE_SPECS = [
  { name: "Тип", type: "select", options: CLIMATE_TYPES },
  { name: "Бренд", type: "select", options: APPLIANCE_BRANDS },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
  { name: "Гарантия", type: "select", options: COMMON_SPEC_OPTIONS.warranty },
];

const ELECTRONICS_HEATER_SPECS = [
  { name: "Тип", type: "select", options: HEATER_TYPES },
  { name: "Бренд", type: "select", options: APPLIANCE_BRANDS },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
  { name: "Гарантия", type: "select", options: COMMON_SPEC_OPTIONS.warranty },
];

function resolveElectronicsSpecTemplate(subcategory = "") {
  if (subcategory === "Видеонаблюдение и камеры") return ELECTRONICS_CCTV_SPECS;
  if (subcategory === "Климатическая техника") return ELECTRONICS_CLIMATE_SPECS;
  if (subcategory === "Обогреватели") return ELECTRONICS_HEATER_SPECS;
  return ELECTRONICS_HOME_SPECS;
}

const COMPUTER_LAPTOP_SPECS = [
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
];

const COMPUTER_PC_SPECS = [
  { name: "Тип", type: "select", options: ["Готовый ПК", "Сборка"] },
  { name: "Процессор", type: "text" },
  { name: "ОЗУ", type: "select", options: COMMON_SPEC_OPTIONS.ram },
  { name: "Накопитель", type: "select", options: COMMON_SPEC_OPTIONS.storage },
  { name: "Видеокарта", type: "text" },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
];

const COMPUTER_CONSOLE_SPECS = [
  {
    name: "Платформа",
    type: "select",
    options: ["PlayStation", "Xbox", "Nintendo Switch", "Другое"],
  },
  { name: "Модель", type: "text" },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
];

const COMPUTER_PRINTER_SPECS = [
  { name: "Тип", type: "select", options: ["Принтер", "МФУ", "Сканер", "Другое"] },
  { name: "Бренд", type: "select", options: ["HP", "Canon", "Epson", "Brother", "Другое"] },
  { name: "Модель", type: "text" },
  { name: "Состояние", type: "select", options: COMMON_SPEC_OPTIONS.condition },
];

function resolveComputerSpecTemplate(subcategory = "") {
  if (subcategory === "ПК") return COMPUTER_PC_SPECS;
  if (subcategory === "Приставки") return COMPUTER_CONSOLE_SPECS;
  if (subcategory === "Принтеры и сканеры") return COMPUTER_PRINTER_SPECS;
  return COMPUTER_LAPTOP_SPECS;
}

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

/** Somon.tj-style business taxonomy (vsyo-dlya-biznesa). */
const BUSINESS_GROUPS = buildGroupedCategory([
  [
    "Бизнес на продажу",
    [
      "Торговля, магазины",
      "Кафе, рестораны, общепит",
      "Производство, фабрики",
      "Автосервисы, автомойки, шиномонтаж",
      "Салоны красоты",
      "Фермы, сады",
      "Интернет, сайты, домены",
      "Развлекательные аттракционы",
      "Другое",
    ],
  ],
  [
    "Оборудование",
    [
      "Для магазина",
      "Для кафе и ресторана",
      "Для салона красоты",
      "Для автосервиса и автомоек",
      "Пищевое производство",
      "Промышленное",
      "Строительное",
      "Медицинское",
      "Электрооборудование",
      "Бочки, цистерны, ёмкости",
      "Терминалы / кассовые аппараты",
      "Полиграфия",
      "Другое",
    ],
  ],
  [
    "Сырьё и материалы",
    [
      "Пищевое сырьё",
      "Упаковка",
      "Для производства",
      "Химия и расходники",
      "Другое",
    ],
  ],
  [
    "Готовый бизнес в аренду",
    [
      "Торговля, магазины",
      "Кафе, рестораны, общепит",
      "Автосервисы, автомойки",
      "Салоны красоты",
      "Производство",
      "Другое",
    ],
  ],
]);
BUSINESS_GROUPS.subs.push("Другое");

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
      "Грузовики и автобусы": TRUCK_SPECS,
      "Мототранспорт": MOTO_SPECS,
      "Сельхозтехника": HEAVY_VEHICLE_SPECS,
      "Спецтехника": HEAVY_VEHICLE_SPECS,
      "Прицепы": TRAILER_SPECS,
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
    specTemplate: FURNITURE_SPECS,
    resolveSpecTemplate: resolveFurnitureSpecTemplate,
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
    specTemplate: PHONE_DEVICE_SPECS,
    resolveSpecTemplate: resolvePhoneSpecTemplate,
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
    specTemplate: ELECTRONICS_HOME_SPECS,
    resolveSpecTemplate: resolveElectronicsSpecTemplate,
  },
  computers: {
    title: "Компьютеры и оргтехника",
    shortTitle: "Компьютеры",
    img: "/img/computers.png",
    desc: "ПК, ноутбуки, оргтехника",
    subs: ["Ноутбуки", "ПК", "Приставки", "Принтеры и сканеры"],
    specTemplate: COMPUTER_LAPTOP_SPECS,
    resolveSpecTemplate: resolveComputerSpecTemplate,
  },
  services: {
    title: "Услуги",
    shortTitle: "Услуги",
    img: "/img/services.png",
    desc: "Специалисты, ремонт, обучение и сервис",
    subs: [
      "Ремонт и строительство",
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
    },
    crossLinks: [
      {
        label: "Стройматериалы и инструменты",
        to: "/c/construction",
      },
    ],
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
    crossLinks: [
      {
        label: "Взрослая одежда и обувь",
        to: "/c/clothing",
      },
    ],
    specTemplate: KIDS_GOODS_SPECS,
    resolveSpecTemplate: resolveKidsSpecTemplate,
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
    specTemplate: TRAVEL_TOUR_SPECS,
    resolveSpecTemplate: resolveTravelSpecTemplate,
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
    specTemplate: CONSTRUCTION_GOODS_SPECS,
    resolveSpecTemplate: resolveConstructionSpecTemplate,
  },
  business: {
    title: "Все для бизнеса",
    shortTitle: "Бизнес",
    img: "/img/business.png",
    desc: "Готовый бизнес, оборудование, сырьё и аренда под ключ",
    subs: BUSINESS_GROUPS.subs,
    subGroups: BUSINESS_GROUPS.subGroups,
    specTemplate: BUSINESS_GOODS_SPECS,
    resolveSpecTemplate: resolveBusinessSpecTemplate,
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
