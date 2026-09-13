const aliases = require("../../../shared/lifestyleSubcategoryAliases.json");

const ALIASES_BY_TARGET = (() => {
  const map = Object.create(null);
  for (const [from, to] of Object.entries(aliases)) {
    if (!map[to]) map[to] = [];
    if (from !== to) map[to].push(from);
  }
  return map;
})();

const GROUP_ALIASES = {
  "Выпечка и десерты": ["Выпечка", "Выпечка и десерты"],
  Блюда: ["Готовая еда", "Блюда"],
  "Полуфабрикаты / заморозка": ["Полуфабрикаты", "Полуфабрикаты / заморозка"],
  Женщинам: ["Женская", "Женщинам"],
  Мужчинам: ["Мужская", "Мужчинам"],
  "Для мальчиков": [
    "Одежда и обувь — Для мальчиков",
    "Для мальчиков",
    "Детская одежда — Для мальчиков",
  ],
  "Для девочек": [
    "Одежда и обувь — Для девочек",
    "Для девочек",
    "Детская одежда — Для девочек",
  ],
  "Для новорождённых": [
    "Одежда и обувь — Для новорождённых",
    "Для новорождённых",
    "Для малышей",
    "Детская одежда — Для новорождённых",
  ],
  "Коляски и автокресла": [
    "Коляски и автокресла",
    "Детские коляски и транспорт",
  ],
  Транспорт: [
    "Коляски и автокресла — Велосипеды и самокаты",
    "Транспорт",
  ],
  Мебель: ["Мебель", "Детская мебель"],
};

function expandSubcategoryFilterValues(subcategory = "") {
  const value = String(subcategory || "").trim();
  if (!value) return [];

  const set = new Set([value, ...(ALIASES_BY_TARGET[value] || [])]);

  for (const [modern, legacy] of [
    ["Женщинам", "Женская"],
    ["Мужчинам", "Мужская"],
    ["Выпечка и десерты", "Выпечка"],
    ["Блюда", "Готовая еда"],
    ["Полуфабрикаты / заморозка", "Полуфабрикаты"],
  ]) {
    if (value === modern || value.startsWith(`${modern} — `)) {
      set.add(value.replace(modern, legacy));
    }
    if (value === legacy || value.startsWith(`${legacy} — `)) {
      set.add(value.replace(legacy, modern));
    }
  }

  const groupKeys = GROUP_ALIASES[value] || [value];
  for (const group of groupKeys) {
    set.add(group);
    const prefix = `${group} — `;
    for (const [from, to] of Object.entries(aliases)) {
      if (from.startsWith(prefix)) {
        set.add(from);
        set.add(to);
      }
      if (String(to).startsWith(prefix)) set.add(to);
    }
  }

  return [...set];
}

module.exports = {
  expandSubcategoryFilterValues,
};
