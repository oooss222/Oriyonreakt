export const LOCATIONS = [
  "Душанбе",
  "Худжанд",
  "Бохтар",
  "Куляб",
  "Вахдат",
  "Истаравшан",
  "Турсунзаде",
  "Исфара",
  "Пенджикент",
  "Рогун",
];

export const PRICE_MAX_DIGITS = 12;

export function formatPriceInput(value, maxDigits = PRICE_MAX_DIGITS) {
  const cleaned = String(value).replace(/[^\d]/g, "").slice(0, maxDigits);
  if (!cleaned) return "";
  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function getPriceDigits(value, maxDigits = PRICE_MAX_DIGITS) {
  return String(value).replace(/[^\d]/g, "").slice(0, maxDigits);
}

export const CAR_BRANDS = [
  "Toyota",
  "Hyundai",
  "Kia",
  "Mercedes-Benz",
  "BMW",
  "Audi",
  "Volkswagen",
  "Lada",
  "Chevrolet",
  "Nissan",
  "Honda",
  "Ford",
  "Lexus",
  "Mazda",
  "Mitsubishi",
];

export const CAR_MODELS = {
  Toyota: ["Camry", "Corolla", "RAV4", "Land Cruiser", "Highlander", "Prius", "Yaris"],
  Hyundai: ["Sonata", "Elantra", "Tucson", "Santa Fe", "Accent", "Creta", "Palisade"],
  Kia: ["Sportage", "K5", "Rio", "Sorento", "Cerato", "Seltos", "Carnival"],
  "Mercedes-Benz": ["E-Class", "C-Class", "S-Class", "GLC", "GLE", "A-Class", "G-Class"],
  BMW: ["3 Series", "5 Series", "7 Series", "X3", "X5", "X6", "X7"],
  Audi: ["A4", "A6", "A8", "Q3", "Q5", "Q7", "Q8"],
  Volkswagen: ["Polo", "Jetta", "Passat", "Tiguan", "Touareg", "Golf"],
  Lada: ["Vesta", "Granta", "Largus", "Niva", "XRAY", "Kalina"],
  Chevrolet: ["Cobalt", "Malibu", "Tracker", "Equinox", "Captiva", "Spark"],
  Nissan: ["Almera", "Teana", "X-Trail", "Qashqai", "Patrol", "Sentra"],
  Honda: ["Accord", "Civic", "CR-V", "Pilot", "Fit", "HR-V"],
  Ford: ["Focus", "Fusion", "Explorer", "Escape", "Mustang", "F-150"],
  Lexus: ["ES", "RX", "NX", "LX", "IS", "GX"],
  Mazda: ["3", "6", "CX-5", "CX-9", "CX-30", "MX-5"],
  Mitsubishi: ["Outlander", "Pajero", "L200", "ASX", "Eclipse Cross", "Lancer"],
};

export const PHONE_BRANDS = [
  "Apple",
  "Samsung",
  "Xiaomi",
  "Huawei",
  "Honor",
  "Realme",
  "Google",
  "OnePlus",
];

export const PHONE_MODELS = {
  Apple: [
    "iPhone SE",
    "iPhone 11",
    "iPhone 12",
    "iPhone 13",
    "iPhone 14",
    "iPhone 15",
    "iPhone 15 Pro",
    "iPhone 15 Pro Max",
  ],
  Samsung: [
    "Galaxy A04",
    "Galaxy A14",
    "Galaxy A24",
    "Galaxy A54",
    "Galaxy S21",
    "Galaxy S22",
    "Galaxy S23",
    "Galaxy S24",
    "Galaxy Z Flip",
    "Galaxy Z Fold",
  ],
  Xiaomi: [
    "Redmi 9",
    "Redmi 10",
    "Redmi Note 11",
    "Redmi Note 12",
    "Redmi Note 13",
    "POCO X5",
    "POCO F5",
    "Mi 11",
    "Mi 12",
  ],
  Huawei: ["P30", "P40", "P50", "P60", "Nova 9", "Nova 11", "Mate 40", "Mate 50"],
  Honor: ["Honor 50", "Honor 70", "Honor 90", "Honor X8", "Honor Magic 5"],
  Realme: ["Realme 9", "Realme 10", "Realme 11", "Realme C55", "Realme GT"],
  Google: ["Pixel 6", "Pixel 7", "Pixel 8", "Pixel 8 Pro"],
  OnePlus: ["OnePlus 9", "OnePlus 10", "OnePlus 11", "OnePlus Nord"],
};

export const LAPTOP_BRANDS = [
  "Apple",
  "Asus",
  "Lenovo",
  "HP",
  "Dell",
  "Acer",
  "MSI",
  "Huawei",
];

export const LAPTOP_MODELS = {
  Apple: ["MacBook Air M1", "MacBook Air M2", "MacBook Pro 13", "MacBook Pro 14", "MacBook Pro 16"],
  Asus: ["VivoBook", "ZenBook", "TUF Gaming", "ROG Strix", "ExpertBook"],
  Lenovo: ["IdeaPad", "ThinkPad", "Legion", "Yoga", "LOQ"],
  HP: ["Pavilion", "Envy", "Victus", "Omen", "ProBook", "EliteBook"],
  Dell: ["Inspiron", "XPS", "Latitude", "Vostro", "Alienware"],
  Acer: ["Aspire", "Swift", "Nitro", "Predator", "TravelMate"],
  MSI: ["Modern", "Creator", "Katana", "Pulse", "Raider"],
  Huawei: ["MateBook D", "MateBook X Pro", "MateBook 14", "MateBook 16"],
};

export const APPLIANCE_BRANDS = [
  "Samsung",
  "LG",
  "Bosch",
  "Beko",
  "Hisense",
  "Xiaomi",
  "Indesit",
  "Artel",
];

export const APPLIANCE_MODELS = {
  Samsung: ["Холодильник RB", "Стиральная машина WW", "Телевизор Crystal UHD", "Пылесос Jet"],
  LG: ["Холодильник DoorCooling", "Стиральная машина F2", "Телевизор OLED", "Кондиционер"],
  Bosch: ["Serie 4", "Serie 6", "Serie 8", "MaxoMixx"],
  Beko: ["GN", "WUE", "LED TV", "DS"],
  Hisense: ["Smart TV", "Холодильник", "Стиральная машина", "Кондиционер"],
  Xiaomi: ["Mi TV", "Robot Vacuum", "Air Purifier", "Стиральная машина"],
  Indesit: ["IWSC", "DF", "IF", "LI"],
  Artel: ["Холодильник", "Стиральная машина", "Телевизор", "Кондиционер"],
};

const YEARS = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => String(2026 - i));

export const COMMON_SPEC_OPTIONS = {
  kpp: ["Автомат", "Механика", "Робот", "Вариатор"],
  fuel: ["Бензин", "Дизель", "Газ", "Гибрид", "Электро"],
  condition: ["Новый", "Б/у", "Требует ремонта"],
  color: ["Белый", "Чёрный", "Серый", "Синий", "Красный", "Серебристый", "Другой"],
  memory: ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB"],
  warranty: ["Да", "Нет"],
  years: YEARS,
  material: ["Дерево", "МДФ", "ДСП", "Металл", "Пластик", "Стекло", "Комбинированный"],
  furnitureType: ["Диван", "Кровать", "Шкаф", "Стол", "Стул", "Комод", "Кухня", "Другое"],
  applianceType: ["Холодильник", "Стиральная машина", "Плита", "Телевизор", "Пылесос", "Кондиционер", "Другое"],
  computerType: ["Ноутбук", "ПК", "Монитор", "Принтер", "Игровая приставка", "Другое"],
  ram: ["4 GB", "8 GB", "16 GB", "32 GB", "64 GB"],
  storage: ["128 GB SSD", "256 GB SSD", "512 GB SSD", "1 TB SSD", "1 TB HDD", "2 TB HDD"],
  repairType: ["Окна", "Двери", "Кирпич", "Цемент", "Краска", "Инструмент", "Забор", "Другое"],
  partType: ["Двигатель", "Кузов", "Подвеска", "Электрика", "Салон", "Оптика", "Фильтры", "Другое"],
  tireSeason: ["Летние", "Зимние", "Всесезонные"],
  tireDiameter: ['R13', 'R14', 'R15', 'R16', 'R17', 'R18', 'R19', 'R20', 'R21'],
  tireWidth: ["175", "185", "195", "205", "215", "225", "235", "245", "255", "265"],
  autoServiceType: ["Ремонт", "Диагностика", "Шиномонтаж", "Мойка", "Тюнинг", "Эвакуатор", "Другое"],
};

export function getDependentOptions(spec, allSpecs) {
  if (Array.isArray(spec.options) && spec.options.length > 0) {
    return spec.options;
  }

  if (spec.dependsOn && spec.optionsFrom) {
    const parent = allSpecs.find((row) => row.name === spec.dependsOn);
    const parentValue = parent?.value || "";
    return spec.optionsFrom[parentValue] || [];
  }

  return [];
}

export const SPEC_DEPENDENCIES = {
  Марка: ["Модель"],
  "Марка авто": [],
  Производитель: ["Модель"],
  Бренд: ["Модель"],
};
