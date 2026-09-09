import React from "react";
import {
  DAILY_AMENITY_OPTIONS,
  DAILY_BALCONY_OPTIONS,
  DAILY_PETS_OPTIONS,
  DAILY_SMOKING_OPTIONS,
} from "../../data/realEstate";
import MultiPillGroup from "../filters/MultiPillGroup";
import FilterChipGroup from "./FilterChipGroup";

export default function DailyRentalFilterFields({ draft, setSpec, className = "" }) {
  const amenitiesLabelId = React.useId();

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <div id={amenitiesLabelId} className="label-caps mb-3">
          Удобства
        </div>
        <div role="group" aria-labelledby={amenitiesLabelId}>
          <MultiPillGroup
            values={draft.specs?.["Удобства"] || ""}
            options={DAILY_AMENITY_OPTIONS}
            onChange={(value) => setSpec("Удобства", value)}
          />
        </div>
        <p className="mt-2 text-xs text-ink-400">
          Можно выбрать несколько — покажем жильё со всеми выбранными опциями
        </p>
      </div>

      <FilterChipGroup
        label="Балкон"
        value={draft.specs?.["Балкон"] || ""}
        options={DAILY_BALCONY_OPTIONS}
        onChange={(value) => setSpec("Балкон", value)}
      />

      <FilterChipGroup
        label="Животные"
        value={draft.specs?.["Животные"] || ""}
        options={DAILY_PETS_OPTIONS}
        onChange={(value) => setSpec("Животные", value)}
      />

      <FilterChipGroup
        label="Курение"
        value={draft.specs?.["Курение"] || ""}
        options={DAILY_SMOKING_OPTIONS}
        onChange={(value) => setSpec("Курение", value)}
      />
    </div>
  );
}
