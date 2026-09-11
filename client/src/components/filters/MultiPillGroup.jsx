import React from "react";
import { parseMultiSpecValue, toggleMultiSpecValue } from "../../lib/specMultiValue";
import { useI18n } from "../../i18n";

export default function MultiPillGroup({
  values = "",
  options = [],
  onChange,
  anyLabel,
}) {
  const { t } = useI18n();
  const selected = parseMultiSpecValue(values);
  const resolvedAnyLabel = anyLabel ?? t("filter.any");

  return (
    <div className="flex flex-wrap gap-2" role="group">
      <button
        type="button"
        aria-pressed={selected.length === 0}
        onClick={() => onChange?.("")}
        className={`chip ${selected.length === 0 ? "chip-active" : ""}`}
      >
        {resolvedAnyLabel}
      </button>

      {options.map((option) => {
        const active = selected.includes(option);

        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange?.(toggleMultiSpecValue(values, option))}
            className={`chip ${active ? "chip-active" : ""}`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
