import React from "react";
import { Link } from "react-router-dom";
import { Building2, ArrowRight } from "lucide-react";
import { buildRealEstateCategoryUrl } from "../../lib/realEstate";

export default function RealEstateNovostroykiSection({
  city = "Душанбе",
  listingCount = 0,
  developments = [],
}) {
  const listingsUrl = buildRealEstateCategoryUrl(city, "Новостройки");

  return (
    <section className="rounded-2xl border border-sun/25 bg-gradient-to-br from-sun-50/90 via-white to-white p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-10 h-10 rounded-xl bg-sun text-white grid place-items-center shrink-0">
              <Building2 size={20} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Новостройки</h2>
              <p className="text-sm text-slate-500">
                Отдельный раздел — квартиры от застройщиков и ЖК в {city}
              </p>
            </div>
          </div>

          {listingCount > 0 && (
            <p className="text-sm text-slate-600 mt-1">
              {listingCount.toLocaleString("ru-RU")} объявлений в каталоге
              {developments.length > 0 &&
                ` · ${developments.length} жилых комплексов`}
            </p>
          )}
        </div>

        <Link
          to={listingsUrl}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-sun text-white text-sm font-semibold hover:bg-sun-600 transition shrink-0"
        >
          Смотреть новостройки
          <ArrowRight size={16} />
        </Link>
      </div>

      {developments.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {developments.slice(0, 6).map((item) => (
            <Link
              key={item.id}
              to={`/realestate/zhk/${item.slug}`}
              className="shrink-0 min-w-[9rem] max-w-[11rem] rounded-xl border bg-white p-3 hover:border-sun/40 hover:shadow-sm transition"
            >
              <div className="font-semibold text-sm text-slate-900 line-clamp-2">
                {item.name}
              </div>
              {item.district && (
                <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                  {item.district}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
