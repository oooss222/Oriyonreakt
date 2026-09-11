import React from "react";
import { useI18n } from "../../i18n";

/**
 * Single-select filter row (radio semantics) with an optional result count.
 * Shared by the catalog and real-estate filter sidebars, which previously
 * each defined an identical copy of this component.
 */
export default function RadioOption({ active, label, count, onSelect }) {
  const { lang } = useI18n();
  const numberLocale = lang === "en" ? "en-US" : lang === "tg" ? "tg-TJ" : "ru-RU";

  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-1 py-1.5 text-left transition hover:bg-mist/70"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 transition ${
            active ? "border-sun" : "border-ink/20"
          }`}
        >
          {active ? <span className="h-2 w-2 rounded-full bg-sun" /> : null}
        </span>
        <span
          className={`truncate text-sm ${
            active ? "font-semibold text-ink" : "text-ink-600"
          }`}
        >
          {label}
        </span>
      </span>
      {typeof count === "number" ? (
        <span className="shrink-0 text-xs font-medium text-ink-300">
          {count.toLocaleString(numberLocale)}
        </span>
      ) : null}
    </button>
  );
}
