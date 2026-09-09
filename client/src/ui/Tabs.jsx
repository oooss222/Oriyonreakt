import React from "react";
import { Link } from "react-router-dom";
import { cn } from "./cn";

/**
 * Underlined tab bar with the full ARIA tab pattern, including arrow-key
 * navigation. Items may navigate (`to`) or switch state (`value`).
 */
export function Tabs({ items, value, onChange, className = "", label }) {
  const listRef = React.useRef(null);

  const onKeyDown = (event) => {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(event.key)) return;

    const tabs = Array.from(listRef.current?.querySelectorAll("[role='tab']") || []);
    const current = tabs.indexOf(document.activeElement);
    if (current === -1) return;

    event.preventDefault();

    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;

    tabs[next]?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        "flex gap-1 overflow-x-auto border-b border-ink-200 scrollbar-none",
        className
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        const Icon = item.icon;

        const content = (
          <>
            {Icon && <Icon size={16} strokeWidth={2.1} aria-hidden="true" />}
            <span className="whitespace-nowrap">{item.label}</span>
            {item.count != null && item.count !== 0 && (
              <span
                className={cn(
                  "ml-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-2xs font-bold",
                  active ? "bg-sun-100 text-sun-800" : "bg-mist-200 text-ink-500"
                )}
              >
                {item.count}
              </span>
            )}
          </>
        );

        const classes = cn(
          "-mb-px inline-flex min-h-[2.75rem] shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors",
          active
            ? "border-sun-500 text-ink-900"
            : "border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-900"
        );

        if (item.to) {
          return (
            <Link
              key={item.value}
              to={item.to}
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              className={classes}
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={item.panelId}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange?.(item.value)}
            className={classes}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

/** Compact pill switch for two or three mutually exclusive options. */
export function SegmentedControl({ items, value, onChange, className = "", label, size = "md" }) {
  return (
    <div role="group" aria-label={label} className={cn("segmented", className)}>
      {items.map((item) => {
        const active = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange?.(item.value)}
            className={cn(
              "segmented-item flex-1",
              size === "sm" && "min-h-[1.875rem] px-2.5 text-xs",
              active && "segmented-item-active"
            )}
          >
            {item.icon && <item.icon size={15} className="mr-1.5" aria-hidden="true" />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
