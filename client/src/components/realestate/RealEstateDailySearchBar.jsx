import React from "react";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import RealEstateCitySelect from "../RealEstateCitySelect";
import RealEstateDateRangePicker from "./RealEstateDateRangePicker";
import RealEstateGuestsPicker from "./RealEstateGuestsPicker";

export default function RealEstateDailySearchBar({
  city,
  onCityChange,
  checkIn,
  checkOut,
  onDatesChange,
  guests,
  onGuestsChange,
  submitLabel = "Показать",
  onMoreFilters,
  hasMoreFilters = false,
  hideCity = false,
}) {
  const gridCols = hideCity
    ? "md:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)_auto]"
    : "md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_auto]";

  return (
    <div className="space-y-3 text-slate-900">
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5">
        <div className={`grid grid-cols-1 ${gridCols} md:items-stretch`}>
          {!hideCity && (
            <div className="group relative flex min-w-0 flex-col justify-center border-b border-slate-200 px-4 py-3.5 transition hover:bg-slate-50/80 md:border-b-0 md:border-r">
              <span className="mb-0.5 text-xs font-medium text-slate-500">
                Куда хотите поехать?
              </span>
              <div className="relative flex min-h-[20px] items-center">
                <RealEstateCitySelect
                  value={city}
                  onChange={(e) => onCityChange?.(e.target.value)}
                  className="w-full cursor-pointer appearance-none border-0 bg-transparent py-0 pl-0 pr-7 text-sm font-semibold text-slate-900 outline-none focus:ring-0"
                />
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>
          )}

          <div className="min-w-0 border-b border-slate-200 md:border-b-0 md:border-r">
            <RealEstateDateRangePicker
              variant="inline"
              checkIn={checkIn}
              checkOut={checkOut}
              onChange={onDatesChange}
            />
          </div>

          <div className="min-w-0 border-b border-slate-200 md:border-b-0 md:border-r">
            <RealEstateGuestsPicker
              variant="inline"
              value={guests}
              onChange={onGuestsChange}
            />
          </div>

          <button
            type="submit"
            className="flex min-h-[52px] w-full shrink-0 items-center justify-center gap-2 bg-sun px-6 text-sm font-bold text-white transition hover:bg-sun-600 md:w-auto md:min-w-[148px] md:rounded-none md:rounded-r-2xl"
          >
            <Search size={18} />
            {submitLabel}
          </button>
        </div>
      </div>

      {onMoreFilters && (
        <button
          type="button"
          onClick={onMoreFilters}
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
            hasMoreFilters
              ? "border-sun/40 bg-sun-50 text-sun-800"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <SlidersHorizontal size={16} />
          Ещё фильтры
        </button>
      )}
    </div>
  );
}
