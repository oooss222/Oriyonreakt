export function getPromotionCardClass({ vip = false, top = false } = {}) {
  if (vip) {
    return "ring-2 ring-amber-400/75 border-amber-200/90 shadow-[0_10px_32px_rgb(251_191_36/0.22)] hover:shadow-[0_14px_36px_rgb(251_191_36/0.28)]";
  }

  if (top) {
    return "ring-2 ring-lagoon/55 border-lagoon-200/90 shadow-[0_10px_28px_rgb(14_124_123/0.18)] hover:shadow-[0_14px_32px_rgb(14_124_123/0.24)]";
  }

  return "";
}

export function getPromotionCardAccent({ vip = false, top = false } = {}) {
  if (vip) {
    return "promotion-card-accent promotion-card-accent-vip";
  }

  if (top) {
    return "promotion-card-accent promotion-card-accent-top";
  }

  return "";
}
