import React from "react";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import RealEstateCitySelect from "../RealEstateCitySelect";
import RealEstateDateRangePicker from "./RealEstateDateRangePicker";
import RealEstateGuestsPicker from "./RealEstateGuestsPicker";
import { useI18n } from "../../i18n";
import { cn } from "../../ui";

export default function RealEstateDailySearchBar({
  city,
  onCityChange,
  checkIn,
  checkOut,
  onDatesChange,
  guests,
  onGuestsChange,
  submitLabel,
  onMoreFilters,
  hasMoreFilters = false,
  hideCity = false,
}) {
  const { t } = useI18n();
  const cityLabelId = React.useId();

  const gridCols = hideCity
    ? "md:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)_auto]"
    : "md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_auto]";

  return (
    <div className="space-y-3 text-ink-900">
      <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-xs">
        <div className={cn("grid grid-cols-1", gridCols, "md:items-stretch")}>
          {!hideCity && (
            <div className="relative flex min-h-[3.25rem] min-w-0 flex-col justify-center border-b border-ink-200 px-4 py-3 md:border-b-0 md:border-r">
              <span id={cityLabelId} className="mb-0.5 text-xs font-medium text-ink-500">
                {t("realestate.whereTo")}
              </span>

              <div className="relative flex min-h-[20px] items-center">
                <RealEstateCitySelect
                  value={city}
                  aria-labelledby={cityLabelId}
                  onChange={(e) => onCityChange?.(e.target.value)}
                  className="w-full cursor-pointer appearance-none border-0 bg-transparent py-0 pl-0 pr-7 text-sm font-semibold text-ink-900 outline-none focus:ring-0"
                />
                <ChevronDown
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-ink-400"
                />
              </div>
            </div>
          )}

          <div className="min-w-0 border-b border-ink-200 md:border-b-0 md:border-r">
            <RealEstateDateRangePicker
              variant="inline"
              checkIn={checkIn}
              checkOut={checkOut}
              onChange={onDatesChange}
            />
          </div>

          <div className="min-w-0 border-b border-ink-200 md:border-b-0 md:border-r">
            <RealEstateGuestsPicker
              variant="inline"
              value={guests}
              onChange={onGuestsChange}
            />
          </div>

          <button
            type="submit"
            className="flex min-h-[3.25rem] w-full shrink-0 items-center justify-center gap-2 bg-sun-500 px-6
                       text-sm font-bold text-white transition-colors hover:bg-sun-600
                       md:w-auto md:min-w-[148px]"
          >
            <Search size={18} aria-hidden="true" />
            {submitLabel || t("realestate.show")}
          </button>
        </div>
      </div>

      {onMoreFilters && (
        <button
          type="button"
          onClick={onMoreFilters}
          className={cn(
            "chip filter-chip font-semibold",
            hasMoreFilters && "border-sun-300 bg-sun-50 text-sun-800"
          )}
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          {t("realestate.moreFilters")}
        </button>
      )}
    </div>
  );
}
