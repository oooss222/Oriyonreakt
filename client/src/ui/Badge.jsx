import React from "react";
import { cn } from "./cn";

const TONES = {
  sun: "badge",
  neutral: "badge badge-neutral",
  success: "badge badge-success",
  warning: "badge badge-warning",
  danger: "badge badge-danger",
  info: "badge badge-info",
};

export default function Badge({ tone = "neutral", icon: Icon, className = "", children, ...rest }) {
  return (
    <span className={cn(TONES[tone] || TONES.neutral, className)} {...rest}>
      {Icon && <Icon size={12} strokeWidth={2.4} aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Listing lifecycle state. A dot carries the state for colour-blind users. */
export function StatusBadge({ tone = "neutral", label, className = "" }) {
  const dotTone = {
    success: "bg-success-500",
    warning: "bg-warning-500",
    danger: "bg-danger-500",
    info: "bg-info-500",
    neutral: "bg-ink-400",
    sun: "bg-sun-500",
  }[tone];

  return (
    <Badge tone={tone} className={className}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dotTone)} aria-hidden="true" />
      {label}
    </Badge>
  );
}
