import React from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { buildRealEstateListingUrl } from "../../lib/realEstate";
import { REAL_ESTATE_CITIES, getDistrictsForCity } from "../../data/realEstate";
import { useI18n } from "../../i18n";
import { cn } from "../../ui";

export default function RealEstateDistrictBar({
  city,
  onCityChange,
  totalCount = 0,
  activeDistrict = "",
  filterContext = {},
}) {
  const { t } = useI18n();
  const districts = getDistrictsForCity(city);
  const headingId = React.useId();

  const buildDistrictUrl = (district = "") => {
    const specs = { ...(filterContext.specs || {}) };
    if (district) {
      specs["Район"] = district;
    } else {
      delete specs["Район"];
    }

    return buildRealEstateListingUrl({
      city: filterContext.city || city,
      dealType: filterContext.dealType || specs["Тип сделки"] || "",
      subcategory: filterContext.subcategory || "",
      rooms: filterContext.rooms || specs["Комнат"] || "",
      guests: filterContext.guests || "",
      checkIn: filterContext.checkIn || "",
      checkOut: filterContext.checkOut || "",
      priceFrom: filterContext.priceFrom || "",
      priceTo: filterContext.priceTo || "",
      specs,
    });
  };

  return (
    <section aria-labelledby={headingId} className="surface-panel space-y-4 p-4 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="icon-box-sun h-10 w-10 shrink-0">
            <MapPin size={18} aria-hidden="true" />
          </span>

          <div>
            <h2 id={headingId} className="text-lg font-bold text-ink-900">
              {t("realestate.cityAndDistricts")}
            </h2>
            <p className="mt-0.5 text-sm text-ink-400">
              {totalCount > 0
                ? t("realestate.cityAndDistrictsHint", {
                    count: totalCount.toLocaleString("ru-RU"),
                  })
                : t("realestate.cityAndDistrictsEmpty")}
            </p>
          </div>
        </div>

        <div role="group" aria-label={t("realestate.city")} className="segmented shrink-0">
          {REAL_ESTATE_CITIES.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={city === item}
              onClick={() => onCityChange?.(item)}
              className={cn("segmented-item", city === item && "segmented-item-active")}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {districts.length > 0 && (
        <div className="scroll-fade-x scrollbar-hide flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
          <Link
            to={buildDistrictUrl("")}
            aria-current={!activeDistrict ? "true" : undefined}
            className={cn("chip filter-chip snap-start", !activeDistrict && "chip-active")}
          >
            {t("realestate.allCity", { city })}
          </Link>

          {districts.map((district) => (
            <Link
              key={district}
              to={buildDistrictUrl(district)}
              aria-current={activeDistrict === district ? "true" : undefined}
              className={cn(
                "chip filter-chip snap-start",
                activeDistrict === district && "chip-active"
              )}
            >
              {district}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
