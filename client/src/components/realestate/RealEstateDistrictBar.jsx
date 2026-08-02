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
    <section className="rounded-2xl border bg-white p-4 md:p-5 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-sun-50 grid place-items-center shrink-0">
            <MapPin size={18} className="text-sun" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Город и районы</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {totalCount > 0
                ? `${totalCount.toLocaleString("ru-RU")} объявлений · цены в сомони`
                : "Душанбе и Худжанд — выберите район"}
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-xl border bg-slate-50 p-1 gap-1 shrink-0">
          {REAL_ESTATE_CITIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onCityChange?.(item)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                city === item
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {districts.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory">
          <Link
            to={buildDistrictUrl("")}
            className={`snap-start shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold border transition ${
              !activeDistrict
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 hover:border-sun/40 hover:text-sun"
            }`}
          >
            Весь {city}
          </Link>

          {districts.map((district) => (
            <Link
              key={district}
              to={buildDistrictUrl(district)}
              className={`snap-start shrink-0 px-3.5 py-2 rounded-full text-xs font-medium border transition ${
                activeDistrict === district
                  ? "bg-lagoon-50 text-lagoon-800 border-lagoon/30"
                  : "bg-white text-slate-700 hover:border-sun/40 hover:text-sun"
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
