export const REAL_ESTATE_CAT = "realestate";

export const DEFAULT_REAL_ESTATE_BROWSE_PATH =
  "/realestate/dushanbe/kvartiry/kupit";

export const DEAL_TYPES = [
  { value: "Купить", label: "Купить", icon: "buy" },
  { value: "Снять", label: "Снять", icon: "rent" },
  { value: "Посуточно", label: "Посуточно", icon: "daily" },
];

export const ROOM_OPTIONS = ["1", "2", "3", "4", "5", "5+"];

export const GUEST_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8+"];

export const DAILY_HOUSING_TYPES = [
  { value: "Квартиры", label: "Квартира" },
  { value: "Дома и коттеджи", label: "Дом" },
  { value: "Комнаты", label: "Комната" },
];

export const DAILY_AMENITY_OPTIONS = [
  "Wi-Fi",
  "Кондиционер",
  "Стиральная машина",
  "Посудомойка",
  "Парковка",
  "Балкон",
];

export function isDailyDeal(dealType = "") {
  return dealType === "Посуточно";
}

export function isSubcategoryCompatibleWithDeal(subcategory = "", dealType = "") {
  if (!subcategory) return true;
  if (isDailyDeal(dealType)) {
    return DAILY_HOUSING_TYPES.some((item) => item.value === subcategory);
  }
  if (subcategory === "Новостройки") {
    return dealType === "Купить" || !dealType;
  }
  return true;
}

export function getDefaultDealForSubcategory(subcategory = "") {
  if (subcategory === "Новостройки") return "Купить";
  return "";
}

export function parseGuestCapacity(value = "") {
  const raw = String(value).trim();
  if (!raw) return null;
  if (raw.includes("+")) {
    const n = Number(raw.replace(/\D/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function countNights(checkIn = "", checkOut = "") {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(`${checkIn}T12:00:00`);
  const end = new Date(`${checkOut}T12:00:00`);
  const diff = (end - start) / (1000 * 60 * 60 * 24);
  return diff > 0 ? Math.floor(diff) : 0;
}

export function formatGuestLabel(count = "") {
  const n = parseGuestCapacity(count);
  if (!n) return "Гости";
  const mod10 = n % 10;
  const mod100 = n % 100;
  let word = "гостей";
  if (mod10 === 1 && mod100 !== 11) word = "гость";
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) word = "гостя";
  return `${n}${String(count).includes("+") ? "+" : ""} ${word}`;
}

export const REAL_ESTATE_CITIES = ["Душанбе", "Худжанд"];

export const REAL_ESTATE_PRIMARY_CITIES = REAL_ESTATE_CITIES;

export const DUSHANBE_DISTRICTS = [
  "Центр",
  "Сино",
  "Фирдавси",
  "Шохмансур",
  "Исмоил Сомони",
  "82-й микрорайон",
  "84-й микрорайон",
  "92-й микрорайон",
  "98-й микрорайон",
  "102-й микрорайон",
  "116-й микрорайон",
  "120-й микрорайон",
  "140-й микрорайон",
  "Нижняя часть",
  "Варзоб",
  "Рудаки",
  "Айни",
];

export const POPULAR_DUSHANBE_DISTRICTS = [
  "Сино",
  "Фирдавси",
  "Шохмансур",
  "Исмоил Сомони",
  "102-й микрорайон",
  "120-й микрорайон",
];

export const CITY_DISTRICTS = {
  Душанбе: DUSHANBE_DISTRICTS,
  Худжанд: [
    "Центр",
    "Караван",
    "Авиагородок",
    "Зарафшон",
    "Куруш",
    "20 микрорайон",
    "Балх",
    "Согдиён",
  ],
};

export const CITY_COORDINATES = {
  Душанбе: { lat: 38.5598, lng: 68.787, zoom: 12 },
  Худжанд: { lat: 40.283, lng: 69.622, zoom: 12 },
};

export function getDistrictsForCity(city = "") {
  return CITY_DISTRICTS[city] || [];
}

export function getCityCoordinates(city = "") {
  return CITY_COORDINATES[city] || CITY_COORDINATES["Душанбе"];
}

export const NOVOSTROYKI_META = {
  icon: "building",
  desc: "Квартиры от застройщика и жилые комплексы",
  highlight: true,
};

/** Основные типы недвижимости (без новостроек — отдельный раздел). */
export const SUBCATEGORY_META = {
  Квартиры: {
    icon: "apartment",
    desc: "Вторичка и первичка",
    highlight: true,
  },
  "Дома и коттеджи": {
    icon: "home",
    desc: "Частные дома и дачи",
    highlight: true,
  },
  Комнаты: {
    icon: "door",
    desc: "Комнаты и койко-места",
  },
  Участки: {
    icon: "land",
    desc: "Земля под строительство",
  },
  "Гаражи и парковки": {
    icon: "garage",
    desc: "Гаражи, боксы, места",
  },
  "Коммерческая недвижимость": {
    icon: "commercial",
    desc: "Офисы, магазины, склады",
  },
};

/** Все подкатегории, включая новостройки (форма подачи, статистика). */
export const ALL_RE_SUBCATEGORIES = {
  Новостройки: NOVOSTROYKI_META,
  ...SUBCATEGORY_META,
};

export const REAL_ESTATE_PRICE_PRESETS = [
  { label: "Любая", from: "", to: "" },
  { label: "до 300 000 с.", from: "", to: "300000" },
  { label: "300 000 – 700 000 с.", from: "300000", to: "700000" },
  { label: "700 000 – 1 500 000 с.", from: "700000", to: "1500000" },
  { label: "1,5 – 3 млн с.", from: "1500000", to: "3000000" },
  { label: "3 – 7 млн с.", from: "3000000", to: "7000000" },
  { label: "от 7 млн с.", from: "7000000", to: "" },
];

export const REAL_ESTATE_RENT_PRESETS = [
  { label: "Любая", from: "", to: "" },
  { label: "до 800 с./мес.", from: "", to: "800" },
  { label: "800 – 1 500 с.", from: "800", to: "1500" },
  { label: "1 500 – 2 500 с.", from: "1500", to: "2500" },
  { label: "2 500 – 5 000 с.", from: "2500", to: "5000" },
  { label: "5 000 – 10 000 с.", from: "5000", to: "10000" },
  { label: "от 10 000 с.", from: "10000", to: "" },
];

export const REAL_ESTATE_DAILY_PRESETS = [
  { label: "Любая", from: "", to: "" },
  { label: "до 150 с./сут.", from: "", to: "150" },
  { label: "150 – 300 с.", from: "150", to: "300" },
  { label: "300 – 500 с.", from: "300", to: "500" },
  { label: "500 – 800 с.", from: "500", to: "800" },
  { label: "от 800 с.", from: "800", to: "" },
];

export const REAL_ESTATE_PRICE_PER_SQM_PRESETS = [
  { label: "до 4 000 с./м²", from: "", to: "4000" },
  { label: "4 000 – 6 000 с./м²", from: "4000", to: "6000" },
  { label: "6 000 – 8 000 с./м²", from: "6000", to: "8000" },
  { label: "8 000 – 12 000 с./м²", from: "8000", to: "12000" },
  { label: "от 12 000 с./м²", from: "12000", to: "" },
];

export function getPricePresetsForDeal(dealType = "") {
  if (dealType === "Снять") return REAL_ESTATE_RENT_PRESETS;
  if (dealType === "Посуточно") return REAL_ESTATE_DAILY_PRESETS;
  return REAL_ESTATE_PRICE_PRESETS;
}

export function realEstateSubcategoryUsesRooms(subcategory = "") {
  return ["", "Квартиры", "Новостройки", "Комнаты", "Дома и коттеджи"].includes(
    subcategory
  );
}

export function realEstateSubcategoryUsesFloor(subcategory = "") {
  return ["", "Квартиры", "Новостройки", "Комнаты", "Коммерческая недвижимость"].includes(
    subcategory
  );
}

export function realEstateSubcategoryUsesArea(subcategory = "") {
  return subcategory !== "";
}

const BUILD_YEARS = Array.from({ length: 2026 - 1970 + 1 }, (_, i) =>
  String(2026 - i)
);

export const APARTMENT_SPECS = [
  { name: "Тип сделки", type: "select", options: DEAL_TYPES.map((d) => d.value) },
  { name: "Гостей", type: "select", options: GUEST_OPTIONS, dailyOnly: true },
  { name: "Комнат", type: "select", options: ROOM_OPTIONS },
  { name: "Площадь общая", type: "text", placeholder: "м²" },
  { name: "Площадь жилая", type: "text", placeholder: "м²" },
  { name: "Этаж", type: "text" },
  { name: "Этажей в доме", type: "text" },
  { name: "Район", type: "select", options: DUSHANBE_DISTRICTS, dynamicOptionsFrom: "city" },
  { name: "Адрес", type: "text", placeholder: "Улица, дом, ориентир" },
  { name: "ЖК", type: "select", options: [] },
  { name: "Тип дома", type: "select", options: ["Кирпич", "Панель", "Монолит", "Блок", "Другое"] },
  { name: "Год постройки", type: "select", options: BUILD_YEARS },
  { name: "Ремонт", type: "select", options: ["Без ремонта", "Косметический", "Евро", "Дизайнерский"] },
  { name: "Балкон", type: "select", options: ["Есть", "Нет", "Лоджия", "2 балкона"] },
  { name: "Санузел", type: "select", options: ["Раздельный", "Совмещённый", "2 санузла"] },
  { name: "Мебель", type: "select", options: ["С мебелью", "Без мебели", "Частично"] },
  { name: "Удобства", type: "select", options: DAILY_AMENITY_OPTIONS, dailyOnly: true },
  { name: "Парковка", type: "select", options: ["Есть", "Нет", "Гараж", "Подземная"] },
  { name: "Состояние", type: "select", options: ["Новостройка", "Вторичка"] },
];

export const HOUSE_SPECS = [
  { name: "Тип сделки", type: "select", options: DEAL_TYPES.map((d) => d.value) },
  { name: "Гостей", type: "select", options: GUEST_OPTIONS, dailyOnly: true },
  { name: "Комнат", type: "select", options: ROOM_OPTIONS },
  { name: "Площадь дома", type: "text", placeholder: "м²" },
  { name: "Площадь участка", type: "text", placeholder: "сот." },
  { name: "Этажей", type: "select", options: ["1", "2", "3", "4+"] },
  { name: "Материал", type: "select", options: ["Кирпич", "Блок", "Дерево", "Каркас", "Смешанный"] },
  { name: "Коммуникации", type: "select", options: ["Все", "Частично", "Нет"] },
  { name: "Ремонт", type: "select", options: ["Без ремонта", "Косметический", "Евро", "Под ключ"] },
  { name: "Участок", type: "select", options: ["ИЖС", "Садовый", "Дачный"] },
];

export const LAND_SPECS = [
  { name: "Тип сделки", type: "select", options: DEAL_TYPES.map((d) => d.value) },
  { name: "Площадь участка", type: "text", placeholder: "сот. или м²" },
  { name: "Назначение", type: "select", options: ["ИЖС", "Сельхоз", "Коммерция", "Дачный"] },
  { name: "Коммуникации", type: "select", options: ["Все", "Частично", "Нет"] },
  { name: "Рельеф", type: "select", options: ["Ровный", "С уклоном", "Холмистый"] },
];

export const COMMERCIAL_SPECS = [
  { name: "Тип сделки", type: "select", options: DEAL_TYPES.map((d) => d.value) },
  { name: "Тип объекта", type: "select", options: ["Офис", "Магазин", "Склад", "Кафе", "Помещение свободного назначения"] },
  { name: "Площадь", type: "text", placeholder: "м²" },
  { name: "Этаж", type: "text" },
  { name: "Ремонт", type: "select", options: ["Без отделки", "Офисная", "Под ключ"] },
  { name: "Парковка", type: "select", options: ["Есть", "Нет"] },
];

export const GARAGE_SPECS = [
  { name: "Тип сделки", type: "select", options: DEAL_TYPES.map((d) => d.value) },
  { name: "Тип", type: "select", options: ["Гараж", "Машиноместо", "Бокс", "Подземный"] },
  { name: "Площадь", type: "text", placeholder: "м²" },
  { name: "Охрана", type: "select", options: ["Есть", "Нет"] },
];

export const ROOM_SPECS = [
  { name: "Тип сделки", type: "select", options: DEAL_TYPES.map((d) => d.value) },
  { name: "Площадь", type: "text", placeholder: "м²" },
  { name: "Этаж", type: "text" },
  { name: "Мебель", type: "select", options: ["С мебелью", "Без мебели"] },
  { name: "Соседи", type: "select", options: ["Семья", "Студенты", "Любые"] },
];

export const REAL_ESTATE_SUB_SPECS = {
  Новостройки: APARTMENT_SPECS,
  Квартиры: APARTMENT_SPECS,
  Комнаты: ROOM_SPECS,
  "Дома и коттеджи": HOUSE_SPECS,
  Участки: LAND_SPECS,
  "Гаражи и парковки": GARAGE_SPECS,
  "Коммерческая недвижимость": COMMERCIAL_SPECS,
};

export const QUICK_COLLECTIONS = [
  {
    title: "1-комн. в центре",
    params: {
      subcategory: "Квартиры",
      specs: { Комнат: "1", "Тип сделки": "Купить" },
      location: "Душанбе",
    },
  },
  {
    title: "Снять в Душанбе",
    params: {
      subcategory: "Квартиры",
      specs: { Комнат: "2", "Тип сделки": "Снять" },
      location: "Душанбе",
    },
  },
  {
    title: "Снять 2-комн.",
    params: {
      subcategory: "Квартиры",
      specs: { Комнат: "2", "Тип сделки": "Снять" },
    },
  },
  {
    title: "Дома и коттеджи",
    params: { subcategory: "Дома и коттеджи" },
  },
  {
    title: "Участки",
    params: { subcategory: "Участки" },
  },
  {
    title: "Посуточно в Душанбе",
    params: {
      subcategory: "Квартиры",
      specs: { "Тип сделки": "Посуточно" },
      location: "Душанбе",
    },
  },
  {
    title: "Коммерция",
    params: { subcategory: "Коммерческая недвижимость" },
  },
];
