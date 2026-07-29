const STORAGE_KEY = "oriyon_re_compare";
const MAX_ITEMS = 3;

export function readCompareIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter(Boolean).slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

export function writeCompareIds(ids = []) {
  const next = [...new Set(ids.filter(Boolean))].slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("oriyon:compare-change", { detail: next }));
  return next;
}

export function toggleCompareId(id) {
  if (!id) return readCompareIds();

  const current = readCompareIds();
  if (current.includes(id)) {
    return writeCompareIds(current.filter((item) => item !== id));
  }

  if (current.length >= MAX_ITEMS) {
    return writeCompareIds([...current.slice(1), id]);
  }

  return writeCompareIds([...current, id]);
}

export function isInCompare(id) {
  return readCompareIds().includes(id);
}

export function clearCompare() {
  return writeCompareIds([]);
}

export const COMPARE_MAX = MAX_ITEMS;
