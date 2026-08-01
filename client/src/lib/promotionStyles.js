export function getPromotionTier({ vip = false, top = false } = {}) {
  if (vip && top) return "both";
  if (vip) return "vip";
  if (top) return "top";
  return null;
}

export function getPromotionCardClass({ vip = false, top = false } = {}) {
  const tier = getPromotionTier({ vip, top });

  if (tier === "both") {
    return [
      "promotion-card promotion-card-both",
      "shadow-[0_12px_32px_-8px_rgba(245,158,11,0.35),0_12px_32px_-8px_rgba(14,124,123,0.28)]",
      "hover:shadow-[0_16px_36px_-6px_rgba(245,158,11,0.42),0_16px_36px_-6px_rgba(14,124,123,0.35)]",
    ].join(" ");
  }

  if (tier === "vip") {
    return [
      "promotion-card promotion-card-vip",
      "border-amber-300/90",
      "bg-gradient-to-br from-amber-50/90 via-white to-white",
      "shadow-[0_10px_28px_-8px_rgba(245,158,11,0.5)]",
      "hover:shadow-[0_14px_32px_-6px_rgba(245,158,11,0.58)]",
    ].join(" ");
  }

  if (tier === "top") {
    return [
      "promotion-card promotion-card-top",
      "border-teal-300/85",
      "bg-gradient-to-br from-teal-50/80 via-white to-white",
      "shadow-[0_10px_28px_-8px_rgba(14,124,123,0.38)]",
      "hover:shadow-[0_14px_32px_-6px_rgba(14,124,123,0.46)]",
    ].join(" ");
  }

  return "";
}

export function getPromotionCardAccent({ vip = false, top = false } = {}) {
  const tier = getPromotionTier({ vip, top });

  if (tier === "both") {
    return "promotion-card-accent promotion-card-accent-both";
  }

  if (tier === "vip") {
    return "promotion-card-accent promotion-card-accent-vip";
  }

  if (tier === "top") {
    return "promotion-card-accent promotion-card-accent-top";
  }

  return "";
}

export function getPromotionCardSideStripe({ vip = false, top = false } = {}) {
  const tier = getPromotionTier({ vip, top });

  if (!tier) return "";

  return `promotion-card-stripe promotion-card-stripe-${tier}`;
}
