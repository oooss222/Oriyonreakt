import React from "react";
import { SlidersHorizontal, X } from "lucide-react";
import {
  DAILY_HOUSING_TYPES,
  REAL_ESTATE_DAILY_PRESETS,
  GUEST_OPTIONS,
  formatGuestLabel,
} from "../../data/realEstate";
import { formatPriceInput } from "../../data/specOptions";
import { useI18n } from "../../i18n";
import { Chip, cn } from "../../ui";

export default function RealEstateDailyFilterBar({
  subcategory = "",
  priceFrom = "",
  priceTo = "",
  guests = "",
  onSubcategoryChange,
  onPricePreset,
  onGuestsChange,
  onOpenFilters,
  activeFilterCount = 0,
}) {
  const { t } = useI18n();
  const priceLabelId = React.useId();
  const guestsLabelId = React.useId();
  const typeLabelId = React.useId();

  const pricePresets = REAL_ESTATE_DAILY_PRESETS.filter(
    (item) => item.from || item.to
  );

  const activePricePreset = pricePresets.find(
    (preset) =>
      String(priceFrom || "") === String(preset.from || "") &&
      String(priceTo || "") === String(preset.to || "")
  );

  return (
    <div className="space-y-3">
      <div className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-1">
        <Chip
          className="filter-chip shrink-0 font-semibold"
          icon={SlidersHorizontal}
          count={activeFilterCount || undefined}
          onClick={onOpenFilters}
        >
          {t("filter.title")}
        </Chip>

        <span id={typeLabelId} className="sr-only">
          {t("realestate.type")}
        </span>

        <div role="group" aria-labelledby={typeLabelId} className="flex shrink-0 gap-2">
          {DAILY_HOUSING_TYPES.map((item) => (
            <Chip
              key={item.value}
              active={subcategory === item.value}
              className="filter-chip"
              onClick={() =>
                onSubcategoryChange?.(subcategory === item.value ? "" : item.value)
              }
            >
              {item.label}
            </Chip>
          ))}
        </div>
      </div>

      <div
        role="group"
        aria-labelledby={priceLabelId}
        className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-1"
      >
        <span id={priceLabelId} className="label-caps">
          {t("realestate.pricePerNight")}
        </span>

        {pricePresets.map((preset) => (
          <Chip
            key={preset.label}
            active={activePricePreset?.label === preset.label}
            className="filter-chip"
            onClick={() =>
              onPricePreset?.({
                from: preset.from ? String(preset.from) : "",
                to: preset.to ? String(preset.to) : "",
              })
            }
          >
            {preset.label.replace("Любая", "").trim() || preset.label}
          </Chip>
        ))}

        {(priceFrom || priceTo) && !activePricePreset && (
          <Chip
            active
            className={cn("filter-chip")}
            onClick={() => onPricePreset?.({ from: "", to: "" })}
          >
            {priceFrom && priceTo
              ? `${formatPriceInput(priceFrom)} – ${formatPriceInput(priceTo)} с.`
              : priceFrom
                ? `от ${formatPriceInput(priceFrom)} с.`
                : `до ${formatPriceInput(priceTo)} с.`}
            <X size={13} aria-hidden="true" />
          </Chip>
        )}
      </div>

      <div
        role="group"
        aria-labelledby={guestsLabelId}
        className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-1"
      >
        <span id={guestsLabelId} className="label-caps">
          {t("realestate.guests")}
        </span>

        <Chip
          active={!guests}
          className="filter-chip"
          onClick={() => onGuestsChange?.("")}
        >
          {t("realestate.any")}
        </Chip>

        {GUEST_OPTIONS.map((option) => (
          <Chip
            key={option}
            active={guests === option}
            className="filter-chip"
            onClick={() => onGuestsChange?.(guests === option ? "" : option)}
          >
            {formatGuestLabel(option)}
          </Chip>
        ))}
      </div>
    </div>
  );
}
