import React from "react";
import { Crown } from "lucide-react";

const SIZE_MAP = {
  sm: {
    wrap: "h-[26px] px-2.5 text-[10px] gap-1",
    icon: 11,
  },
  md: {
    wrap: "h-7 px-3 text-[11px] gap-1.5",
    icon: 12,
  },
  lg: {
    wrap: "h-8 px-3.5 text-xs gap-2",
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
      className={[
        "promotion-badge inline-flex items-center rounded-md font-bold uppercase tracking-wide text-white shadow-sm",
        isVip ? "promotion-badge-vip" : "promotion-badge-top",
        sizeConfig.wrap,
        className,
      ].join(" ")}
      aria-label={isVip ? "VIP объявление" : "TOP объявление"}
    >
      {isVip && showIcon && (
        <Crown size={sizeConfig.icon} className="shrink-0" strokeWidth={2.5} />
      )}
      <span className="leading-none">{isVip ? "VIP" : "TOP"}</span>
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
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {vip && <PromotionBadge type="vip" size={size} />}
      {top && <PromotionBadge type="top" size={size} showIcon={false} />}
    </div>
  );
}
