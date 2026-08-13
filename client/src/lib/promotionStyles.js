export function getPromotionCardClass({ vip = false, top = false } = {}) {
  if (vip) {
    return "promotion-card promotion-card-vip";
  }

  if (top) {
    return "promotion-card promotion-card-top";
  }

  return "";
}

export function getPromotionCardAccent() {
  return "";
}

export function getPromotionMediaClass() {
  return "";
}
