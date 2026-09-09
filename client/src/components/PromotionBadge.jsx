import React from "react";
import { Crown, TrendingUp } from "lucide-react";
import { cn } from "../ui";
import { useI18n } from "../i18n";

const SIZE_MAP = {
  sm: { wrap: "h-[22px] px-2 text-2xs gap-1", icon: 11 },
  md: { wrap: "h-6 px-2.5 text-2xs gap-1", icon: 12 },
  lg: { wrap: "h-7 px-3 text-xs gap-1.5", icon: 14 },
};

// Promoted listings should read as "endorsed", not as a banner ad, so the badge
// is a flat solid chip in the brand ramp rather than a glossy gradient.
const TONE_MAP = {
  vip: "bg-sun-500 text-white",
  top: "bg-lagoon-600 text-white",
};

export default function PromotionBadge({
  type = "vip",
  size = "md",
  className = "",
}) {
  const { t } = useI18n();
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;
  const isVip = type === "vip";
  const Icon = isVip ? Crown : TrendingUp;

  return (
    <span
      className={cn(
        "promotion-badge inline-flex items-center rounded-full font-bold uppercase tracking-wide",
        isVip ? TONE_MAP.vip : TONE_MAP.top,
        sizeConfig.wrap,
        className
      )}
      title={t(isVip ? "promotion.vipTitle" : "promotion.topTitle")}
    >
      <Icon size={sizeConfig.icon} className="shrink-0" strokeWidth={2.5} aria-hidden />
      <span className="leading-none">{isVip ? "VIP" : "TOP"}</span>
      <span className="sr-only">
        {" "}
        {t(isVip ? "promotion.vipTitle" : "promotion.topTitle")}
      </span>
    </span>
  );
}

export function PromotionBadgeGroup({
  vip = false,
  top = false,
  size = "md",
  className = "",
}) {
  if (!vip && !top) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {vip && <PromotionBadge type="vip" size={size} />}
      {top && !vip && <PromotionBadge type="top" size={size} />}
    </div>
  );
}
