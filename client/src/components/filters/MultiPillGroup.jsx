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
        className={`h-10 px-3 rounded-full border text-sm font-medium transition ${
          selected.length === 0
            ? "border-lagoon bg-lagoon-50 text-lagoon-800"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
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
            className={`h-10 px-3 rounded-full border text-sm font-medium transition ${
              active
                ? "border-lagoon bg-lagoon-50 text-lagoon-800"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
