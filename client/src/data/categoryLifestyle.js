/**
 * Lifestyle categories (food, kids, travel, clothing, construction):
 * Paydo-style landing tiles + legacy subcategory aliases for filters.
 */
import aliases from "@shared/lifestyleSubcategoryAliases.json";
import { CATS } from "./listingCategories";

export const LIFESTYLE_SUBCATEGORY_ALIASES = aliases;

/** Reverse map: new subcategory → [old strings that should still match]. */
const ALIASES_BY_TARGET = (() => {
  const map = Object.create(null);
  for (const [from, to] of Object.entries(LIFESTYLE_SUBCATEGORY_ALIASES)) {
    if (!map[to]) map[to] = [];
    if (from !== to) map[to].push(from);
  }
  return map;
})();

/** Extra group renames so old listings still match Paydo-style group tiles. */
const GROUP_ALIASES = {
  "Выпечка и десерты": ["Выпечка", "Выпечка и десерты"],
  Блюда: ["Готовая еда", "Блюда"],
  "Полуфабрикаты / заморозка": ["Полуфабрикаты", "Полуфабрикаты / заморозка"],
  Женщинам: ["Женская", "Женщинам"],
  Мужчинам: ["Мужская", "Мужчинам"],
  "Для мальчиков": ["Одежда и обувь — Для мальчиков", "Для мальчиков"],
  "Для девочек": ["Одежда и обувь — Для девочек", "Для девочек"],
  "Для новорождённых": ["Одежда и обувь — Для новорождённых", "Для новорождённых"],
  Транспорт: ["Коляски и автокресла — Велосипеды и самокаты", "Транспорт"],
};

export function expandSubcategoryFilterValues(subcategory = "") {
  const value = String(subcategory || "").trim();
  if (!value) return [];

  const set = new Set([value, ...(ALIASES_BY_TARGET[value] || [])]);

  const groupKeys = GROUP_ALIASES[value] || [value];
  for (const group of groupKeys) {
    set.add(group);
    const prefix = `${group} — `;
    for (const [from, to] of Object.entries(LIFESTYLE_SUBCATEGORY_ALIASES)) {
      if (from.startsWith(prefix)) {
        set.add(from);
        set.add(to);
      }
      if (String(to).startsWith(prefix)) set.add(to);
    }
  }

  return [...set];
}

export function normalizeLifestyleSubcategory(subcategory = "") {
  const value = String(subcategory || "").trim();
  return LIFESTYLE_SUBCATEGORY_ALIASES[value] || value;
}

const TILE_GLYPHS = {
  food: {
    "Выпечка и десерты": "Вд",
    Блюда: "Бл",
    Фастфуд: "Фф",
    "Полуфабрикаты / заморозка": "Пф",
    "Услуги повара": "Пв",
    "Особое питание": "Оп",
  },
  kids: {
    "Для мальчиков": "М",
    "Для девочек": "Д",
    "Для новорождённых": "Н",
    Игрушки: "Иг",
    "Коляски и автокресла": "Ко",
    Транспорт: "Тр",
    Мебель: "Ме",
    Услуги: "Ус",
  },
  travel: {
    "Туры по Таджикистану": "Тдж",
    "Туры за границу": "Зг",
    "Экскурсии и гиды": "Эк",
    "Базы отдыха": "Ба",
    "Транспорт и билеты": "Тб",
    Снаряжение: "Сн",
  },
  clothing: {
    "Для свадьбы": "Св",
    Женщинам: "Ж",
    Мужчинам: "М",
    Обувь: "Об",
    Аксессуары: "Ак",
    "Сумки и чемоданы": "Су",
    "Ювелирные украшения": "Юв",
    Ткани: "Тк",
    "Национальная одежда": "Нац",
  },
  construction: {
    Материалы: "Мт",
    "Окна и двери": "Од",
    Электрика: "Эл",
    Сантехника: "Сн",
    Инструменты: "Ин",
    "Аренда техники": "Ар",
    "Услуги мастеров": "Ум",
    Проектирование: "Пр",
  },
};

export function getLifestyleLandingTiles(slug) {
  const cat = CATS[slug];
  if (!cat?.subGroups?.length) return [];
  const glyphs = TILE_GLYPHS[slug] || {};
  return cat.subGroups.map(({ group }) => ({
    label: group,
    filterValue: group,
    glyph: glyphs[group] || group.slice(0, 1),
  }));
}

export const LIFESTYLE_QUICK_CHIPS = {
  food: [
    { label: "Самса", subcategory: "Выпечка и десерты — Самса" },
    { label: "Плов", subcategory: "Блюда — Плов и национальная кухня" },
    {
      label: "Манты",
      subcategory: "Полуфабрикаты / заморозка — Манты и пельмени",
    },
    { label: "Повар", subcategory: "Услуги повара — Домашний повар" },
    { label: "Фастфуд", subcategory: "Фастфуд" },
  ],
  kids: [
    { label: "Мальчикам", subcategory: "Для мальчиков" },
    { label: "Девочкам", subcategory: "Для девочек" },
    { label: "Игрушки", subcategory: "Игрушки" },
    { label: "Коляски", subcategory: "Коляски и автокресла — Коляски" },
    { label: "Няни", subcategory: "Услуги — Няни" },
  ],
  travel: [
    {
      label: "Фанские горы",
      subcategory: "Туры по Таджикистану — Фанские горы",
    },
    {
      label: "Памир",
      subcategory: "Туры по Таджикистану — Памир и Хорог",
    },
    { label: "Гиды", subcategory: "Экскурсии и гиды — Гиды" },
    {
      label: "Базы отдыха",
      subcategory: "Базы отдыха — Базы и дома отдыха",
    },
    {
      label: "Аренда авто",
      subcategory: "Транспорт и билеты — Аренда авто",
    },
  ],
  clothing: [
    { label: "Женское", subcategory: "Женщинам" },
    { label: "Мужское", subcategory: "Мужчинам" },
    { label: "Свадьба", subcategory: "Для свадьбы" },
    { label: "Курта", subcategory: "Национальная одежда — Курта" },
    { label: "Обувь", subcategory: "Обувь" },
  ],
  construction: [
    { label: "Цемент", subcategory: "Материалы — Цемент и сыпучие" },
    { label: "Окна ПВХ", subcategory: "Окна и двери — Окна ПВХ" },
    {
      label: "Аренда техники",
      subcategory: "Аренда техники — Экскаваторы и погрузчики",
    },
    {
      label: "Ремонт квартир",
      subcategory: "Услуги мастеров — Ремонт квартир",
    },
    { label: "Электрика", subcategory: "Электрика" },
  ],
};

export function getLifestyleQuickChips(slug) {
  return LIFESTYLE_QUICK_CHIPS[slug] || [];
}
