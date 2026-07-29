import React from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Home,
  LandPlot,
  Store,
  Car,
  DoorOpen,
  Sparkles,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
import RealEstateSearchHero from "../components/RealEstateSearchHero";
import RealEstateListingCard from "../components/RealEstateListingCard";
import ListingGridSkeleton from "../components/ListingGridSkeleton";
import AdSlot from "../components/AdSlot";
import Breadcrumbs from "../components/Breadcrumbs";
import { usePageMeta } from "../lib/usePageMeta";
import { api } from "../lib/api";
import { sortListingsByPromotion } from "../lib/listingSort";
import {
  REAL_ESTATE_CAT,
  SUBCATEGORY_META,
  QUICK_COLLECTIONS,
  REAL_ESTATE_CITIES,
  DUSHANBE_DISTRICTS,
} from "../data/realEstate";
import { buildRealEstateListingUrl } from "../lib/realEstate";

const SUB_ICONS = {
  building: Building2,
  apartment: Building2,
  door: DoorOpen,
  home: Home,
  land: LandPlot,
  garage: Car,
  commercial: Store,
};

export default function RealEstate() {
  const [stats, setStats] = React.useState({ total: 0, bySubcategory: {} });
  const [listings, setListings] = React.useState([]);
  const [premium, setPremium] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [city, setCity] = React.useState("Душанбе");
  const [developments, setDevelopments] = React.useState([]);

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
          api.listingStats(REAL_ESTATE_CAT),
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
    <div className="container mx-auto px-4 py-6 space-y-8">
      <Breadcrumbs
        items={[
          { label: "Главная", to: "/" },
          { label: "Недвижимость" },
        ]}
      />

      <RealEstateSearchHero initialCity={city} />

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {Object.entries(SUBCATEGORY_META).map(([name, meta]) => {
          const Icon = SUB_ICONS[meta.icon] || Building2;
          const count = stats.bySubcategory?.[name] || 0;

          return (
            <Link
              key={name}
              to={buildRealEstateListingUrl({
                subcategory: name,
                city,
              })}
              className={`rounded-2xl border p-4 transition hover:shadow-md hover:border-sun/30 ${
                meta.highlight ? "bg-sun-50/50 border-sun/20" : "bg-white"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white border grid place-items-center mb-3 text-sun">
                <Icon size={20} />
              </div>
              <div className="font-semibold text-sm text-slate-900 leading-tight">
                {name}
              </div>
              <div className="text-xs text-slate-500 mt-1">{meta.desc}</div>
              {count > 0 && (
                <div className="text-xs font-bold text-sun mt-2">{count} объяв.</div>
              )}
            </Link>
          );
        })}
      </section>

      <section className="rounded-3xl border bg-white p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold">Город</h2>
            <p className="text-sm text-slate-500">
              Всего объявлений: {stats.total}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {REAL_ESTATE_CITIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCity(item)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                  city === item
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white hover:bg-slate-50"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {city === "Душанбе" && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {DUSHANBE_DISTRICTS.map((district) => (
              <Link
                key={district}
                to={buildRealEstateListingUrl({
                  city: "Душанбе",
                  specs: { Район: district },
                })}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-50 border hover:bg-slate-100 transition"
              >
                {district}
              </Link>
            ))}
          </div>
        )}
      </section>

      {premium.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="text-sun" size={20} />
              <h2 className="text-xl font-bold">Премиум объявления</h2>
            </div>
            <Link
              to={buildRealEstateListingUrl({ city })}
              className="text-sm font-semibold text-sun hover:text-sun-600 inline-flex items-center gap-1"
            >
              Все
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-3">
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
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Новостройки и ЖК</h2>
            <Link
              to={buildRealEstateListingUrl({ city, subcategory: "Новостройки" })}
              className="text-sm font-semibold text-sun hover:text-sun-600 inline-flex items-center gap-1"
            >
              Все новостройки
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {developments.map((item) => (
              <Link
                key={item.id}
                to={`/realestate/zhk/${item.slug}`}
                className="rounded-3xl border bg-white overflow-hidden hover:shadow-lg transition"
              >
                <div className="aspect-[16/10] bg-slate-100">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-slate-300">
                      <Building2 size={40} />
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-1">
                  <div className="text-xs text-sun-700 font-semibold">
                    {item.developer || "Застройщик"}
                  </div>
                  <div className="font-bold text-slate-900">{item.name}</div>
                  <div className="text-sm text-slate-500">
                    {item.district ? `${item.district}, ` : ""}
                    {item.city}
                  </div>
                  {item.completionDate && (
                    <div className="text-xs text-slate-400">Сдача: {item.completionDate}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Подборки</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_COLLECTIONS.map((collection) => (
            <Link
              key={collection.title}
              to={buildRealEstateListingUrl({
                ...collection.params,
                city: collection.params.location || city,
              })}
              className="px-4 py-2 rounded-full border bg-white hover:bg-slate-900 hover:text-white text-sm font-medium transition"
            >
              {collection.title}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Свежие объявления в {city}</h2>
          <Link
            to={buildRealEstateListingUrl({ city })}
            className="text-sm font-semibold text-sun hover:text-sun-600 inline-flex items-center gap-1"
          >
            Смотреть все
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading && <ListingGridSkeleton count={8} />}

        {!loading && listings.length === 0 && (
          <div className="rounded-3xl border border-dashed p-10 text-center">
            <Building2 className="mx-auto text-slate-300 mb-3" size={40} />
            <div className="font-semibold text-slate-800">
              Пока нет объявлений в этой категории
            </div>
            <p className="text-sm text-slate-500 mt-2 mb-4">
              Станьте первым — разместите квартиру, дом или участок.
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

      <section className="rounded-3xl bg-gradient-to-br from-lagoon-700 to-ink-800 text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Продайте или сдайте недвижимость</h2>
          <p className="text-white/75 mt-2 max-w-xl text-sm">
            Подробные характеристики, фото, район и цена за м² — ваше объявление
            увидят тысячи покупателей и арендаторов.
          </p>
        </div>
        <Link
          to={`/add?cat=${REAL_ESTATE_CAT}`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white text-lagoon-800 font-bold hover:bg-sun-50 transition shrink-0"
        >
          <PlusCircle size={18} />
          Разместить объявление
        </Link>
      </section>
    </div>
  );
}
