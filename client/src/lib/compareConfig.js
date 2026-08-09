import { CAT_LABELS } from "../data/listingCategories";
import { formatPrice } from "./format";
import { enrichRealEstateListing, getSpecValue } from "./realEstate";

function spec(item, ...names) {
  for (const name of names) {
    const value = getSpecValue(item.specs, name);
    if (value) return value;
  }
  return "—";
}

function baseFields(extra = []) {
  return [
    { key: "price", label: "Цена", get: (item) => formatPrice(item.price) },
    { key: "location", label: "Город", get: (item) => item.location || "—" },
    ...extra,
  ];
}

export const COMPARE_CONFIG = {
  realestate: {
    label: CAT_LABELS.realestate,
    path: "/realestate/sravnenie",
    catalogPath: "/realestate/dushanbe/kvartiry",
    enrich: enrichRealEstateListing,
    manualSpecFields: [
      { name: "Комнат", label: "Комнат" },
      { name: "Площадь общая", label: "Площадь" },
      { name: "Этаж", label: "Этаж" },
      { name: "Этажей в доме", label: "Этажей в доме" },
      { name: "Район", label: "Район" },
      { name: "Ремонт", label: "Ремонт" },
      { name: "ЖК", label: "ЖК" },
    ],
    fields: [
      { key: "price", label: "Цена", get: (item) => formatPrice(item.price) },
      {
        key: "pricePerSqm",
        label: "Цена за м²",
        get: (item) => item.realEstateSummary?.pricePerSqm || "—",
      },
      {
        key: "rooms",
        label: "Комнат",
        get: (item) => item.realEstateSummary?.rooms || "—",
      },
      {
        key: "area",
        label: "Площадь",
        get: (item) => item.realEstateSummary?.area || "—",
      },
      {
        key: "floor",
        label: "Этаж",
        get: (item) => {
          const s = item.realEstateSummary || {};
          if (!s.floor) return "—";
          return s.floorsTotal ? `${s.floor}/${s.floorsTotal}` : s.floor;
        },
      },
      {
        key: "district",
        label: "Район",
        get: (item) => item.realEstateSummary?.district || "—",
      },
      {
        key: "repair",
        label: "Ремонт",
        get: (item) => getSpecValue(item.specs, "Ремонт") || "—",
      },
      {
        key: "development",
        label: "ЖК",
        get: (item) => getSpecValue(item.specs, "ЖК") || "—",
      },
    ],
  },
  transport: {
    label: CAT_LABELS.transport,
    path: "/c/transport/sravnenie",
    catalogPath: "/c/transport",
    manualSpecFields: [
      { name: "Марка", label: "Марка" },
      { name: "Модель", label: "Модель" },
      { name: "Год", label: "Год" },
      { name: "Пробег", label: "Пробег" },
      { name: "КПП", label: "КПП" },
      { name: "Топливо", label: "Топливо" },
      { name: "Состояние", label: "Состояние" },
    ],
    fields: baseFields([
      { key: "brand", label: "Марка", get: (item) => spec(item, "Марка", "Марка авто") },
      { key: "model", label: "Модель", get: (item) => spec(item, "Модель") },
      { key: "year", label: "Год", get: (item) => spec(item, "Год") },
      { key: "mileage", label: "Пробег", get: (item) => spec(item, "Пробег") },
      { key: "kpp", label: "КПП", get: (item) => spec(item, "КПП") },
      { key: "fuel", label: "Топливо", get: (item) => spec(item, "Топливо") },
      { key: "condition", label: "Состояние", get: (item) => spec(item, "Состояние") },
    ]),
  },
  phones: {
    label: CAT_LABELS.phones,
    path: "/c/phones/sravnenie",
    catalogPath: "/c/phones",
    manualSpecFields: [
      { name: "Производитель", label: "Производитель" },
      { name: "Модель", label: "Модель" },
      { name: "Память", label: "Память" },
      { name: "Состояние", label: "Состояние" },
      { name: "Гарантия", label: "Гарантия" },
    ],
    fields: baseFields([
      { key: "brand", label: "Производитель", get: (item) => spec(item, "Производитель") },
      { key: "model", label: "Модель", get: (item) => spec(item, "Модель") },
      { key: "memory", label: "Память", get: (item) => spec(item, "Память") },
      { key: "condition", label: "Состояние", get: (item) => spec(item, "Состояние") },
      { key: "warranty", label: "Гарантия", get: (item) => spec(item, "Гарантия") },
    ]),
  },
  electronics: {
    label: CAT_LABELS.electronics,
    path: "/c/electronics/sravnenie",
    catalogPath: "/c/electronics",
    manualSpecFields: [
      { name: "Тип", label: "Тип" },
      { name: "Бренд", label: "Бренд" },
      { name: "Модель", label: "Модель" },
      { name: "Состояние", label: "Состояние" },
      { name: "Гарантия", label: "Гарантия" },
    ],
    fields: baseFields([
      { key: "type", label: "Тип", get: (item) => spec(item, "Тип") },
      { key: "brand", label: "Бренд", get: (item) => spec(item, "Бренд") },
      { key: "model", label: "Модель", get: (item) => spec(item, "Модель") },
      { key: "condition", label: "Состояние", get: (item) => spec(item, "Состояние") },
      { key: "warranty", label: "Гарантия", get: (item) => spec(item, "Гарантия") },
    ]),
  },
  computers: {
    label: CAT_LABELS.computers,
    path: "/c/computers/sravnenie",
    catalogPath: "/c/computers",
    manualSpecFields: [
      { name: "Тип", label: "Тип" },
      { name: "Бренд", label: "Бренд" },
      { name: "Модель", label: "Модель" },
      { name: "Процессор", label: "Процессор" },
      { name: "ОЗУ", label: "ОЗУ" },
      { name: "Накопитель", label: "Накопитель" },
      { name: "Видеокарта", label: "Видеокарта" },
      { name: "Состояние", label: "Состояние" },
    ],
    fields: baseFields([
      { key: "type", label: "Тип", get: (item) => spec(item, "Тип") },
      { key: "brand", label: "Бренд", get: (item) => spec(item, "Бренд") },
      { key: "model", label: "Модель", get: (item) => spec(item, "Модель") },
      { key: "cpu", label: "Процессор", get: (item) => spec(item, "Процессор") },
      { key: "ram", label: "ОЗУ", get: (item) => spec(item, "ОЗУ") },
      { key: "storage", label: "Накопитель", get: (item) => spec(item, "Накопитель") },
      { key: "gpu", label: "Видеокарта", get: (item) => spec(item, "Видеокарта") },
      { key: "condition", label: "Состояние", get: (item) => spec(item, "Состояние") },
    ]),
  },
  furniture: {
    label: CAT_LABELS.furniture,
    path: "/c/furniture/sravnenie",
    catalogPath: "/c/furniture",
    manualSpecFields: [
      { name: "Тип", label: "Тип" },
      { name: "Материал", label: "Материал" },
      { name: "Состояние", label: "Состояние" },
      { name: "Цвет", label: "Цвет" },
      { name: "Размеры", label: "Размеры" },
    ],
    fields: baseFields([
      { key: "type", label: "Тип", get: (item) => spec(item, "Тип") },
      { key: "material", label: "Материал", get: (item) => spec(item, "Материал") },
      { key: "condition", label: "Состояние", get: (item) => spec(item, "Состояние") },
      { key: "color", label: "Цвет", get: (item) => spec(item, "Цвет") },
      { key: "size", label: "Размеры", get: (item) => spec(item, "Размеры") },
    ]),
  },
};

export function getCompareConfig(cat) {
  return COMPARE_CONFIG[String(cat || "").trim()] || null;
}

export function getComparePath(cat) {
  return getCompareConfig(cat)?.path || "/realestate/sravnenie";
}
