import {
  CAR_BRANDS,
  CAR_MODELS,
  COMMON_SPEC_OPTIONS,
  LOCATIONS,
  PHONE_BRANDS,
  REGIONS,
} from "./specOptions";
import { CATS, getListSpecFilters } from "./listingCategories";
import { getRealEstateFilterGrid } from "./realEstateFilters";
import {
  CLOTHING_PRICE_PRESETS,
  CLOTHING_SEASONS,
  CLOTHING_SIZES,
  resolveClothingSpecTemplate,
} from "./clothingFilters";
import {
  FOOD_FORMATS,
  FOOD_PRICE_PRESETS,
  FOOD_READY_STATES,
  resolveFoodSpecTemplate,
} from "./foodFilters";
import {
  KIDS_AGES,
  KIDS_PRICE_PRESETS,
  resolveKidsSpecTemplate,
} from "./kidsFilters";
import {
  TRAVEL_DURATIONS,
  TRAVEL_PRICE_PRESETS,
  resolveTravelSpecTemplate,
} from "./travelFilters";
import {
  CONSTRUCTION_PRICE_PRESETS,
  resolveConstructionSpecTemplate,
} from "./constructionFilters";
import {
  BUSINESS_PRICE_PRESETS,
  resolveBusinessSpecTemplate,
} from "./businessFilters";

const TRANSPORT_GRID = {
  rows: [
    [
      { id: "subcategory", label: "Легковые авто", type: "subcategory" },
      { id: "Марка", label: "Марка", type: "spec", specKey: "Марка", options: CAR_BRANDS },
      {
        id: "Модель",
        label: "Модель",
        type: "spec-dependent",
        specKey: "Модель",
        dependsOn: "Марка",
        optionsFrom: CAR_MODELS,
      },
      { id: "price", label: "Цена", type: "price" },
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
        id: "Цвет",
        label: "Цвет",
        type: "spec",
        specKey: "Цвет",
        options: COMMON_SPEC_OPTIONS.color,
      },
      {
        id: "year-range",
        label: "Год",
        type: "year-range",
        rangeFromKey: "yearFrom",
        rangeToKey: "yearTo",
        options: COMMON_SPEC_OPTIONS.years,
      },
      {
        id: "mileage-range",
        label: "Пробег, км",
        type: "mileage-range",
        rangeFromKey: "mileageFrom",
        rangeToKey: "mileageTo",
        presets: [
          { label: "до 50 000", from: "", to: "50000" },
          { label: "50–100 тыс.", from: "50000", to: "100000" },
          { label: "100–150 тыс.", from: "100000", to: "150000" },
          { label: "150–200 тыс.", from: "150000", to: "200000" },
          { label: "от 200 000", from: "200000", to: "" },
        ],
      },
    ],
    [
      { id: "sort", label: "Сортировка", type: "sort" },
      {
        id: "Топливо",
        label: "Тип двигателя",
        type: "spec",
        specKey: "Топливо",
        options: COMMON_SPEC_OPTIONS.fuel,
      },
      {
        id: "КПП",
        label: "Коробка передач",
        type: "spec",
        specKey: "КПП",
        options: COMMON_SPEC_OPTIONS.kpp,
      },
      { id: "region", label: "Область", type: "region", options: REGIONS },
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
      {
        id: "Объем",
        label: "Объем, л",
        type: "spec",
        specKey: "Объем",
        options: COMMON_SPEC_OPTIONS.engineVolume,
      },
      { id: "location", label: "Город", type: "location", options: LOCATIONS },
    ],
  ],
  more: [{ id: "search", label: "Поиск", type: "search" }],
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
      { id: "region", label: "Область", type: "region", options: REGIONS },
      { id: "location", label: "Город", type: "location", options: LOCATIONS },
    ],
  ],
  more: [
    { id: "search", label: "Поиск", type: "search" },
    { id: "sort", label: "Сортировка", type: "sort" },
  ],
};

function buildTravelGrid(subcategory = "") {
  const specs = resolveTravelSpecTemplate(subcategory);
  const directionSpec = specs.find((item) => item.name === "Направление");
  const durationSpec = specs.find((item) => item.name === "Длительность");
  const formatSpec = specs.find(
    (item) =>
      item.name === "Формат" ||
      item.name === "Тип размещения" ||
      item.name === "Тип услуги" ||
      item.name === "Тип"
  );
  const extraSpec = specs.find(
    (item) =>
      item.name === "Питание" || item.name === "Состояние"
  );

  return {
    rows: [
      [
        { id: "subcategory", label: "Раздел", type: "subcategory" },
        {
          id: "price",
          label: "Цена",
          type: "price",
          presets: TRAVEL_PRICE_PRESETS,
        },
        { id: "region", label: "Область", type: "region", options: REGIONS },
        { id: "location", label: "Город", type: "location", options: LOCATIONS },
      ],
      [
        directionSpec
          ? {
              id: "Направление",
              label: "Направление",
              type: "spec",
              specKey: "Направление",
              options: directionSpec.options,
            }
          : formatSpec
            ? {
                id: formatSpec.name,
                label: formatSpec.name,
                type: "spec",
                specKey: formatSpec.name,
                options: formatSpec.options,
              }
            : null,
        durationSpec
          ? {
              id: "Длительность",
              label: "Длительность",
              type: "spec",
              specKey: "Длительность",
              options: durationSpec.options || TRAVEL_DURATIONS,
            }
          : extraSpec
            ? {
                id: extraSpec.name,
                label: extraSpec.name,
                type: "spec",
                specKey: extraSpec.name,
                options: extraSpec.options,
              }
            : null,
        formatSpec && directionSpec
          ? {
              id: formatSpec.name,
              label: formatSpec.name,
              type: "spec",
              specKey: formatSpec.name,
              options: formatSpec.options,
            }
          : extraSpec && durationSpec
            ? {
                id: extraSpec.name,
                label: extraSpec.name,
                type: "spec",
                specKey: extraSpec.name,
                options: extraSpec.options,
              }
            : null,
        { id: "sort", label: "Сортировка", type: "sort" },
      ],
    ],
    more: [{ id: "search", label: "Поиск", type: "search" }],
  };
}

function buildBusinessGrid(subcategory = "") {
  const specs = resolveBusinessSpecTemplate(subcategory);
  const dealSpec = specs.find((item) => item.name === "Тип сделки");
  const conditionSpec = specs.find((item) => item.name === "Состояние");
  const formatSpec = specs.find((item) => item.name === "Формат");
  const unitSpec = specs.find((item) => item.name === "Единица");

  const secondary = formatSpec || unitSpec || conditionSpec || null;

  return {
    rows: [
      [
        { id: "subcategory", label: "Раздел", type: "subcategory" },
        {
          id: "price",
          label: "Цена",
          type: "price",
          presets: BUSINESS_PRICE_PRESETS,
        },
        { id: "region", label: "Область", type: "region", options: REGIONS },
        { id: "location", label: "Город", type: "location", options: LOCATIONS },
      ],
      [
        dealSpec
          ? {
              id: "Тип сделки",
              label: "Тип сделки",
              type: "spec",
              specKey: "Тип сделки",
              options: dealSpec.options,
            }
          : null,
        secondary
          ? {
              id: secondary.name,
              label: secondary.name,
              type: "spec",
              specKey: secondary.name,
              options: secondary.options,
            }
          : null,
        conditionSpec && secondary !== conditionSpec
          ? {
              id: "Состояние",
              label: "Состояние",
              type: "spec",
              specKey: "Состояние",
              options: conditionSpec.options || COMMON_SPEC_OPTIONS.condition,
            }
          : null,
        { id: "sort", label: "Сортировка", type: "sort" },
      ],
    ],
    more: [{ id: "search", label: "Поиск", type: "search" }],
  };
}

function buildConstructionGrid(subcategory = "") {
  const specs = resolveConstructionSpecTemplate(subcategory);
  const dealSpec = specs.find((item) => item.name === "Тип сделки");
  const conditionSpec = specs.find((item) => item.name === "Состояние");
  const formatSpec = specs.find((item) => item.name === "Формат");
  const unitSpec = specs.find((item) => item.name === "Единица");

  const secondary = formatSpec || unitSpec || conditionSpec || null;

  return {
    rows: [
      [
        { id: "subcategory", label: "Раздел", type: "subcategory" },
        {
          id: "price",
          label: "Цена",
          type: "price",
          presets: CONSTRUCTION_PRICE_PRESETS,
        },
        { id: "region", label: "Область", type: "region", options: REGIONS },
        { id: "location", label: "Город", type: "location", options: LOCATIONS },
      ],
      [
        dealSpec
          ? {
              id: "Тип сделки",
              label: "Тип сделки",
              type: "spec",
              specKey: "Тип сделки",
              options: dealSpec.options,
            }
          : null,
        secondary
          ? {
              id: secondary.name,
              label: secondary.name,
              type: "spec",
              specKey: secondary.name,
              options: secondary.options,
            }
          : null,
        conditionSpec && secondary !== conditionSpec
          ? {
              id: "Состояние",
              label: "Состояние",
              type: "spec",
              specKey: "Состояние",
              options: conditionSpec.options || COMMON_SPEC_OPTIONS.condition,
            }
          : null,
        { id: "sort", label: "Сортировка", type: "sort" },
      ],
    ],
    more: [{ id: "search", label: "Поиск", type: "search" }],
  };
}

function buildKidsGrid(subcategory = "") {
  const specs = resolveKidsSpecTemplate(subcategory);
  const ageSpec = specs.find((item) => item.name === "Возраст");
  const sizeSpec = specs.find((item) => item.name === "Размер");
  const conditionSpec = specs.find((item) => item.name === "Состояние");
  const typeSpec = specs.find(
    (item) => item.name === "Тип" || item.name === "Формат"
  );

  return {
    rows: [
      [
        { id: "subcategory", label: "Раздел", type: "subcategory" },
        {
          id: "price",
          label: "Цена",
          type: "price",
          presets: KIDS_PRICE_PRESETS,
        },
        { id: "region", label: "Область", type: "region", options: REGIONS },
        { id: "location", label: "Город", type: "location", options: LOCATIONS },
      ],
      [
        ageSpec
          ? {
              id: "Возраст",
              label: "Возраст",
              type: "spec",
              specKey: "Возраст",
              options: ageSpec.options || KIDS_AGES,
            }
          : typeSpec
            ? {
                id: typeSpec.name,
                label: typeSpec.name,
                type: "spec",
                specKey: typeSpec.name,
                options: typeSpec.options,
              }
            : null,
        sizeSpec
          ? {
              id: "Размер",
              label: "Размер",
              type: "spec",
              specKey: "Размер",
              options: sizeSpec.options,
            }
          : typeSpec && ageSpec
            ? {
                id: typeSpec.name,
                label: typeSpec.name,
                type: "spec",
                specKey: typeSpec.name,
                options: typeSpec.options,
              }
            : null,
        conditionSpec
          ? {
              id: "Состояние",
              label: "Состояние",
              type: "spec",
              specKey: "Состояние",
              options:
                conditionSpec.options ||
                COMMON_SPEC_OPTIONS.clothingCondition,
            }
          : null,
        { id: "sort", label: "Сортировка", type: "sort" },
      ],
    ],
    more: [{ id: "search", label: "Поиск", type: "search" }],
  };
}

function buildFoodGrid(subcategory = "") {
  const specs = resolveFoodSpecTemplate(subcategory);
  const formatSpec = specs.find((item) => item.name === "Формат");
  const readySpec = specs.find((item) => item.name === "Готовность");
  const visitSpec = specs.find((item) => item.name === "Выезд");
  const dietSpec = specs.find((item) => item.name === "Тип питания");

  const secondary =
    readySpec ||
    visitSpec ||
    dietSpec ||
    null;

  return {
    rows: [
      [
        { id: "subcategory", label: "Раздел", type: "subcategory" },
        {
          id: "price",
          label: "Цена",
          type: "price",
          presets: FOOD_PRICE_PRESETS,
        },
        { id: "region", label: "Область", type: "region", options: REGIONS },
        { id: "location", label: "Город", type: "location", options: LOCATIONS },
      ],
      [
        formatSpec
          ? {
              id: "Формат",
              label: "Формат",
              type: "spec",
              specKey: "Формат",
              options: formatSpec.options || FOOD_FORMATS,
            }
          : null,
        secondary
          ? {
              id: secondary.name,
              label: secondary.name,
              type: "spec",
              specKey: secondary.name,
              options: secondary.options || FOOD_READY_STATES,
            }
          : null,
        { id: "sort", label: "Сортировка", type: "sort" },
        { id: "search", label: "Поиск", type: "search" },
      ],
    ],
    more: [],
  };
}

function buildClothingGrid(subcategory = "") {
  const specs = resolveClothingSpecTemplate(subcategory);
  const sizeSpec = specs.find((item) => item.name === "Размер");
  const conditionSpec = specs.find((item) => item.name === "Состояние");
  const seasonSpec = specs.find((item) => item.name === "Сезон");
  const colorSpec = specs.find((item) => item.name === "Цвет");
  const materialSpec = specs.find(
    (item) => item.name === "Материал" || item.name === "Тип ткани"
  );

  const row2 = [
    sizeSpec
      ? {
          id: "Размер",
          label: "Размер",
          type: "spec",
          specKey: "Размер",
          options: sizeSpec.options || CLOTHING_SIZES,
        }
      : materialSpec
        ? {
            id: materialSpec.name,
            label: materialSpec.name,
            type: "spec",
            specKey: materialSpec.name,
            options: materialSpec.options,
          }
        : null,
    conditionSpec
      ? {
          id: "Состояние",
          label: "Состояние",
          type: "spec",
          specKey: "Состояние",
          options:
            conditionSpec.options || COMMON_SPEC_OPTIONS.clothingCondition,
        }
      : null,
    seasonSpec
      ? {
          id: "Сезон",
          label: "Сезон",
          type: "spec",
          specKey: "Сезон",
          options: seasonSpec.options || CLOTHING_SEASONS,
        }
      : colorSpec
        ? {
            id: "Цвет",
            label: "Цвет",
            type: "spec",
            specKey: "Цвет",
            options: colorSpec.options,
          }
        : null,
    { id: "location", label: "Город", type: "location", options: LOCATIONS },
  ];

  while (row2.length < 4) row2.push(null);

  return {
    rows: [
      [
        { id: "subcategory", label: "Раздел", type: "subcategory" },
        {
          id: "price",
          label: "Цена",
          type: "price",
          presets: CLOTHING_PRICE_PRESETS,
        },
        { id: "region", label: "Область", type: "region", options: REGIONS },
        colorSpec && seasonSpec
          ? {
              id: "Цвет",
              label: "Цвет",
              type: "spec",
              specKey: "Цвет",
              options: colorSpec.options,
            }
          : { id: "sort", label: "Сортировка", type: "sort" },
      ],
      row2,
    ],
    more: [
      { id: "search", label: "Поиск", type: "search" },
      ...(colorSpec && seasonSpec
        ? [{ id: "sort", label: "Сортировка", type: "sort" }]
        : []),
    ],
  };
}


function buildGenericGrid(catKey, subcategory = "") {
  const specFilters = getListSpecFilters(catKey, subcategory).slice(0, 4);

  const row1 = [
    { id: "subcategory", label: "Подкатегория", type: "subcategory" },
    { id: "price", label: "Цена", type: "price" },
    { id: "region", label: "Область", type: "region", options: REGIONS },
    { id: "location", label: "Город", type: "location", options: LOCATIONS },
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
    if (!subcategory || subcategory === "Легковые авто") {
      return TRANSPORT_GRID;
    }
    return buildGenericGrid(catKey, subcategory);
  }

  if (catKey === "phones") {
    return PHONES_GRID;
  }

  if (catKey === "clothing") {
    return buildClothingGrid(subcategory);
  }

  if (catKey === "food") {
    return buildFoodGrid(subcategory);
  }

  if (catKey === "kids") {
    return buildKidsGrid(subcategory);
  }

  if (catKey === "travel") {
    return buildTravelGrid(subcategory);
  }

  if (catKey === "construction") {
    return buildConstructionGrid(subcategory);
  }

  if (catKey === "business") {
    return buildBusinessGrid(subcategory);
  }

  if (catKey === "realestate") {
    return getRealEstateFilterGrid(subcategory);
  }

  if (catKey && CATS[catKey]) {
    return buildGenericGrid(catKey, subcategory);
  }

  return {
    rows: [
      [
        { id: "cat", label: "Категория", type: "category" },
        { id: "price", label: "Цена", type: "price" },
        { id: "region", label: "Область", type: "region", options: REGIONS },
        { id: "location", label: "Город", type: "location", options: LOCATIONS },
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
