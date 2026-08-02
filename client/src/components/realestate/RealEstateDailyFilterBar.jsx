import React from "react";
import { SlidersHorizontal, X } from "lucide-react";
import {
  DAILY_HOUSING_TYPES,
  REAL_ESTATE_DAILY_PRESETS,
  GUEST_OPTIONS,
  formatGuestLabel,
} from "../../data/realEstate";
import { formatPriceInput } from "../../data/specOptions";

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
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={onOpenFilters}
          className="chip shrink-0 font-semibold"
        >
          <SlidersHorizontal size={15} />
          Фильтры
          {activeFilterCount > 0 && (
            <span className="min-w-[1.15rem] h-5 px-1 rounded-full bg-sun text-white text-[11px] grid place-items-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {DAILY_HOUSING_TYPES.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() =>
              onSubcategoryChange?.(subcategory === item.value ? "" : item.value)
            }
            className={`chip ${subcategory === item.value ? "chip-active" : ""}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="label-caps">Цена за сутки</span>

        {pricePresets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() =>
              onPricePreset?.({
                from: preset.from ? String(preset.from) : "",
                to: preset.to ? String(preset.to) : "",
              })
            }
            className={`chip ${
              activePricePreset?.label === preset.label ? "chip-active" : ""
            }`}
          >
            {preset.label.replace("Любая", "").trim() || preset.label}
          </button>
        ))}

        {(priceFrom || priceTo) && !activePricePreset && (
          <button
            type="button"
            onClick={() => onPricePreset?.({ from: "", to: "" })}
            className="chip chip-active"
          >
            {priceFrom && priceTo
              ? `${formatPriceInput(priceFrom)} – ${formatPriceInput(priceTo)} с.`
              : priceFrom
                ? `от ${formatPriceInput(priceFrom)} с.`
                : `до ${formatPriceInput(priceTo)} с.`}
            <X size={13} className="ml-1 inline" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="label-caps">Гости</span>

        <button
          type="button"
          onClick={() => onGuestsChange?.("")}
          className={`chip ${!guests ? "chip-active" : ""}`}
        >
          Любое
        </button>

        {GUEST_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onGuestsChange?.(guests === option ? "" : option)}
            className={`chip ${guests === option ? "chip-active" : ""}`}
          >
            {formatGuestLabel(option)}
          </button>
        ))}
      </div>
    </div>
  );
}
