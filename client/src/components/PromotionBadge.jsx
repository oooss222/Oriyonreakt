import React from "react";
import { Crown, Sparkles } from "lucide-react";

const SIZE_MAP = {
  sm: {
    wrap: "h-6 px-2 text-[10px] gap-1",
    iconWrap: "h-4 w-4",
    icon: 10,
  },
  md: {
    wrap: "h-7 px-2.5 text-[11px] gap-1.5",
    iconWrap: "h-4 w-4",
    icon: 11,
  },
  lg: {
    wrap: "h-8 px-3 text-xs gap-2",
    iconWrap: "h-5 w-5",
    icon: 13,
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
  const Icon = isVip ? Crown : Sparkles;

  return (
    <span
      className={[
        "promotion-badge inline-flex items-center rounded-full font-bold uppercase tracking-[0.08em] text-white",
        isVip ? "promotion-badge-vip" : "promotion-badge-top",
        sizeConfig.wrap,
        className,
      ].join(" ")}
    >
      {showIcon && (
        <span
          className={[
            "inline-flex shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30",
            sizeConfig.iconWrap,
          ].join(" ")}
        >
          <Icon size={sizeConfig.icon} className="drop-shadow-sm" strokeWidth={2.5} />
        </span>
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
    <div className={`flex flex-col items-start gap-1 ${className}`}>
      {vip && <PromotionBadge type="vip" size={size} />}
      {top && <PromotionBadge type="top" size={size} />}
    </div>
  );
}
