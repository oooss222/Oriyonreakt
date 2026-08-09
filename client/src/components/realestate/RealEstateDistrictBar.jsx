import React from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { buildRealEstateListingUrl } from "../../lib/realEstate";
import { REAL_ESTATE_CITIES, getDistrictsForCity } from "../../data/realEstate";

export default function RealEstateDistrictBar({
  city,
  onCityChange,
  totalCount = 0,
  activeDistrict = "",
  filterContext = {},
}) {
  const districts = getDistrictsForCity(city);

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
    <section className="filter-panel p-4 md:p-5 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl icon-box-sun shrink-0">
            <MapPin size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink">Город и районы</h2>
            <p className="text-sm text-ink-400 mt-0.5">
              {totalCount > 0
                ? `${totalCount.toLocaleString("ru-RU")} объявлений · цены в сомони`
                : "Душанбе и Худжанд — выберите район"}
            </p>
          </div>
        </div>

        <div className="segmented shrink-0">
          {REAL_ESTATE_CITIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onCityChange?.(item)}
              className={`segmented-item ${
                city === item ? "segmented-item-active" : ""
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {districts.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide scroll-fade-x snap-x snap-mandatory">
          <Link
            to={buildDistrictUrl("")}
            className={`chip snap-start ${!activeDistrict ? "chip-active" : ""}`}
          >
            Весь {city}
          </Link>

          {districts.map((district) => (
            <Link
              key={district}
              to={buildDistrictUrl(district)}
              className={`chip snap-start ${
                activeDistrict === district ? "chip-active" : ""
              }`}
            >
              {district}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
