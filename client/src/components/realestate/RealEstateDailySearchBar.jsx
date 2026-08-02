import React from "react";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import RealEstateCitySelect from "../RealEstateCitySelect";
import RealEstateDateRangePicker from "./RealEstateDateRangePicker";
import RealEstateGuestsPicker from "./RealEstateGuestsPicker";

function InlineDivider() {
  return <div className="hidden shrink-0 self-stretch w-px bg-slate-200 lg:block" aria-hidden="true" />;
}

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
  return (
    <div className="space-y-3 text-slate-900">
      <div className="overflow-visible rounded-2xl border border-slate-200/90 bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5">
        <div className="flex flex-col lg:flex-row lg:items-stretch">
          {!hideCity && (
          <div className="group relative flex min-w-0 flex-1 flex-col justify-center px-4 py-3.5 transition hover:bg-slate-50/80 lg:max-w-[240px]">
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

          {!hideCity && <InlineDivider />}

          <div className="min-w-0 flex-[1.15] border-t border-slate-200 lg:border-t-0">
            <RealEstateDateRangePicker
              variant="inline"
              checkIn={checkIn}
              checkOut={checkOut}
              onChange={onDatesChange}
            />
          </div>

          <InlineDivider />

          <div className="min-w-0 flex-1 border-t border-slate-200 lg:border-t-0">
            <RealEstateGuestsPicker
              variant="inline"
              value={guests}
              onChange={onGuestsChange}
            />
          </div>

          <button
            type="submit"
            className="mobile-btn hidden min-h-[52px] shrink-0 items-center justify-center gap-2 bg-sun px-6 text-sm font-bold text-white transition hover:bg-sun-600 lg:flex lg:min-w-[148px] lg:rounded-none lg:rounded-r-2xl"
          >
            <Search size={18} />
            {submitLabel}
          </button>
        </div>

        <button
          type="submit"
          className="mobile-btn flex min-h-[48px] w-full items-center justify-center gap-2 border-t border-slate-200 bg-sun text-sm font-bold text-white transition hover:bg-sun-600 lg:hidden"
        >
          <Search size={18} />
          {submitLabel}
        </button>
      </div>

      {onMoreFilters && (
        <button
          type="button"
          onClick={onMoreFilters}
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
            hasMoreFilters
              ? "border-sun/40 bg-sun-50 text-sun-800"
              : "border-white/20 bg-white/10 text-white hover:bg-white/15"
          }`}
        >
          <SlidersHorizontal size={16} />
          Ещё фильтры
        </button>
      )}
    </div>
  );
}
