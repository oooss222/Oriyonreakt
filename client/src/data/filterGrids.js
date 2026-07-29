import {
  CAR_BRANDS,
  CAR_MODELS,
  COMMON_SPEC_OPTIONS,
  LOCATIONS,
  PHONE_BRANDS,
  REGIONS,
} from "./specOptions";
import { CATS, getListSpecFilters } from "./listingCategories";
import {
  DEAL_TYPES,
  DUSHANBE_DISTRICTS,
  REAL_ESTATE_CITIES,
  ROOM_OPTIONS,
} from "./realEstate";

const TRANSPORT_GRID = {
  rows: [
    [
      { id: "subcategory", label: "Легковые авто", type: "subcategory" },
      { id: "Марка", label: "Марка", type: "spec", specKey: "Марка", options: CAR_BRANDS },
      { id: "price", label: "Цена", type: "price" },
      { id: "Год", label: "Год", type: "spec", specKey: "Год", options: COMMON_SPEC_OPTIONS.years },
    ],
    [
      {
        id: "Пробег",
        label: "Пробег, км",
        type: "spec",
        specKey: "Пробег",
        options: COMMON_SPEC_OPTIONS.mileage,
      },
      {
        id: "Топливо",
        label: "Тип двигателя",
        type: "spec",
        specKey: "Топливо",
        options: COMMON_SPEC_OPTIONS.fuel,
      },
      {
        id: "Объем",
        label: "Объем, л",
        type: "spec",
        specKey: "Объем",
        options: COMMON_SPEC_OPTIONS.engineVolume,
      },
      {
        id: "КПП",
        label: "Коробка передач",
        type: "spec",
        specKey: "КПП",
        options: COMMON_SPEC_OPTIONS.kpp,
      },
    ],
    [
      {
        id: "Кузов",
        label: "Тип кузова",
        type: "spec",
        specKey: "Кузов",
        options: COMMON_SPEC_OPTIONS.bodyType,
      },
      {
        id: "Привод",
        label: "Привод",
        type: "spec",
        specKey: "Привод",
        options: COMMON_SPEC_OPTIONS.drive,
      },
      { id: "region", label: "Регион", type: "region", options: REGIONS },
      { id: "location", label: "Город / Район", type: "location", options: LOCATIONS },
    ],
  ],
  more: [
    {
      id: "Модель",
      label: "Модель",
      type: "spec-dependent",
      specKey: "Модель",
      dependsOn: "Марка",
      optionsFrom: CAR_MODELS,
    },
    {
      id: "Состояние",
      label: "Состояние",
      type: "spec",
      specKey: "Состояние",
      options: COMMON_SPEC_OPTIONS.condition,
    },
    {
      id: "Цвет",
      label: "Цвет",
      type: "spec",
      specKey: "Цвет",
      options: COMMON_SPEC_OPTIONS.color,
    },
    { id: "search", label: "Поиск", type: "search" },
    { id: "sort", label: "Сортировка", type: "sort" },
  ],
};

const PHONES_GRID = {
  rows: [
    [
      { id: "subcategory", label: "Подкатегория", type: "subcategory" },
      {
        id: "Производитель",
        label: "Производитель",
        type: "spec",
        specKey: "Производитель",
        options: PHONE_BRANDS,
      },
      { id: "price", label: "Цена", type: "price" },
      {
        id: "Память",
        label: "Память",
        type: "spec",
        specKey: "Память",
        options: COMMON_SPEC_OPTIONS.memory,
      },
    ],
    [
      {
        id: "Состояние",
        label: "Состояние",
        type: "spec",
        specKey: "Состояние",
        options: COMMON_SPEC_OPTIONS.condition,
      },
      {
        id: "Гарантия",
        label: "Гарантия",
        type: "spec",
        specKey: "Гарантия",
        options: COMMON_SPEC_OPTIONS.warranty,
      },
      { id: "region", label: "Регион", type: "region", options: REGIONS },
      { id: "location", label: "Город / Район", type: "location", options: LOCATIONS },
    ],
  ],
  more: [
    { id: "search", label: "Поиск", type: "search" },
    { id: "sort", label: "Сортировка", type: "sort" },
  ],
};

const REAL_ESTATE_GRID = {
  sortOptions: {
    new: "Сначала новые",
    views_desc: "Сначала популярные",
    price_asc: "Цена по возрастанию",
    price_desc: "Цена по убыванию",
    price_per_sqm_asc: "Дешевле за м²",
    price_per_sqm_desc: "Дороже за м²",
  },
  rows: [
    [
      { id: "subcategory", label: "Тип", type: "subcategory" },
      {
        id: "Тип сделки",
        label: "Сделка",
        type: "spec",
        specKey: "Тип сделки",
        options: DEAL_TYPES.map((item) => item.value),
      },
      {
        id: "Комнат",
        label: "Комнат",
        type: "spec",
        specKey: "Комнат",
        options: ROOM_OPTIONS,
      },
      { id: "price", label: "Цена", type: "price" },
    ],
    [
      {
        id: "area",
        label: "Площадь, м²",
        type: "range",
        rangeFromKey: "areaFrom",
        rangeToKey: "areaTo",
        placeholderFrom: "от",
        placeholderTo: "до",
      },
      {
        id: "floor",
        label: "Этаж",
        type: "range",
        rangeFromKey: "floorFrom",
        rangeToKey: "floorTo",
        placeholderFrom: "от",
        placeholderTo: "до",
      },
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
    ],
    [
      {
        id: "Район",
        label: "Район",
        type: "spec",
        specKey: "Район",
        options: DUSHANBE_DISTRICTS,
      },
      {
        id: "Тип дома",
        label: "Тип дома",
        type: "spec",
        specKey: "Тип дома",
        options: ["Кирпич", "Панель", "Монолит", "Блок", "Другое"],
      },
      {
        id: "Ремонт",
        label: "Ремонт",
        type: "spec",
        specKey: "Ремонт",
        options: ["Без ремонта", "Косметический", "Евро", "Дизайнерский"],
      },
      {
        id: "location",
        label: "Город",
        type: "location",
        options: REAL_ESTATE_CITIES,
      },
    ],
  ],
  more: [
    {
      id: "Состояние",
      label: "Состояние",
      type: "spec",
      specKey: "Состояние",
      options: ["Новостройка", "Вторичка", "Требует ремонта"],
    },
    {
      id: "Мебель",
      label: "Мебель",
      type: "spec",
      specKey: "Мебель",
      options: ["С мебелью", "Без мебели", "Частично"],
    },
    { id: "region", label: "Регион", type: "region", options: REGIONS },
    { id: "search", label: "Поиск", type: "search" },
    { id: "sort", label: "Сортировка", type: "sort" },
  ],
};

function buildGenericGrid(catKey, subcategory = "") {
  const specFilters = getListSpecFilters(catKey, subcategory).slice(0, 4);

  const row1 = [
    { id: "subcategory", label: "Подкатегория", type: "subcategory" },
    { id: "price", label: "Цена", type: "price" },
    { id: "region", label: "Регион", type: "region", options: REGIONS },
    { id: "location", label: "Город / Район", type: "location", options: LOCATIONS },
  ];

  if (!specFilters.length) {
    return {
      rows: [row1],
      more: [
        { id: "search", label: "Поиск", type: "search" },
        { id: "sort", label: "Сортировка", type: "sort" },
      ],
    };
  }

  const specRow = specFilters.map((filter) => ({
    id: filter.name,
    label: filter.name,
    type: "spec",
    specKey: filter.name,
    options: filter.options,
  }));

  while (specRow.length < 4) {
    specRow.push(null);
  }

  return {
    rows: [row1, specRow],
    more: [
      { id: "search", label: "Поиск", type: "search" },
      { id: "sort", label: "Сортировка", type: "sort" },
    ],
  };
}

export function getListingFilterGrid(catKey, subcategory = "") {
  if (catKey === "transport") {
    return TRANSPORT_GRID;
  }

  if (catKey === "phones") {
    return PHONES_GRID;
  }

  if (catKey === "realestate") {
    return REAL_ESTATE_GRID;
  }

  if (catKey && CATS[catKey]) {
    return buildGenericGrid(catKey, subcategory);
  }

  return {
    rows: [
      [
        { id: "cat", label: "Категория", type: "category" },
        { id: "price", label: "Цена", type: "price" },
        { id: "region", label: "Регион", type: "region", options: REGIONS },
        { id: "location", label: "Город / Район", type: "location", options: LOCATIONS },
      ],
    ],
    more: [
      { id: "search", label: "Поиск", type: "search" },
      { id: "sort", label: "Сортировка", type: "sort" },
    ],
  };
}

export const PRICE_PRESETS = [
  { label: "Любая", from: "", to: "" },
  { label: "до 50 000 с.", from: "", to: "50000" },
  { label: "50 000 – 100 000 с.", from: "50000", to: "100000" },
  { label: "100 000 – 200 000 с.", from: "100000", to: "200000" },
  { label: "200 000 – 500 000 с.", from: "200000", to: "500000" },
  { label: "от 500 000 с.", from: "500000", to: "" },
];
