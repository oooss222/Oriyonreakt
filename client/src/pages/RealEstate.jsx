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
import RealEstateQuickCollections from "../components/realestate/RealEstateQuickCollections";
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

        setStats(statsData || { total: 0, bySubcategory: {} });
        setListings(Array.isArray(allListings) ? allListings : []);
        setPremium(sortListingsByPromotion(Array.isArray(promoted) ? promoted : []));
      } catch {
        if (active) {
          setStats({ total: 0, bySubcategory: {} });
          setListings([]);
          setPremium([]);
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

      <RealEstateQuickCollections city={city} className="px-0.5" />

      {compareCount > 0 && (
        <Link
          to="/realestate/sravnenie"
          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-900/10 bg-slate-900 px-4 py-3.5 text-white hover:bg-slate-800 transition shadow-sm"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <Scale size={18} className="text-sun" />
            Сравнение объектов · {compareCount}/{COMPARE_MAX}
          </span>
          <ArrowRight size={18} className="text-white/70" />
        </Link>
      )}

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

        {!loading && listings.length === 0 && (
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
