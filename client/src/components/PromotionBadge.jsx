import React from "react";
import { Crown, TrendingUp } from "lucide-react";

const SIZE_MAP = {
  sm: {
    wrap: "px-2 py-0.5 text-[10px] gap-1 rounded-lg",
    icon: 11,
  },
  md: {
    wrap: "px-2.5 py-1 text-[11px] gap-1 rounded-lg",
    icon: 12,
  },
  lg: {
    wrap: "px-3 py-1.5 text-xs gap-1.5 rounded-xl",
    icon: 14,
  },
};

export default function PromotionBadge({
  type = "vip",
  size = "md",
  showIcon = true,
  className = "",
}) {
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;
  const isVip = type === "vip";

  return (
    <span
      className={`promotion-badge inline-flex items-center font-bold uppercase tracking-wide text-white shadow-md ${
        isVip ? "promotion-badge-vip" : "promotion-badge-top"
      } ${sizeConfig.wrap} ${className}`}
    >
      {showIcon &&
        (isVip ? (
          <Crown size={sizeConfig.icon} className="shrink-0 drop-shadow-sm" />
        ) : (
          <TrendingUp size={sizeConfig.icon} className="shrink-0 drop-shadow-sm" />
        ))}
      {isVip ? "VIP" : "TOP"}
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
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {vip && <PromotionBadge type="vip" size={size} />}
      {top && <PromotionBadge type="top" size={size} />}
    </div>
  );
}
