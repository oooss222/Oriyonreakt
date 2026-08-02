import React from "react";
import { SlidersHorizontal, X } from "lucide-react";
import {
  DAILY_HOUSING_TYPES,
  REAL_ESTATE_DAILY_PRESETS,
  GUEST_OPTIONS,
  formatGuestLabel,
} from "../../data/realEstate";
import { formatPriceInput } from "../../data/specOptions";

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 h-9 px-3.5 rounded-full border text-sm font-medium transition ${
        active
          ? "border-sun bg-sun-50 text-sun-800"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

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
          className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
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
          <Chip
            key={item.value}
            active={subcategory === item.value}
            onClick={() =>
              onSubcategoryChange?.(subcategory === item.value ? "" : item.value)
            }
          >
            {item.label}
          </Chip>
        ))}

      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Цена за сутки
        </span>

        {pricePresets.map((preset) => (
          <Chip
            key={preset.label}
            active={activePricePreset?.label === preset.label}
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
            onClick={() => onPricePreset?.({ from: "", to: "" })}
          >
            {priceFrom && priceTo
              ? `${formatPriceInput(priceFrom)} – ${formatPriceInput(priceTo)} с.`
              : priceFrom
                ? `от ${formatPriceInput(priceFrom)} с.`
                : `до ${formatPriceInput(priceTo)} с.`}
            <X size={13} className="ml-1 inline" />
          </Chip>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Гости
        </span>

        <Chip active={!guests} onClick={() => onGuestsChange?.("")}>
          Любое
        </Chip>

        {GUEST_OPTIONS.map((option) => (
          <Chip
            key={option}
            active={guests === option}
            onClick={() => onGuestsChange?.(guests === option ? "" : option)}
          >
            {formatGuestLabel(option)}
          </Chip>
        ))}
      </div>
    </div>
  );
}
