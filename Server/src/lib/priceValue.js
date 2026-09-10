/**
 * Prices are stored as free-form text ("160 000", "1 200 сом"), so filtering
 * and sorting used to cast them in SQL on every row, which no index can serve.
 *
 * This mirrors the previous SQL expression
 *   NULLIF(replace(regexp_replace(price,'[^0-9,.-]','','g'), ',', '.'), '')::numeric
 * but returns null instead of raising on malformed input, so a single bad value
 * can never fail an insert.
 */
function parsePriceValue(raw) {
  const cleaned = String(raw ?? "")
    .replace(/[^0-9,.-]/g, "")
    .replace(/,/g, ".");

  if (!cleaned) return null;

  const value = Number(cleaned);

  return Number.isFinite(value) ? value : null;
}

module.exports = { parsePriceValue };
