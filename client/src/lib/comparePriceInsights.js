import { parsePriceNumber } from "./format";
import { getCompareItemKey, isExternalCompareItem } from "./compareResolve";
import { getPlatformLabel } from "./comparePlatforms";

function formatDiff(amount) {
  const value = Math.round(Number(amount) || 0);
  if (!value) return "";
  return `${value.toLocaleString("ru-RU")} с.`;
}

export function getCompareItemPrice(item) {
  return parsePriceNumber(item?.price);
}

export function buildComparePriceInsights(items = []) {
  const priced = items
    .map((item) => ({
      key: getCompareItemKey(item),
      price: getCompareItemPrice(item),
      isExternal: isExternalCompareItem(item),
      source: item._compareSource || "oriyon",
      sourceLabel: isExternalCompareItem(item)
        ? getPlatformLabel(item._compareSource)
        : "Oriyon",
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
  const oriyonItems = insights.filter((row) => !row.isExternal);
  const externalItems = insights.filter((row) => row.isExternal);

  let headline = null;
  let tone = "neutral";

  if (minPrice === maxPrice) {
    headline = "У всех объявлений в списке одинаковая цена";
  } else if (oriyonItems.length && externalItems.length) {
    const oriyonBest = Math.min(...oriyonItems.map((row) => row.price));
    const externalBest = Math.min(...externalItems.map((row) => row.price));
    const diff = Math.abs(oriyonBest - externalBest);

    if (oriyonBest < externalBest) {
      headline = `На Oriyon дешевле на ${formatDiff(diff)} по сравнению с другими площадками`;
      tone = "positive";
    } else if (externalBest < oriyonBest) {
      headline = `На других площадках дешевле на ${formatDiff(diff)} по сравнению с Oriyon`;
      tone = "warning";
    } else {
      headline = "Цены на Oriyon и других площадках совпадают";
    }
  } else {
    headline = `Самое выгодное предложение дешевле на ${formatDiff(maxPrice - minPrice)}`;
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
          ? `+${formatDiff(row.diffFromCheapest)}`
          : row.isCheapest && minPrice !== maxPrice
            ? "Лучшая цена"
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
