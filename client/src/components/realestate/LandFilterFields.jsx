import React from "react";
import {
  LAND_PURPOSE_OPTIONS,
  LAND_COMMUNICATIONS_OPTIONS,
  LAND_RELIEF_OPTIONS,
} from "../../data/realEstate";
import { useI18n } from "../../i18n";

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

export default function LandFilterFields({ draft, setSpec, className = "" }) {
  const { t } = useI18n();
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <div className="label-caps mb-3">{t("realestate.filters.purposeLabel")}</div>
        <ChipGroup
          value={draft.specs?.["Назначение"] || ""}
          options={LAND_PURPOSE_OPTIONS}
          onChange={(value) => setSpec("Назначение", value)}
        />
      </div>

      <div>
        <div className="label-caps mb-3">{t("realestate.filters.communicationsLabel")}</div>
        <ChipGroup
          value={draft.specs?.["Коммуникации"] || ""}
          options={LAND_COMMUNICATIONS_OPTIONS}
          onChange={(value) => setSpec("Коммуникации", value)}
        />
      </div>

      <div>
        <div className="label-caps mb-3">{t("realestate.filters.reliefLabel")}</div>
        <ChipGroup
          value={draft.specs?.["Рельеф"] || ""}
          options={LAND_RELIEF_OPTIONS}
          onChange={(value) => setSpec("Рельеф", value)}
        />
      </div>
    </div>
  );
}
