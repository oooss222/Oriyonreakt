import React from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Scale,
} from "lucide-react";
import { readCompareIds, COMPARE_MAX } from "../lib/compareListings";
import RealEstateSearchHero from "../components/RealEstateSearchHero";
import RealEstateListingCard from "../components/RealEstateListingCard";
import ListingGridSkeleton from "../components/ListingGridSkeleton";
import AdSlot from "../components/AdSlot";
import Breadcrumbs from "../components/Breadcrumbs";
import RealEstateNovostroykiSection from "../components/realestate/RealEstateNovostroykiSection";
import RealEstateSectionHeader from "../components/realestate/RealEstateSectionHeader";
import RealEstateCategoryGrid from "../components/realestate/RealEstateCategoryGrid";
import RealEstateDistrictBar from "../components/realestate/RealEstateDistrictBar";
import { usePageMeta } from "../lib/usePageMeta";
import { api } from "../lib/api";
import { sortListingsByPromotion } from "../lib/listingSort";
import { REAL_ESTATE_CAT } from "../data/realEstate";
import { buildRealEstateListingUrl, buildRealEstateCategoryUrl } from "../lib/realEstate";

export default function RealEstate() {
  const [stats, setStats] = React.useState({ total: 0, bySubcategory: {} });
  const [listings, setListings] = React.useState([]);
  const [premium, setPremium] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [city, setCity] = React.useState("Душанбе");
  const [developments, setDevelopments] = React.useState([]);
  const [compareCount, setCompareCount] = React.useState(() => readCompareIds().length);
  const [fallbackListings, setFallbackListings] = React.useState([]);

  React.useEffect(() => {
    const sync = () => setCompareCount(readCompareIds().length);
    window.addEventListener("oriyon:compare-change", sync);
    return () => window.removeEventListener("oriyon:compare-change", sync);
  }, []);

  React.useEffect(() => {
    api
      .developments(city)
      .then((rows) => setDevelopments(Array.isArray(rows) ? rows : []))
      .catch(() => setDevelopments([]));
  }, [city]);

  React.useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);

        const [statsData, allListings, promoted] = await Promise.all([
          api.listingStats(REAL_ESTATE_CAT, city),
          api.listings({
            cat: REAL_ESTATE_CAT,
            limit: 24,
            sort: "new",
            location: city,
          }),
          api.listings({
            cat: REAL_ESTATE_CAT,
            limit: 12,
            sort: "promoted",
            location: city,
          }),
        ]);

        if (!active) return;

        const listingRows = Array.isArray(allListings) ? allListings : [];

        setStats(statsData || { total: 0, bySubcategory: {} });
        setListings(listingRows);
        setPremium(sortListingsByPromotion(Array.isArray(promoted) ? promoted : []));

        if (listingRows.length === 0) {
          const wider = await api.listings({
            cat: REAL_ESTATE_CAT,
            limit: 8,
            sort: "new",
          });
          if (active) {
            setFallbackListings(Array.isArray(wider) ? wider : []);
          }
        } else if (active) {
          setFallbackListings([]);
        }
      } catch {
        if (active) {
          setStats({ total: 0, bySubcategory: {} });
          setListings([]);
          setPremium([]);
          setFallbackListings([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [city]);

  usePageMeta({
    title: "Недвижимость в Таджикистане — купить и снять | Oriyon.store",
    description:
      "Квартиры, дома, участки и коммерческая недвижимость в Душанбе и по всему Таджикистану. Фильтры, цена за м², новостройки и аренда на Oriyon.store.",
    url: typeof window !== "undefined" ? window.location.href : undefined,
  });

  return (
    <div className="container mx-auto px-3 sm:px-4 py-5 sm:py-8 space-y-8 max-w-6xl">
      <Breadcrumbs
        items={[
          { label: "Главная", to: "/" },
          { label: "Недвижимость" },
        ]}
      />

      <RealEstateSearchHero
        initialCity={city}
        totalCount={stats.total}
        onCityChange={setCity}
      />

      <RealEstateNovostroykiSection
        city={city}
        listingCount={stats.bySubcategory?.["Новостройки"] || 0}
        developments={developments}
      />

      <Link
        to="/realestate/sravnenie"
        className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 transition shadow-sm ${
          compareCount > 0
            ? "border-slate-900/10 bg-slate-900 text-white hover:bg-slate-800"
            : "border-slate-200 bg-white text-slate-900 hover:border-sun/30 hover:bg-sun-50/30"
        }`}
      >
        <span className="inline-flex items-center gap-3 min-w-0">
          <span
            className={`grid place-items-center w-10 h-10 rounded-xl shrink-0 ${
              compareCount > 0 ? "bg-white/10 text-sun" : "bg-sun-50 text-sun"
            }`}
          >
            <Scale size={20} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">
              Сравнение объектов
              {compareCount > 0 ? ` · ${compareCount}/${COMPARE_MAX}` : ""}
            </span>
            <span
              className={`block text-xs mt-0.5 truncate ${
                compareCount > 0 ? "text-white/60" : "text-slate-500"
              }`}
            >
              До {COMPARE_MAX} объявлений Oriyon и других площадок
            </span>
          </span>
        </span>
        <ArrowRight
          size={18}
          className={compareCount > 0 ? "text-white/70 shrink-0" : "text-slate-400 shrink-0"}
        />
      </Link>

      <div className="space-y-3">
        <RealEstateSectionHeader
          title="Категории"
          description="Выберите тип недвижимости для быстрого перехода к объявлениям"
        />
        <RealEstateCategoryGrid city={city} statsBySubcategory={stats.bySubcategory} />
      </div>

      <RealEstateDistrictBar
        city={city}
        onCityChange={setCity}
        totalCount={stats.total}
      />

      {premium.length > 0 && (
        <section className="space-y-1">
          <RealEstateSectionHeader
            icon={Sparkles}
            title="Премиум объявления"
            description={`VIP и TOP в ${city}`}
            actionLabel="Все премиум"
            actionTo={buildRealEstateListingUrl({ city, sort: "promoted" })}
          />

          <div className="grid gap-3 lg:grid-cols-2">
            {premium.slice(0, 6).map((item) => (
              <RealEstateListingCard
                key={item.id || item._id}
                item={item}
                variant="horizontal"
              />
            ))}
          </div>
        </section>
      )}

      <AdSlot placement="home_mid" cat={REAL_ESTATE_CAT} className="rounded-3xl overflow-hidden" />

      {developments.length > 0 && (
        <section>
          <RealEstateSectionHeader
            icon={Building2}
            title="Жилые комплексы"
            description="Карточки застройщиков и проектов"
            actionLabel="Все новостройки"
            actionTo={buildRealEstateCategoryUrl(city, "Новостройки")}
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {developments.map((item) => (
              <Link
                key={item.id}
                to={`/realestate/zhk/${item.slug}`}
                className="group rounded-2xl border bg-white overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-slate-300">
                      <Building2 size={40} />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
                  {item.developer && (
                    <span className="absolute left-3 bottom-3 text-[11px] font-semibold uppercase tracking-wide text-white/90">
                      {item.developer}
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-1">
                  <div className="font-bold text-slate-900 group-hover:text-sun transition">
                    {item.name}
                  </div>
                  <div className="text-sm text-slate-500">
                    {item.district ? `${item.district}, ` : ""}
                    {item.city}
                  </div>
                  {item.completionDate && (
                    <div className="text-xs text-slate-400 pt-1">Сдача: {item.completionDate}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <RealEstateSectionHeader
          title={`Свежие объявления · ${city}`}
          description="Недавно добавленные объекты в выбранном городе"
          actionLabel="Смотреть все"
          actionTo={buildRealEstateListingUrl({ city })}
        />

        {loading && <ListingGridSkeleton count={8} />}

        {!loading && listings.length === 0 && fallbackListings.length === 0 && (
          <div className="rounded-2xl border border-dashed bg-slate-50/50 p-10 text-center">
            <Building2 className="mx-auto text-slate-300 mb-3" size={40} />
            <div className="font-semibold text-slate-800">
              Пока нет объявлений в {city}
            </div>
            <p className="text-sm text-slate-500 mt-2 mb-5 max-w-md mx-auto">
              Станьте первым — разместите квартиру, дом или участок. Объявление появится после
              модерации.
            </p>
            <Link
              to={`/add?cat=${REAL_ESTATE_CAT}`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sun text-white font-semibold hover:bg-sun-600 transition"
            >
              <PlusCircle size={18} />
              Подать объявление
            </Link>
          </div>
        )}

        {!loading && listings.length === 0 && fallbackListings.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              В {city} пока нет объявлений — показываем свежие из других городов.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {fallbackListings.map((item) => (
                <RealEstateListingCard key={item.id || item._id} item={item} />
              ))}
            </div>
          </div>
        )}

        {!loading && listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {listings.map((item) => (
              <RealEstateListingCard key={item.id || item._id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
