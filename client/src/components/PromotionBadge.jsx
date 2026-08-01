import React from "react";
import { Crown, TrendingUp } from "lucide-react";

const SIZE_MAP = {
  sm: {
    wrap: "h-[26px] px-2 text-[10px] gap-1",
    iconWrap: "h-4 w-4",
    icon: 10,
  },
  md: {
    wrap: "h-7 px-2.5 text-[11px] gap-1.5",
    iconWrap: "h-4 w-4",
    icon: 11,
  },
  lg: {
    wrap: "h-9 px-3.5 text-xs gap-2",
    iconWrap: "h-5 w-5",
    icon: 13,
  },
};

const TYPE_META = {
  vip: {
    label: "VIP",
    Icon: Crown,
    badgeClass: "promotion-badge-vip",
    ariaLabel: "VIP объявление",
  },
  top: {
    label: "TOP",
    Icon: TrendingUp,
    badgeClass: "promotion-badge-top",
    ariaLabel: "TOP объявление",
  },
};

export default function PromotionBadge({
  type = "vip",
  size = "md",
  showIcon = true,
  className = "",
}) {
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;
  const meta = TYPE_META[type] || TYPE_META.vip;
  const Icon = meta.Icon;

  return (
    <span
      className={[
        "promotion-badge inline-flex items-center rounded-full font-bold uppercase tracking-[0.1em] text-white",
        meta.badgeClass,
        sizeConfig.wrap,
        className,
      ].join(" ")}
      aria-label={meta.ariaLabel}
      title={meta.ariaLabel}
    >
      {showIcon && (
        <span
          className={[
            "inline-flex shrink-0 items-center justify-center rounded-full bg-black/10 ring-1 ring-white/35",
            sizeConfig.iconWrap,
          ].join(" ")}
        >
          <Icon size={sizeConfig.icon} className="drop-shadow-sm" strokeWidth={2.75} />
        </span>
      )}
      <span className="leading-none">{meta.label}</span>
    </span>
  );
}

export function PromotionBadgeGroup({
  vip = false,
  top = false,
  size = "md",
  layout = "auto",
  className = "",
}) {
  if (!vip && !top) {
    return null;
  }

  const flow =
    layout === "stack"
      ? "flex-col"
      : layout === "row"
        ? "flex-row flex-wrap"
        : size === "sm"
          ? "flex-row flex-wrap"
          : "flex-col";

  return (
    <div
      className={[`flex items-start gap-1`, flow, className].join(" ")}
      aria-label={[vip && "VIP", top && "TOP"].filter(Boolean).join(", ")}
    >
      {vip && <PromotionBadge type="vip" size={size} />}
      {top && <PromotionBadge type="top" size={size} />}
    </div>
  );
}
