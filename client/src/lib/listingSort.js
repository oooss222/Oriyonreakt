export function compareListingsByPromotion(a, b) {
  const vipDiff = Number(Boolean(b?.vip)) - Number(Boolean(a?.vip));

  if (vipDiff !== 0) {
    return vipDiff;
  }

  const topDiff = Number(Boolean(b?.top)) - Number(Boolean(a?.top));

  if (topDiff !== 0) {
    return topDiff;
  }

  const bumpedA = new Date(a?.bumpedAt || a?.createdAt || 0).getTime();
  const bumpedB = new Date(b?.bumpedAt || b?.createdAt || 0).getTime();

  if (bumpedB !== bumpedA) {
    return bumpedB - bumpedA;
  }

  return (
    new Date(b?.createdAt || 0).getTime() -
    new Date(a?.createdAt || 0).getTime()
  );
}

function parseListingPrice(item) {
  const raw = String(item?.price || "")
    .replace(/[^\d.,]/g, "")
    .replace(",", ".");

  const value = Number(raw);

  return Number.isFinite(value) ? value : null;
}

export function sortListingsByPromotion(items = []) {
  return [...items].sort(compareListingsByPromotion);
}

function compareNullableNumber(a, b, direction) {
  const aOk = Number.isFinite(a);
  const bOk = Number.isFinite(b);
  if (!aOk && !bOk) return 0;
  if (!aOk) return 1;
  if (!bOk) return -1;
  return direction === "asc" ? a - b : b - a;
}

export function sortListingsByMode(items = [], sort = "new") {
  if (sort === "old") {
    return [...items].sort(
      (a, b) =>
        new Date(a?.createdAt || 0).getTime() -
        new Date(b?.createdAt || 0).getTime()
    );
  }

  if (sort === "price_asc" || sort === "price_desc") {
    const direction = sort === "price_asc" ? "asc" : "desc";
    return [...items].sort((a, b) =>
      compareNullableNumber(parseListingPrice(a), parseListingPrice(b), direction)
    );
  }

  if (sort === "views_desc") {
    return [...items].sort(
      (a, b) => Number(b?.views || 0) - Number(a?.views || 0)
    );
  }

  if (sort === "price_per_sqm_asc" || sort === "price_per_sqm_desc") {
    const direction = sort === "price_per_sqm_asc" ? "asc" : "desc";
    return [...items].sort((a, b) =>
      compareNullableNumber(Number(a?.rePricePerSqm), Number(b?.rePricePerSqm), direction)
    );
  }

  return [...items];
}

export function arrangePromotionFeed(items = [], { row = 4, capAt = 8 } = {}) {
  const vip = [];
  const top = [];
  const regular = [];

  for (const item of items) {
    if (item?.vip) vip.push(item);
    else if (item?.top) top.push(item);
    else regular.push(item);
  }

  const byRecency = (a, b) =>
    new Date(b?.bumpedAt || b?.createdAt || 0).getTime() -
    new Date(a?.bumpedAt || a?.createdAt || 0).getTime();

  vip.sort(byRecency);
  top.sort(byRecency);
  regular.sort(byRecency);

  if (vip.length <= capAt) {
    return [...vip, ...top, ...regular];
  }

  return [
    ...vip.slice(0, row),
    ...top.slice(0, row),
    ...regular,
    ...vip.slice(row),
    ...top.slice(row),
  ];
}
