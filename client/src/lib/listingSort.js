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

export function sortListingsByPromotion(items = []) {
  return [...items].sort(compareListingsByPromotion);
}
