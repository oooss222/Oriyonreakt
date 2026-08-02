import React from "react";
import { parseMultiSpecValue, toggleMultiSpecValue } from "../../lib/specMultiValue";

export default function MultiPillGroup({
  values = "",
  options = [],
  onChange,
  anyLabel = "Любой",
}) {
  const selected = parseMultiSpecValue(values);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange?.("")}
        className={`chip ${selected.length === 0 ? "chip-active" : ""}`}
      >
        {anyLabel}
      </button>

      {options.map((option) => {
        const active = selected.includes(option);

        return (
          <button
            key={option}
            type="button"
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
