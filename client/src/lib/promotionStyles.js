export function getPromotionCardClass({ vip = false, top = false } = {}) {
  if (vip) {
    return [
      "promotion-card promotion-card-vip",
      "border-amber-300/80",
      "bg-gradient-to-br from-amber-50/80 via-white to-white",
      "shadow-[0_10px_28px_-8px_rgba(245,158,11,0.45)]",
      "hover:shadow-[0_14px_32px_-6px_rgba(245,158,11,0.52)]",
    ].join(" ");
  }

  if (top) {
    return [
      "promotion-card promotion-card-top",
      "border-teal-300/75",
      "bg-gradient-to-br from-teal-50/70 via-white to-white",
      "shadow-[0_10px_28px_-8px_rgba(14,124,123,0.32)]",
      "hover:shadow-[0_14px_32px_-6px_rgba(14,124,123,0.4)]",
    ].join(" ");
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
