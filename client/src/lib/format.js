export function parsePriceNumber(value) {
  if (value == null || value === "") return null;

  const n = Number(String(value).replace(/\s/g, "").replace(",", "."));

  return Number.isFinite(n) ? n : null;
}

export function formatPrice(
  value,
  { emptyLabel = "Цена не указана", currency = "TJS" } = {}
) {
  const n = parsePriceNumber(value);

  if (n == null) {
    if (value == null || value === "") {
      return emptyLabel;
    }

    return String(value);
  }

  return `${n.toLocaleString("ru-RU")} ${currency}`;
}
