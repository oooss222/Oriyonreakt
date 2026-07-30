export const REAL_ESTATE_CAT = "realestate";

export const DEAL_TYPES = [
  { value: "Купить", label: "Купить", icon: "buy" },
  { value: "Снять", label: "Снять", icon: "rent" },
  { value: "Посуточно", label: "Посуточно", icon: "daily" },
];

export const ROOM_OPTIONS = ["1", "2", "3", "4", "5", "5+"];

export const REAL_ESTATE_CITIES = [
  "Душанбе",
  "Худжанд",
  "Бохтар",
  "Куляб",
  "Вахдат",
  "Истаравшан",
  "Турсунзаде",
  "Исфара",
  "Пенджикент",
  "Хорог",
  "Рогун",
];

export const DUSHANBE_DISTRICTS = [
  "Центр",
  "Сино",
  "Фирдавси",
  "Шохмансур",
  "Исмоил Сомони",
  "92-й микрорайон",
  "102-й микрорайон",
  "120-й микрорайон",
  "140-й микрорайон",
  "Нижняя часть",
  "Варзоб",
];

export const CITY_DISTRICTS = {
  Душанбе: DUSHANBE_DISTRICTS,
  Худжанд: ["Центр", "Караван", "Авиагородок", "Зарафшон", "Куруш", "20 микрорайон"],
  Бохтар: ["Центр", "50 лет Октября", "Бозор", "Комсомол"],
  Куляб: ["Центр", "Новый город", "Бохтар"],
  Вахдат: ["Центр", "Сомони", "Рохати"],
  Истаравшан: ["Центр", "Согдиена", "Куйбышев"],
  Турсунзаде: ["Центр", "Рохат", "Шахритус"],
  Исфара: ["Центр", "Сомони", "Нав"],
  Пенджикент: ["Центр", "Рудаки", "Сомони"],
  Хорог: ["Центр", "Сомони", "Навбахор"],
  Рогун: ["Центр", "Строительная зона"],
};

export const CITY_COORDINATES = {
  Душанбе: { lat: 38.5598, lng: 68.787, zoom: 12 },
  Худжанд: { lat: 40.283, lng: 69.622, zoom: 12 },
  Бохтар: { lat: 37.836, lng: 68.781, zoom: 12 },
  Куляб: { lat: 37.909, lng: 69.782, zoom: 12 },
  Вахдат: { lat: 38.556, lng: 69.015, zoom: 13 },
  Истаравшан: { lat: 39.914, lng: 69.007, zoom: 12 },
  Турсунзаде: { lat: 38.512, lng: 68.231, zoom: 12 },
  Исфара: { lat: 40.126, lng: 70.625, zoom: 12 },
  Пенджикент: { lat: 39.492, lng: 67.608, zoom: 12 },
  Хорог: { lat: 37.491, lng: 71.559, zoom: 12 },
  Рогун: { lat: 38.691, lng: 69.958, zoom: 12 },
};

export function getDistrictsForCity(city = "") {
  return CITY_DISTRICTS[city] || [];
}

export function getCityCoordinates(city = "") {
  return CITY_COORDINATES[city] || CITY_COORDINATES["Душанбе"];
}

export const SUBCATEGORY_META = {
  Новостройки: {
    icon: "building",
    desc: "Квартиры от застройщика",
    highlight: true,
  },
  Квартиры: {
    icon: "apartment",
    desc: "Вторичка и первичка",
    highlight: true,
  },
  Комнаты: {
    icon: "door",
    desc: "Комнаты и койко-места",
  },
  "Дома и коттеджи": {
    icon: "home",
    desc: "Частные дома и дачи",
    highlight: true,
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

export const REAL_ESTATE_PRICE_PRESETS = [
  { label: "Любая", from: "", to: "" },
  { label: "до 200 000 с.", from: "", to: "200000" },
  { label: "200 000 – 500 000 с.", from: "200000", to: "500000" },
  { label: "500 000 – 1 000 000 с.", from: "500000", to: "1000000" },
  { label: "1 – 2 млн с.", from: "1000000", to: "2000000" },
  { label: "2 – 5 млн с.", from: "2000000", to: "5000000" },
  { label: "от 5 млн с.", from: "5000000", to: "" },
];

export const REAL_ESTATE_RENT_PRESETS = [
  { label: "Любая", from: "", to: "" },
  { label: "до 1 500 с.", from: "", to: "1500" },
  { label: "1 500 – 3 000 с.", from: "1500", to: "3000" },
  { label: "3 000 – 5 000 с.", from: "3000", to: "5000" },
  { label: "5 000 – 10 000 с.", from: "5000", to: "10000" },
  { label: "от 10 000 с.", from: "10000", to: "" },
];

const BUILD_YEARS = Array.from({ length: 2026 - 1970 + 1 }, (_, i) =>
  String(2026 - i)
);

export const APARTMENT_SPECS = [
  { name: "Тип сделки", type: "select", options: DEAL_TYPES.map((d) => d.value) },
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
  { name: "Парковка", type: "select", options: ["Есть", "Нет", "Гараж", "Подземная"] },
  { name: "Состояние", type: "select", options: ["Новостройка", "Вторичка"] },
];

export const HOUSE_SPECS = [
  { name: "Тип сделки", type: "select", options: DEAL_TYPES.map((d) => d.value) },
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
    title: "Снять 2-комн.",
    params: {
      subcategory: "Квартиры",
      specs: { Комнат: "2", "Тип сделки": "Снять" },
    },
  },
  {
    title: "Новостройки",
    params: { subcategory: "Новостройки", specs: { "Тип сделки": "Купить" } },
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
    title: "Коммерция",
    params: { subcategory: "Коммерческая недвижимость" },
  },
];
