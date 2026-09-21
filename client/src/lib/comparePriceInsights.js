import { parsePriceNumber } from "./format";
import { getCompareItemKey, isExternalCompareItem } from "./compareResolve";
import { getPlatformLabel } from "./comparePlatforms";

function formatDiff(amount, t) {
  const value = Math.round(Number(amount) || 0);
  if (!value) return "";
  return `${value.toLocaleString("ru-RU")} ${t("price.currency")}`;
}

export function getCompareItemPrice(item) {
  return parsePriceNumber(item?.price);
}

export function buildComparePriceInsights(items = [], t) {
  if (!t) return null;

  const priced = items
    .map((item) => ({
      key: getCompareItemKey(item),
      price: getCompareItemPrice(item),
      isExternal: isExternalCompareItem(item),
      source: item._compareSource || "diyor",
      sourceLabel: isExternalCompareItem(item)
        ? getPlatformLabel(item._compareSource)
        : "Diyor.tj",
      title: item.title || "",
    }))
    .filter((row) => row.price != null && row.price > 0);

  if (priced.length < 2) {
    return null;
  }

  const minPrice = Math.min(...priced.map((row) => row.price));
  const maxPrice = Math.max(...priced.map((row) => row.price));

  const insights = priced.map((row) => ({
    ...row,
    diffFromCheapest: row.price - minPrice,
    isCheapest: row.price === minPrice,
  }));

  const cheapestKeys = insights.filter((row) => row.isCheapest).map((row) => row.key);
  const diyorItems = insights.filter((row) => !row.isExternal);
  const externalItems = insights.filter((row) => row.isExternal);

  let headline = null;
  let tone = "neutral";

  if (minPrice === maxPrice) {
    headline = t("compare.priceSame");
  } else if (diyorItems.length && externalItems.length) {
    const diyorBest = Math.min(...diyorItems.map((row) => row.price));
    const externalBest = Math.min(...externalItems.map((row) => row.price));
    const diff = Math.abs(diyorBest - externalBest);

    if (diyorBest < externalBest) {
      headline = t("compare.diyorCheaper", { diff: formatDiff(diff, t) });
      tone = "positive";
    } else if (externalBest < diyorBest) {
      headline = t("compare.externalCheaper", { diff: formatDiff(diff, t) });
      tone = "warning";
    } else {
      headline = t("compare.pricesMatch");
    }
  } else {
    headline = t("compare.bestDeal", { diff: formatDiff(maxPrice - minPrice, t) });
    tone = "positive";
  }

  const priceHighlights = items.map((item) => {
    const key = getCompareItemKey(item);
    const row = insights.find((entry) => entry.key === key);
    if (!row) return null;

    return {
      cheapest: row.isCheapest && minPrice !== maxPrice,
      diffLabel:
        !row.isCheapest && row.diffFromCheapest > 0
          ? `+${formatDiff(row.diffFromCheapest, t)}`
          : row.isCheapest && minPrice !== maxPrice
            ? t("compare.bestPrice")
            : "",
    };
  });

  return {
    headline,
    tone,
    minPrice,
    maxPrice,
    cheapestKeys,
    insights,
    priceHighlights,
  };
}
