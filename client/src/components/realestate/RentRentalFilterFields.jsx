import React from "react";
import {
  RENT_FURNITURE_OPTIONS,
  RENT_APPLIANCE_OPTIONS,
  RENT_UTILITIES_OPTIONS,
  RENT_INTERNET_OPTIONS,
  RENT_BALCONY_OPTIONS,
  DAILY_PETS_OPTIONS,
  DAILY_SMOKING_OPTIONS,
  RENT_CHILDREN_OPTIONS,
  RENT_TERM_OPTIONS,
  RENT_DEPOSIT_OPTIONS,
} from "../../data/realEstate";
import MultiPillGroup from "../filters/MultiPillGroup";
import FilterChipGroup, { FilterChipSubGroup } from "./FilterChipGroup";
import { Checkbox } from "../../ui";

export default function RentRentalFilterFields({
  draft,
  setSpec,
  onSellerTypeChange,
  showSellerFilters = false,
  className = "",
}) {
  const appliancesLabelId = React.useId();

  return (
    <div className={`space-y-4 ${className}`}>
      <FilterChipGroup
        label="Мебель"
        value={draft.specs?.["Мебель"] || ""}
        options={RENT_FURNITURE_OPTIONS}
        onChange={(value) => setSpec("Мебель", value)}
      />

      <div>
        <div id={appliancesLabelId} className="label-caps mb-3">
          Бытовая техника
        </div>
        <div role="group" aria-labelledby={appliancesLabelId}>
          <MultiPillGroup
            values={draft.specs?.["Техника"] || ""}
            options={RENT_APPLIANCE_OPTIONS}
            onChange={(value) => setSpec("Техника", value)}
          />
        </div>
        <p className="mt-2 text-xs text-ink-400">
          Можно выбрать несколько — покажем квартиры со всей выбранной техникой
        </p>
      </div>

      <FilterChipGroup
        label="Коммунальные"
        value={draft.specs?.["Коммунальные"] || ""}
        options={RENT_UTILITIES_OPTIONS}
        onChange={(value) => setSpec("Коммунальные", value)}
      />

      <FilterChipGroup
        label="Интернет"
        value={draft.specs?.["Интернет"] || ""}
        options={RENT_INTERNET_OPTIONS}
        onChange={(value) => setSpec("Интернет", value)}
      />

      <div>
        <div className="label-caps mb-3">Правила проживания</div>
        <div className="space-y-3">
          <FilterChipSubGroup
            label="Балкон"
            value={draft.specs?.["Балкон"] || ""}
            options={RENT_BALCONY_OPTIONS}
            onChange={(value) => setSpec("Балкон", value)}
          />
          <FilterChipSubGroup
            label="Животные"
            value={draft.specs?.["Животные"] || ""}
            options={DAILY_PETS_OPTIONS}
            onChange={(value) => setSpec("Животные", value)}
          />
          <FilterChipSubGroup
            label="Курение"
            value={draft.specs?.["Курение"] || ""}
            options={DAILY_SMOKING_OPTIONS}
            onChange={(value) => setSpec("Курение", value)}
          />
          <FilterChipSubGroup
            label="Дети"
            value={draft.specs?.["Дети"] || ""}
            options={RENT_CHILDREN_OPTIONS}
            onChange={(value) => setSpec("Дети", value)}
          />
        </div>
      </div>

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

      {showSellerFilters ? (
        <div className="space-y-1 border-t border-ink-200 pt-3">
          <Checkbox
            label="От собственника"
            checked={draft.sellerType === "private"}
            onChange={() =>
              onSellerTypeChange?.(draft.sellerType === "private" ? "" : "private")
            }
            className="min-h-[2.75rem] rounded-xl px-1 py-2.5 hover:bg-mist-50"
          />
          <Checkbox
            label="Без комиссии"
            checked={draft.sellerType === "company"}
            onChange={() =>
              onSellerTypeChange?.(draft.sellerType === "company" ? "" : "company")
            }
            className="min-h-[2.75rem] rounded-xl px-1 py-2.5 hover:bg-mist-50"
          />
        </div>
      ) : null}
    </div>
  );
}
