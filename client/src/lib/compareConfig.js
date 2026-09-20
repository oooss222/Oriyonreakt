import { CAT_LABELS } from "../data/listingCategories";
import { formatListingDate, formatPrice } from "./format";
import { enrichRealEstateListing, getSpecValue } from "./realEstate";

function spec(item, ...names) {
  for (const name of names) {
    const value = getSpecValue(item.specs, name);
    if (value) return value;
  }
  return "—";
}

function sellerName(item) {
  return item?.ownerName || item?.sellerName || item?.userName || "—";
}

function field(key, label, get, group = "specs", labelKey) {
  return {
    key,
    label,
    labelKey: labelKey || `compare.field.${key}`,
    group,
    get,
  };
}

function baseFields(extra = [], { includeCondition = true } = {}) {
  return [
    field("price", "Цена", (item) => formatPrice(item.price), "basics", "compare.price"),
    field(
      "location",
      "Город",
      (item) => item.location || "—",
      "basics",
      "compare.location"
    ),
    field(
      "date",
      "Дата",
      (item) => formatListingDate(item, { emptyLabel: "—" }),
      "basics",
      "compare.date"
    ),
    ...(includeCondition
      ? [
          field(
            "condition",
            "Состояние",
            (item) => spec(item, "Состояние"),
            "basics"
          ),
        ]
      : []),
    field("seller", "Продавец", sellerName, "basics"),
    ...extra.map((row) => ({ group: "specs", ...row })),
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
      field("price", "Цена", (item) => formatPrice(item.price), "basics", "compare.price"),
      field(
        "location",
        "Город",
        (item) => item.location || "—",
        "basics",
        "compare.location"
      ),
      field(
        "date",
        "Дата",
        (item) => formatListingDate(item, { emptyLabel: "—" }),
        "basics",
        "compare.date"
      ),
      field(
        "condition",
        "Состояние",
        (item) => spec(item, "Состояние", "Ремонт"),
        "basics"
      ),
      field("seller", "Продавец", sellerName, "basics"),
      field(
        "propertyType",
        "Тип недвижимости",
        (item) => item.subcategory || item.realEstateSummary?.deal || "—"
      ),
      field(
        "pricePerSqm",
        "Цена за м²",
        (item) => item.realEstateSummary?.pricePerSqm || "—"
      ),
      field("rooms", "Комнат", (item) => item.realEstateSummary?.rooms || "—"),
      field("area", "Площадь", (item) => item.realEstateSummary?.area || "—"),
      field("floor", "Этаж", (item) => {
        const s = item.realEstateSummary || {};
        if (!s.floor) return "—";
        return s.floorsTotal ? `${s.floor}/${s.floorsTotal}` : s.floor;
      }),
      field("floorsTotal", "Этажность", (item) => item.realEstateSummary?.floorsTotal || spec(item, "Этажей в доме")),
      field(
        "district",
        "Район",
        (item) => item.realEstateSummary?.district || spec(item, "Район")
      ),
      field("repair", "Ремонт", (item) => spec(item, "Ремонт")),
      field("heating", "Отопление", (item) => spec(item, "Отопление")),
      field("furniture", "Мебель", (item) => spec(item, "Мебель")),
      field("development", "ЖК", (item) => spec(item, "ЖК")),
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
      { name: "Кузов", label: "Кузов" },
      { name: "Объем", label: "Объём" },
      { name: "КПП", label: "КПП" },
      { name: "Привод", label: "Привод" },
      { name: "Топливо", label: "Топливо" },
      { name: "Цвет", label: "Цвет" },
      { name: "Состояние", label: "Состояние" },
    ],
    fields: baseFields([
      field("brand", "Марка", (item) => spec(item, "Марка", "Марка авто")),
      field("model", "Модель", (item) => spec(item, "Модель")),
      field("year", "Год", (item) => spec(item, "Год")),
      field("mileage", "Пробег", (item) => spec(item, "Пробег")),
      field("body", "Кузов", (item) => spec(item, "Кузов", "Тип кузова")),
      field("engineVolume", "Объём", (item) => spec(item, "Объем", "Объём")),
      field("kpp", "КПП", (item) => spec(item, "КПП")),
      field("drive", "Привод", (item) => spec(item, "Привод")),
      field("fuel", "Топливо", (item) => spec(item, "Топливо")),
      field("color", "Цвет", (item) => spec(item, "Цвет")),
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
      { name: "Оперативная память", label: "ОЗУ" },
      { name: "Состояние", label: "Состояние" },
      { name: "Гарантия", label: "Гарантия" },
    ],
    fields: baseFields([
      field(
        "brand",
        "Производитель",
        (item) => spec(item, "Производитель"),
        "specs",
        "compare.field.manufacturer"
      ),
      field("model", "Модель", (item) => spec(item, "Модель")),
      field("memory", "Память", (item) => spec(item, "Память")),
      field("ram", "ОЗУ", (item) => spec(item, "Оперативная память", "ОЗУ")),
      field("color", "Цвет", (item) => spec(item, "Цвет")),
      field("warranty", "Гарантия", (item) => spec(item, "Гарантия")),
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
      field("type", "Тип", (item) => spec(item, "Тип")),
      field("brand", "Бренд", (item) => spec(item, "Бренд"), "specs", "compare.field.maker"),
      field("model", "Модель", (item) => spec(item, "Модель")),
      field("warranty", "Гарантия", (item) => spec(item, "Гарантия")),
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
      field("type", "Тип", (item) => spec(item, "Тип")),
      field("brand", "Бренд", (item) => spec(item, "Бренд"), "specs", "compare.field.maker"),
      field("model", "Модель", (item) => spec(item, "Модель")),
      field("cpu", "Процессор", (item) => spec(item, "Процессор")),
      field("ram", "ОЗУ", (item) => spec(item, "ОЗУ", "Оперативная память")),
      field("storage", "Накопитель", (item) => spec(item, "Накопитель")),
      field("gpu", "Видеокарта", (item) => spec(item, "Видеокарта")),
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
      field("type", "Тип", (item) => spec(item, "Тип")),
      field("material", "Материал", (item) => spec(item, "Материал")),
      field("color", "Цвет", (item) => spec(item, "Цвет")),
      field("size", "Размеры", (item) => spec(item, "Размеры")),
    ]),
  },
};

export function getCompareConfig(cat) {
  return COMPARE_CONFIG[String(cat || "").trim()] || null;
}

export function getComparePath(cat) {
  return getCompareConfig(cat)?.path || "/realestate/sravnenie";
}

export function localizeCompareFields(fields = [], t) {
  return fields.map((row) => {
    const translated = row.labelKey && t ? t(row.labelKey) : "";
    return {
      ...row,
      label:
        translated && translated !== row.labelKey ? translated : row.label,
    };
  });
}

export function groupCompareFields(fields = []) {
  return {
    basics: fields.filter((row) => row.group === "basics"),
    specs: fields.filter((row) => row.group !== "basics"),
  };
}
