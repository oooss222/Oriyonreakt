import React from "react";
import {
  DAILY_AMENITY_OPTIONS,
  DAILY_BALCONY_OPTIONS,
  DAILY_PETS_OPTIONS,
  DAILY_SMOKING_OPTIONS,
} from "../../data/realEstate";
import MultiPillGroup from "../filters/MultiPillGroup";
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

export default function DailyRentalFilterFields({ draft, setSpec, className = "" }) {
  const { t } = useI18n();
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <div className="label-caps mb-3">{t("realestate.filters.amenitiesLabel")}</div>
        <MultiPillGroup
          values={draft.specs?.["Удобства"] || ""}
          options={DAILY_AMENITY_OPTIONS}
          onChange={(value) => setSpec("Удобства", value)}
        />
        <p className="mt-2 text-[11px] text-ink-400">
          {t("realestate.filters.multiSelectHint")}
        </p>
      </div>

      <div>
        <div className="label-caps mb-3">{t("realestate.filters.balconyLabel")}</div>
        <ChipGroup
          value={draft.specs?.["Балкон"] || ""}
          options={DAILY_BALCONY_OPTIONS}
          onChange={(value) => setSpec("Балкон", value)}
        />
      </div>

      <div>
        <div className="label-caps mb-3">{t("realestate.filters.petsLabel")}</div>
        <ChipGroup
          value={draft.specs?.["Животные"] || ""}
          options={DAILY_PETS_OPTIONS}
          onChange={(value) => setSpec("Животные", value)}
        />
      </div>

      <div>
        <div className="label-caps mb-3">{t("realestate.filters.smokingLabel")}</div>
        <ChipGroup
          value={draft.specs?.["Курение"] || ""}
          options={DAILY_SMOKING_OPTIONS}
          onChange={(value) => setSpec("Курение", value)}
        />
      </div>
    </div>
  );
}
