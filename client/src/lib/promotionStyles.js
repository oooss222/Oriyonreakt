export function getPromotionCardClass({ vip = false, top = false } = {}) {
  if (vip) {
    return "promotion-card promotion-card-vip";
  }

  if (top) {
    return "promotion-card promotion-card-top";
  }

  return "";
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
