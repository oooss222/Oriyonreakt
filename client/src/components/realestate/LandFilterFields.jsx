import React from "react";
import {
  LAND_PURPOSE_OPTIONS,
  LAND_COMMUNICATIONS_OPTIONS,
  LAND_RELIEF_OPTIONS,
} from "../../data/realEstate";
import FilterChipGroup from "./FilterChipGroup";

export default function LandFilterFields({ draft, setSpec, className = "" }) {
  return (
    <div className={`space-y-4 ${className}`}>
      <FilterChipGroup
        label="Назначение"
        value={draft.specs?.["Назначение"] || ""}
        options={LAND_PURPOSE_OPTIONS}
        onChange={(value) => setSpec("Назначение", value)}
      />

      <FilterChipGroup
        label="Коммуникации"
        value={draft.specs?.["Коммуникации"] || ""}
        options={LAND_COMMUNICATIONS_OPTIONS}
        onChange={(value) => setSpec("Коммуникации", value)}
      />

      <FilterChipGroup
        label="Рельеф"
        value={draft.specs?.["Рельеф"] || ""}
        options={LAND_RELIEF_OPTIONS}
        onChange={(value) => setSpec("Рельеф", value)}
      />
    </div>
  );
}
