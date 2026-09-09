import React from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { cn } from "./cn";

/** Filter / category pill. Toggles state or navigates. */
export default function Chip({
  active = false,
  tone = "ink",
  as,
  to,
  icon: Icon,
  count,
  className = "",
  children,
  ...rest
}) {
  const classes = cn(
    "chip",
    active && (tone === "sun" ? "chip-sun" : "chip-active"),
    className
  );

  const content = (
    <>
      {Icon && <Icon size={15} strokeWidth={2.1} aria-hidden="true" />}
      <span className="truncate">{children}</span>
      {count != null && (
        <span className={cn("text-2xs font-semibold", active ? "opacity-70" : "text-ink-400")}>
          {count}
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} aria-current={active ? "page" : undefined} {...rest}>
        {content}
      </Link>
    );
  }

  const Tag = as || "button";

  return (
    <Tag
      type={Tag === "button" ? "button" : undefined}
      className={classes}
      aria-pressed={Tag === "button" ? active : undefined}
      {...rest}
    >
      {content}
    </Tag>
  );
}

/** Applied-filter token with an inline remove control. */
export function FilterToken({ label, value, onRemove, removeLabel = "Убрать фильтр" }) {
  return (
    <span className="chip-token">
      {label && <span className="text-ink-400">{label}:</span>}
      <span className="max-w-[12rem] truncate font-semibold">{value}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${removeLabel}: ${value}`}
        className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-ink-400 transition hover:bg-ink-200 hover:text-ink-900"
      >
        <X size={12} strokeWidth={2.6} aria-hidden="true" />
      </button>
    </span>
  );
}
