export function parseMultiSpecValue(value = "") {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinMultiSpecValue(values = []) {
  return [...new Set(values.map((item) => String(item).trim()).filter(Boolean))].join(",");
}

export function toggleMultiSpecValue(current = "", option = "") {
  const list = parseMultiSpecValue(current);
  if (!option) return "";
  if (list.includes(option)) {
    return joinMultiSpecValue(list.filter((item) => item !== option));
  }
  return joinMultiSpecValue([...list, option]);
}
