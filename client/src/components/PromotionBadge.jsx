import React from "react";
import { Crown, TrendingUp } from "lucide-react";
import { useI18n } from "../i18n";

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
  className = "",
}) {
  const { t } = useI18n();
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;
  const isVip = type === "vip";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full font-bold uppercase tracking-wide shadow-sm",
        isVip
          ? "border border-[#e0b34a]/60 bg-[#f6e7c6] text-[#8a6414]"
          : "border border-white/20 bg-[#2a9d8f] text-white",
        sizeConfig.wrap,
        className,
      ].join(" ")}
      aria-label={isVip ? t("promotion.vipAria") : t("promotion.topAria")}
    >
      {isVip ? (
        <Crown
          size={sizeConfig.icon}
          className="shrink-0 text-[#8a6414]"
          strokeWidth={2.5}
        />
      ) : (
        <TrendingUp
          size={sizeConfig.icon}
          className="shrink-0"
          strokeWidth={2.5}
        />
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
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <PromotionBadge type={vip ? "vip" : "top"} size={size} />
    </div>
  );
}
