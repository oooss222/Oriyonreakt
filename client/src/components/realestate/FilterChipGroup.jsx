import React from "react";
import { Chip, cn } from "../../ui";

/**
 * Labelled single-select chip row shared by the real-estate filter field sets.
 * Clicking the active chip clears the value.
 */
export default function FilterChipGroup({
  label,
  value,
  options = [],
  onChange,
  labelClassName = "label-caps mb-3",
  className = "",
}) {
  const labelId = React.useId();

  return (
    <div className={className}>
      {label && (
        <div id={labelId} className={labelClassName}>
          {label}
        </div>
      )}

      <div
        role="group"
        aria-labelledby={label ? labelId : undefined}
        className="flex flex-wrap gap-2"
      >
        {options.map((option) => {
          const active = value === option;

          return (
            <Chip
              key={option}
              active={active}
              className="filter-chip"
              onClick={() => onChange(active ? "" : option)}
            >
              {option}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}

/** Nested sub-group inside a larger labelled block. */
export function FilterChipSubGroup(props) {
  return (
    <FilterChipGroup
      {...props}
      labelClassName={cn("mb-2 text-xs font-medium text-ink-500")}
    />
  );
}
