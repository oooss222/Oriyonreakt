const aliases = require("../../../shared/lifestyleSubcategoryAliases.json");

const ALIASES_BY_TARGET = (() => {
  const map = Object.create(null);
  for (const [from, to] of Object.entries(aliases)) {
    if (!map[to]) map[to] = [];
    if (from !== to) map[to].push(from);
  }
  return map;
})();

function expandSubcategoryFilterValues(subcategory = "") {
  const value = String(subcategory || "").trim();
  if (!value) return [];
  const extras = ALIASES_BY_TARGET[value] || [];
  return [value, ...extras];
}

module.exports = {
  expandSubcategoryFilterValues,
};
