import React from "react";
import {
  COMMERCIAL_OBJECT_TYPE_OPTIONS,
  COMMERCIAL_REPAIR_OPTIONS,
  COMMERCIAL_PARKING_OPTIONS,
  RENT_TERM_OPTIONS,
  RENT_DEPOSIT_OPTIONS,
} from "../../data/realEstate";
import FilterChipGroup, { FilterChipSubGroup } from "./FilterChipGroup";

export default function CommercialFilterFields({
  draft,
  setSpec,
  isRent = false,
  className = "",
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      <FilterChipGroup
        label="Тип объекта"
        value={draft.specs?.["Тип объекта"] || ""}
        options={COMMERCIAL_OBJECT_TYPE_OPTIONS}
        onChange={(value) => setSpec("Тип объекта", value)}
      />

      <FilterChipGroup
        label="Ремонт"
        value={draft.specs?.["Ремонт"] || ""}
        options={COMMERCIAL_REPAIR_OPTIONS}
        onChange={(value) => setSpec("Ремонт", value)}
      />

      <FilterChipGroup
        label="Парковка"
        value={draft.specs?.["Парковка"] || ""}
        options={COMMERCIAL_PARKING_OPTIONS}
        onChange={(value) => setSpec("Парковка", value)}
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
