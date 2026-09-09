import React from "react";
import {
  GARAGE_TYPE_OPTIONS,
  GARAGE_SECURITY_OPTIONS,
  RENT_TERM_OPTIONS,
  RENT_DEPOSIT_OPTIONS,
} from "../../data/realEstate";
import FilterChipGroup, { FilterChipSubGroup } from "./FilterChipGroup";

export default function GarageFilterFields({
  draft,
  setSpec,
  isRent = false,
  className = "",
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      <FilterChipGroup
        label="Тип"
        value={draft.specs?.["Тип"] || ""}
        options={GARAGE_TYPE_OPTIONS}
        onChange={(value) => setSpec("Тип", value)}
      />

      <FilterChipGroup
        label="Охрана"
        value={draft.specs?.["Охрана"] || ""}
        options={GARAGE_SECURITY_OPTIONS}
        onChange={(value) => setSpec("Охрана", value)}
      />

      {isRent ? (
        <div>
          <div className="label-caps mb-3">Условия аренды</div>
          <div className="space-y-3">
            <FilterChipSubGroup
              label="Срок аренды"
              value={draft.specs?.["Срок аренды"] || ""}
              options={RENT_TERM_OPTIONS}
              onChange={(value) => setSpec("Срок аренды", value)}
            />
            <FilterChipSubGroup
              label="Залог"
              value={draft.specs?.["Залог"] || ""}
              options={RENT_DEPOSIT_OPTIONS}
              onChange={(value) => setSpec("Залог", value)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
