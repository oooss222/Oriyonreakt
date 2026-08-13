import React from "react";
import {
  COMMERCIAL_OBJECT_TYPE_OPTIONS,
  COMMERCIAL_REPAIR_OPTIONS,
  COMMERCIAL_PARKING_OPTIONS,
  RENT_TERM_OPTIONS,
  RENT_DEPOSIT_OPTIONS,
} from "../../data/realEstate";

function ChipGroup({ value, options, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(active ? "" : option)}
            className={`chip ${active ? "chip-active" : ""}`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default function CommercialFilterFields({
  draft,
  setSpec,
  isRent = false,
  className = "",
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <div className="label-caps mb-3">Тип объекта</div>
        <ChipGroup
          value={draft.specs?.["Тип объекта"] || ""}
          options={COMMERCIAL_OBJECT_TYPE_OPTIONS}
          onChange={(value) => setSpec("Тип объекта", value)}
        />
      </div>

      <div>
        <div className="label-caps mb-3">Ремонт</div>
        <ChipGroup
          value={draft.specs?.["Ремонт"] || ""}
          options={COMMERCIAL_REPAIR_OPTIONS}
          onChange={(value) => setSpec("Ремонт", value)}
        />
      </div>

      <div>
        <div className="label-caps mb-3">Парковка</div>
        <ChipGroup
          value={draft.specs?.["Парковка"] || ""}
          options={COMMERCIAL_PARKING_OPTIONS}
          onChange={(value) => setSpec("Парковка", value)}
        />
      </div>

      {isRent ? (
        <div>
          <div className="label-caps mb-3">Условия аренды</div>
          <div className="space-y-3">
            <div>
              <div className="mb-2 text-xs font-medium text-ink-500">Срок аренды</div>
              <ChipGroup
                value={draft.specs?.["Срок аренды"] || ""}
                options={RENT_TERM_OPTIONS}
                onChange={(value) => setSpec("Срок аренды", value)}
              />
            </div>
            <div>
              <div className="mb-2 text-xs font-medium text-ink-500">Залог</div>
              <ChipGroup
                value={draft.specs?.["Залог"] || ""}
                options={RENT_DEPOSIT_OPTIONS}
                onChange={(value) => setSpec("Залог", value)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
