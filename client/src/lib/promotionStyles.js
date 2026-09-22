export function getPromotionCardClass({ vip = false, top = false, highlight = false } = {}) {
  const parts = [];

  if (vip) parts.push("promotion-card promotion-card-vip");
  else if (top) parts.push("promotion-card promotion-card-top");
  if (highlight) parts.push("promotion-card promotion-card-highlight");

  return parts.join(" ");
}

export function getPromotionCardAccent({ vip = false, top = false } = {}) {
  if (vip) return "promotion-accent-vip";
  if (top) return "promotion-accent-top";
  return "";
}

export function getPromotionMediaClass({ vip = false, top = false } = {}) {
  if (vip) return "promotion-media-vip";
  if (top) return "promotion-media-top";
  return "";
}
