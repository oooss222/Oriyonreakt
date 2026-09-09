import React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "./cn";

const TONES = {
  info: { icon: Info, className: "border-info-200 bg-info-50 text-info-800", iconClass: "text-info-600" },
  success: {
    icon: CheckCircle2,
    className: "border-success-200 bg-success-50 text-success-800",
    iconClass: "text-success-600",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-warning-200 bg-warning-50 text-warning-800",
    iconClass: "text-warning-600",
  },
  danger: {
    icon: XCircle,
    className: "border-danger-200 bg-danger-50 text-danger-800",
    iconClass: "text-danger-600",
  },
};

export default function Alert({
  tone = "info",
  title,
  action,
  icon,
  live = true,
  className = "",
  children,
}) {
  const preset = TONES[tone] || TONES.info;
  const Icon = icon || preset.icon;

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      aria-live={live ? (tone === "danger" ? "assertive" : "polite") : undefined}
      className={cn("flex items-start gap-2.5 rounded-xl border p-3 text-sm", preset.className, className)}
    >
      <Icon size={17} className={cn("mt-px shrink-0", preset.iconClass)} aria-hidden="true" />

      <div className="min-w-0 flex-1 break-anywhere">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "leading-relaxed")}>{children}</div>}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
