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

export function getPromotionMediaClass({ vip = false } = {}) {
  return vip ? "promotion-card-media" : "";
}

export function getListingLocationClass({ vip = false, top = false } = {}) {
  if (vip) {
    return "listing-card__location listing-card__location--vip";
  }

  if (top) {
    return "listing-card__location listing-card__location--top";
  }

  return "listing-card__location";
}
