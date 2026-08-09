import {
  DEAL_TYPES,
  REAL_ESTATE_CITIES,
  ROOM_OPTIONS,
  SUBCATEGORY_META,
  ALL_RE_SUBCATEGORIES,
} from "./realEstate";
import { REGIONS } from "./specOptions";

const REAL_ESTATE_SORT = {
  new: "Сначала новые",
  views_desc: "Сначала популярные",
  price_asc: "Цена по возрастанию",
  price_desc: "Цена по убыванию",
  price_per_sqm_asc: "Дешевле за м²",
  price_per_sqm_desc: "Дороже за м²",
};

const DAILY_RENT_SORT_EXCLUDE = new Set(["price_per_sqm_asc", "price_per_sqm_desc"]);

export function getRealEstateSortOptions(dealType = "") {
  if (dealType !== "Посуточно") return REAL_ESTATE_SORT;

  return Object.fromEntries(
    Object.entries(REAL_ESTATE_SORT).filter(([key]) => !DAILY_RENT_SORT_EXCLUDE.has(key))
  );
}

const DEAL_OPTIONS = DEAL_TYPES.map((item) => item.value);

const BUILD_YEARS = Array.from({ length: 2026 - 1970 + 1 }, (_, i) =>
  String(2026 - i)
);

const SUBCATEGORY_OPTIONS = Object.keys(ALL_RE_SUBCATEGORIES);

function subcategoryField() {
  return { id: "subcategory", label: "Тип недвижимости", type: "subcategory" };
}

function dealField() {
  return {
    id: "Тип сделки",
    label: "Сделка",
    type: "spec",
    specKey: "Тип сделки",
    options: DEAL_OPTIONS,
  };
}

function priceField() {
  return { id: "price", label: "Цена", type: "price" };
}

function roomsField() {
  return {
    id: "Комнат",
    label: "Комнат",
    type: "spec",
    specKey: "Комнат",
    options: ROOM_OPTIONS,
  };
}

function cityField() {
  return {
    id: "location",
    label: "Город",
    type: "location",
    options: REAL_ESTATE_CITIES,
  };
}

function districtField() {
  return {
    id: "Район",
    label: "Район",
    type: "city-district",
    specKey: "Район",
  };
}

function areaRange(label = "Площадь, м²") {
  return {
    id: "area",
    label,
    type: "range",
    rangeFromKey: "areaFrom",
    rangeToKey: "areaTo",
    placeholderFrom: "от",
    placeholderTo: "до",
  };
}

function floorRange() {
  return {
    id: "floor",
    label: "Этаж",
    type: "range",
    rangeFromKey: "floorFrom",
    rangeToKey: "floorTo",
    placeholderFrom: "от",
    placeholderTo: "до",
  };
}

function floorToggles() {
  return [
    {
      id: "floorNotFirst",
      label: "Не первый",
      type: "toggle",
      toggleKey: "floorNotFirst",
    },
    {
      id: "floorNotLast",
      label: "Не последний",
      type: "toggle",
      toggleKey: "floorNotLast",
    },
  ];
}

function spec(name, label = name, options = []) {
  return {
    id: name,
    label,
    type: "spec",
    specKey: name,
    options,
  };
}

function searchAndSort() {
  return [
    { id: "search", label: "Поиск", type: "search" },
    { id: "sort", label: "Сортировка", type: "sort" },
  ];
}

const APARTMENT_GRID = {
  sortOptions: REAL_ESTATE_SORT,
  rows: [
    [subcategoryField(), dealField(), roomsField(), priceField()],
    [areaRange(), floorRange(), ...floorToggles()],
    [
      cityField(),
      districtField(),
      spec("Тип дома", "Тип дома", ["Кирпич", "Панель", "Монолит", "Блок", "Другое"]),
      spec("Ремонт", "Ремонт", ["Без ремонта", "Косметический", "Евро", "Дизайнерский"]),
    ],
  ],
  more: [
    spec("Состояние", "Состояние", ["Новостройка", "Вторичка"]),
    spec("Мебель", "Мебель", ["С мебелью", "Без мебели", "Частично"]),
    spec("Балкон", "Балкон", ["Есть", "Нет", "Лоджия", "2 балкона"]),
    spec("Санузел", "Санузел", ["Раздельный", "Совмещённый", "2 санузла"]),
    spec("Парковка", "Парковка", ["Есть", "Нет", "Гараж", "Подземная"]),
    spec("Год постройки", "Год постройки", BUILD_YEARS),
    { id: "region", label: "Регион", type: "region", options: REGIONS },
    ...searchAndSort(),
  ],
};

const NEW_BUILD_GRID = {
  ...APARTMENT_GRID,
  rows: [
    [subcategoryField(), dealField(), roomsField(), priceField()],
    [areaRange(), floorRange(), ...floorToggles()],
    [
      cityField(),
      districtField(),
      spec("Тип дома", "Тип дома", ["Кирпич", "Панель", "Монолит", "Блок", "Другое"]),
      spec("Ремонт", "Ремонт", ["Без ремонта", "Косметический", "Евро", "Дизайнерский"]),
    ],
  ],
  more: [
    spec("Ремонт", "Ремонт", ["Без ремонта", "Косметический", "Евро", "Дизайнерский"]),
    spec("Состояние", "Состояние", ["Новостройка", "Вторичка"]),
    spec("Парковка", "Парковка", ["Есть", "Нет", "Гараж", "Подземная"]),
    spec("Год постройки", "Год постройки", BUILD_YEARS),
    { id: "region", label: "Регион", type: "region", options: REGIONS },
    ...searchAndSort(),
  ],
};

const ROOM_GRID = {
  sortOptions: REAL_ESTATE_SORT,
  rows: [
    [subcategoryField(), dealField(), priceField(), areaRange("Площадь, м²")],
    [
      floorRange(),
      spec("Мебель", "Мебель", ["С мебелью", "Без мебели"]),
      spec("Соседи", "Соседи", ["Семья", "Студенты", "Любые"]),
      null,
    ],
    [cityField(), districtField(), null, null],
  ],
  more: [
    { id: "region", label: "Регион", type: "region", options: REGIONS },
    ...searchAndSort(),
  ],
};

const HOUSE_GRID = {
  sortOptions: REAL_ESTATE_SORT,
  rows: [
    [subcategoryField(), dealField(), roomsField(), priceField()],
    [
      areaRange("Площадь дома, м²"),
      spec("Этажей", "Этажей в доме", ["1", "2", "3", "4+"]),
      spec("Материал", "Материал", ["Кирпич", "Блок", "Дерево", "Каркас", "Смешанный"]),
      spec("Коммуникации", "Коммуникации", ["Все", "Частично", "Нет"]),
    ],
    [
      cityField(),
      districtField(),
      spec("Ремонт", "Ремонт", ["Без ремонта", "Косметический", "Евро", "Под ключ"]),
      spec("Участок", "Тип участка", ["ИЖС", "Садовый", "Дачный"]),
    ],
  ],
  more: [
    { id: "region", label: "Регион", type: "region", options: REGIONS },
    ...searchAndSort(),
  ],
};

const LAND_GRID = {
  sortOptions: REAL_ESTATE_SORT,
  rows: [
    [subcategoryField(), dealField(), priceField(), areaRange("Площадь участка")],
    [
      spec("Назначение", "Назначение", ["ИЖС", "Сельхоз", "Коммерция", "Дачный"]),
      spec("Коммуникации", "Коммуникации", ["Все", "Частично", "Нет"]),
      spec("Рельеф", "Рельеф", ["Ровный", "С уклоном", "Холмистый"]),
      null,
    ],
    [cityField(), districtField(), null, null],
  ],
  more: [
    { id: "region", label: "Регион", type: "region", options: REGIONS },
    ...searchAndSort(),
  ],
};

const GARAGE_GRID = {
  sortOptions: REAL_ESTATE_SORT,
  rows: [
    [subcategoryField(), dealField(), priceField(), areaRange("Площадь, м²")],
    [
      spec("Тип", "Тип", ["Гараж", "Машиноместо", "Бокс", "Подземный"]),
      spec("Охрана", "Охрана", ["Есть", "Нет"]),
      null,
      null,
    ],
    [cityField(), districtField(), null, null],
  ],
  more: [
    { id: "region", label: "Регион", type: "region", options: REGIONS },
    ...searchAndSort(),
  ],
};

const COMMERCIAL_GRID = {
  sortOptions: REAL_ESTATE_SORT,
  rows: [
    [
      subcategoryField(),
      dealField(),
      priceField(),
      spec("Тип объекта", "Тип объекта", [
        "Офис",
        "Магазин",
        "Склад",
        "Кафе",
        "Помещение свободного назначения",
      ]),
    ],
    [
      areaRange("Площадь, м²"),
      floorRange(),
      spec("Ремонт", "Ремонт", ["Без отделки", "Офисная", "Под ключ"]),
      spec("Парковка", "Парковка", ["Есть", "Нет"]),
    ],
    [cityField(), districtField(), null, null],
  ],
  more: [
    { id: "region", label: "Регион", type: "region", options: REGIONS },
    ...searchAndSort(),
  ],
};

const DEFAULT_GRID = {
  sortOptions: REAL_ESTATE_SORT,
  rows: [
    [subcategoryField(), dealField(), roomsField(), priceField()],
    [areaRange(), floorRange(), cityField(), districtField()],
  ],
  more: [
    spec("Тип дома", "Тип дома", ["Кирпич", "Панель", "Монолит", "Блок", "Другое"]),
    spec("Ремонт", "Ремонт", ["Без ремонта", "Косметический", "Евро", "Дизайнерский"]),
    spec("Состояние", "Состояние", ["Новостройка", "Вторичка"]),
    { id: "region", label: "Регион", type: "region", options: REGIONS },
    ...searchAndSort(),
  ],
};

export const REAL_ESTATE_FILTER_GRIDS = {
  "": DEFAULT_GRID,
  Квартиры: APARTMENT_GRID,
  Новостройки: NEW_BUILD_GRID,
  Комнаты: ROOM_GRID,
  "Дома и коттеджи": HOUSE_GRID,
  Участки: LAND_GRID,
  "Гаражи и парковки": GARAGE_GRID,
  "Коммерческая недвижимость": COMMERCIAL_GRID,
};

export function getRealEstateFilterGrid(subcategory = "") {
  return REAL_ESTATE_FILTER_GRIDS[subcategory] || DEFAULT_GRID;
}

export function getRealEstateSubcategories() {
  return SUBCATEGORY_OPTIONS;
}

export function realEstateFilterUsesFloor(subcategory = "") {
  return ["", "Квартиры", "Новостройки", "Комнаты", "Коммерческая недвижимость"].includes(
    subcategory
  );
}

export function realEstateFilterUsesArea(subcategory = "") {
  return subcategory !== "";
}

export { REAL_ESTATE_SORT };
