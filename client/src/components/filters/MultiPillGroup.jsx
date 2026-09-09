import React from "react";
import { parseMultiSpecValue, toggleMultiSpecValue } from "../../lib/specMultiValue";
import { Chip } from "../../ui";

export default function MultiPillGroup({
  values = "",
  options = [],
  onChange,
  anyLabel = "Любой",
}) {
  const selected = parseMultiSpecValue(values);

  return (
    <div className="flex flex-wrap gap-2">
      <Chip
        active={selected.length === 0}
        className="filter-chip"
        onClick={() => onChange?.("")}
      >
        {anyLabel}
      </Chip>

      {options.map((option) => (
        <Chip
          key={option}
          active={selected.includes(option)}
          className="filter-chip"
          onClick={() => onChange?.(toggleMultiSpecValue(values, option))}
        >
          {option}
        </Chip>
      ))}
    </div>
  );
}
