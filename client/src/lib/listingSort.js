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

export function sortListingsByMode(items = [], sort = "new") {
  if (sort === "old") {
    return [...items].sort(
      (a, b) =>
        new Date(a?.createdAt || 0).getTime() -
        new Date(b?.createdAt || 0).getTime()
    );
  }

  if (sort === "price_asc") {
    return [...items].sort((a, b) => {
      const promo = compareListingsByPromotion(a, b);

      if (promo !== 0) {
        return promo;
      }

      const priceA = parseListingPrice(a);
      const priceB = parseListingPrice(b);

      if (priceA == null && priceB == null) return 0;
      if (priceA == null) return 1;
      if (priceB == null) return -1;

      return priceA - priceB;
    });
  }

  if (sort === "price_desc") {
    return [...items].sort((a, b) => {
      const promo = compareListingsByPromotion(a, b);

      if (promo !== 0) {
        return promo;
      }

      const priceA = parseListingPrice(a);
      const priceB = parseListingPrice(b);

      if (priceA == null && priceB == null) return 0;
      if (priceA == null) return 1;
      if (priceB == null) return -1;

      return priceB - priceA;
    });
  }

  if (sort === "views_desc") {
    return [...items].sort((a, b) => {
      const promo = compareListingsByPromotion(a, b);

      if (promo !== 0) {
        return promo;
      }

      return Number(b?.views || 0) - Number(a?.views || 0);
    });
  }

  return sortListingsByPromotion(items);
}
