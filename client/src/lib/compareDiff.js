import { parsePriceNumber } from "./format";
import { getCompareItemKey, isExternalCompareItem } from "./compareResolve";

export function normalizeCompareValue(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/—|–|-/g, "");
}

export function getDifferingFieldKeys(items = [], fields = []) {
  const differing = new Set();

  if (items.length < 2) {
    fields.forEach((field) => differing.add(field.key));
    return differing;
  }

  for (const field of fields) {
    const values = items.map((item) => normalizeCompareValue(field.get(item)));
    const unique = new Set(values.filter((v) => v && v !== "—"));
    if (unique.size > 1) {
      differing.add(field.key);
      continue;
    }
    // Also treat mix of empty and filled as a difference
    const hasEmpty = values.some((v) => !v || v === "—");
    const hasFilled = values.some((v) => v && v !== "—");
    if (hasEmpty && hasFilled) differing.add(field.key);
  }

  return differing;
}

function countFilledSpecs(item, fields = []) {
  return fields.reduce((acc, field) => {
    const value = normalizeCompareValue(field.get(item));
    return acc + (value && value !== "—" ? 1 : 0);
  }, 0);
}

function getEffectivePrice(item) {
  const perSqm = parsePriceNumber(item?.realEstateSummary?.pricePerSqm);
  if (perSqm != null && perSqm > 0) return { price: perSqm, unit: "sqm" };

  const price = parsePriceNumber(item?.price);
  if (price != null && price > 0) return { price, unit: "total" };

  return { price: null, unit: "total" };
}

/**
 * Pick a recommended listing with a short reason.
 */
export function buildCompareVerdict(items = [], fields = [], t) {
  if (!t || items.length < 2) return null;

  const scored = items.map((item) => {
    const key = getCompareItemKey(item);
    const { price, unit } = getEffectivePrice(item);
    const filled = countFilledSpecs(item, fields);
    const external = isExternalCompareItem(item);

    return {
      key,
      item,
      price,
      unit,
      filled,
      external,
      title: item.title || "",
    };
  });

  const priced = scored.filter((row) => row.price != null);
  if (!priced.length) return null;

  const minPrice = Math.min(...priced.map((row) => row.price));
  const maxFilled = Math.max(...scored.map((row) => row.filled));

  const ranked = priced
    .map((row) => {
      let score = 0;
      // Lower price wins
      score += (1 - row.price / (minPrice || row.price)) * 100;
      // Prefer denser specs
      score += maxFilled ? (row.filled / maxFilled) * 20 : 0;
      // Prefer Oriyon when close on price (within 8%)
      if (!row.external && row.price <= minPrice * 1.08) score += 18;
      if (row.price === minPrice) score += 12;
      return { ...row, score };
    })
    .sort((a, b) => b.score - a.score);

  const winner = ranked[0];
  if (!winner) return null;

  const reasons = [];
  if (winner.price === minPrice) {
    reasons.push(t("compare.verdictReasonPrice"));
  } else if (!winner.external && winner.price <= minPrice * 1.08) {
    reasons.push(t("compare.verdictReasonOriyon"));
  }
  if (winner.filled === maxFilled && maxFilled > 0) {
    reasons.push(t("compare.verdictReasonSpecs"));
  }
  if (!reasons.length) {
    reasons.push(t("compare.verdictReasonBalance"));
  }

  return {
    key: winner.key,
    item: winner.item,
    title: winner.title,
    external: winner.external,
    reasons,
    label: t("compare.verdictBest"),
  };
}

export function getRowDiffHighlights(items = [], field) {
  if (!field || items.length < 2) return items.map(() => null);

  const values = items.map((item) => normalizeCompareValue(field.get(item)));
  const uniqueFilled = new Set(values.filter((v) => v && v !== "—"));
  if (uniqueFilled.size <= 1) {
    return items.map(() => null);
  }

  return values.map((value) => ({
    differs: Boolean(value && value !== "—"),
  }));
}
