import React from "react";
import { Link } from "react-router-dom";
import ListingCard from "../components/ListingCard";
import RealEstateListingCard from "../components/RealEstateListingCard";
import AdSlot from "../components/AdSlot";
import BusinessPromoBanner from "../components/BusinessPromoBanner";
import { api } from "../lib/api";
import { getDefaultCity } from "../lib/recommendationProfile";
import { CONSENT_EVENT } from "../lib/cookieConsent";
import { sortListingsByPromotion } from "../lib/listingSort";
import { REAL_ESTATE_CAT } from "../data/realEstate";
import {
  PlusCircle,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  TrendingUp,
  BadgeCheck,
  Flame,
  Home as HomeIcon,
  Smartphone,
  Monitor,
  Building2,
} from "lucide-react";

function RealEstateSection({ items }) {
  if (!items?.length) {
    return (
      <AdSlot placement="home_top" className="overflow-hidden rounded-3xl" />
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 icon-box-sun shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="section-title">Недвижимость</h2>
            <div className="text-sm text-ink-400">{items.length} объявлений</div>
          </div>
        </div>

        <Link
          to="/realestate"
          className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-sun-700 hover:text-sun transition"
        >
          Все объявления
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {items.map((ad) => (
          <RealEstateListingCard key={ad.id || ad._id} item={ad} />
        ))}
      </div>
    </section>
  );
}

function HorizontalSection({ title, icon: Icon, items, linkTo = "/listing" }) {
  if (!items?.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-sun-50 grid place-items-center ring-1 ring-sun/15">
            <Icon className="text-sun" size={20} />
          </div>

          <div>
            <h2 className="section-title">{title}</h2>
            <div className="text-sm text-ink-400">{items.length} объявлений</div>
          </div>
        </div>

        <Link
          to={linkTo}
          className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-sun-700 hover:text-sun transition"
        >
          Смотреть все
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {items.map((ad) => (
          <ListingCard
            key={ad.id || ad._id}
            item={ad}
            listings={items}
            trackSource="home"
          />
        ))}
      </div>
    </section>
  );
}

function ListingSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="listing-card animate-pulse"
        >
          <div className="listing-card__media bg-mist-200" />
          <div className="listing-card__body space-y-2">
            <div className="h-5 bg-mist-200 rounded-full w-1/3" />
            <div className="h-4 bg-mist-200 rounded w-5/6" />
            <div className="h-4 bg-mist-200 rounded w-4/6" />
            <div className="flex justify-between pt-2">
              <div className="h-5 bg-mist-200 rounded w-1/3" />
              <div className="h-3 bg-mist-200 rounded w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [forYou, setForYou] = React.useState([]);
  const [recentlyViewed, setRecentlyViewed] = React.useState([]);
  const [personalized, setPersonalized] = React.useState(false);
  const [listings, setListings] = React.useState([]);
  const [realEstateListings, setRealEstateListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    const handleConsent = () => setReloadKey((value) => value + 1);
    window.addEventListener(CONSENT_EVENT, handleConsent);
    return () => window.removeEventListener(CONSENT_EVENT, handleConsent);
  }, []);

  React.useEffect(() => {
    let active = true;

    async function loadListings() {
      try {
        setLoading(true);
        setError("");

        const city = getDefaultCity();

        const [recommendations, catalog, realEstate] = await Promise.all([
          api.homeRecommendations({ city, limit: 20 }).catch(() => null),
          api.listings({
            limit: 50,
            sort: "promoted",
          }),
          api.listings({
            cat: REAL_ESTATE_CAT,
            limit: 8,
            sort: "promoted",
            location: "Душанбе",
          }),
        ]);

        if (active) {
          const catalogList = Array.isArray(catalog) ? catalog : [];

          setListings(catalogList);
          setForYou(
            Array.isArray(recommendations?.blocks?.forYou)
              ? recommendations.blocks.forYou
              : catalogList.slice(0, 20)
          );
          setRecentlyViewed(
            Array.isArray(recommendations?.blocks?.recentlyViewed)
              ? recommendations.blocks.recentlyViewed
              : []
          );
          setPersonalized(Boolean(recommendations?.personalized));
          setRealEstateListings(
            sortListingsByPromotion(Array.isArray(realEstate) ? realEstate : [])
          );
        }
      } catch (e) {
        if (active) {
          setError(e.message || "Не удалось загрузить объявления");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadListings();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const feedPool = React.useMemo(() => {
    const merged = [...forYou, ...listings];
    const seen = new Set();

    return merged.filter((item) => {
      const id = item?.id || item?._id;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [forYou, listings]);

  const sortedListings = React.useMemo(
    () => sortListingsByPromotion(feedPool),
    [feedPool]
  );

  const hotListings = (forYou.length ? forYou : sortedListings).slice(0, 10);

  const electronicsListings = sortedListings
    .filter((item) => item.cat === "electronics")
    .slice(0, 10);

  const phonesListings = sortedListings
    .filter((item) => item.cat === "phones")
    .slice(0, 10);

  const computersListings = sortedListings
    .filter((item) => item.cat === "computers")
    .slice(0, 10);

  const newestListings = sortedListings.slice(0, 10);

  return (
    <div className="page-shell">
      <div className="container mx-auto px-4 py-6 space-y-10">
        {loading && <ListingSkeleton />}

        {!loading && error && (
          <div className="surface-panel p-6 text-center text-red-700 bg-red-50/80">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <RealEstateSection items={realEstateListings} />

            <BusinessPromoBanner />

            {listings.length === 0 ? (
              <div className="surface-panel p-8 text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-sun-50 grid place-items-center mb-3 ring-1 ring-sun/15">
                  <Sparkles className="text-sun" />
                </div>

                <div className="font-display font-semibold text-ink">
                  Пока нет опубликованных объявлений
                </div>

                <p className="text-sm text-ink-400 mt-1">
                  Добавьте объявление, после модерации оно появится здесь.
                </p>

                <Link
                  to="/add"
                  className="btn btn-primary mt-4"
                >
                  <PlusCircle size={18} />
                  Подать объявление
                </Link>
              </div>
            ) : (
              <div className="space-y-10">
            {recentlyViewed.length > 0 && (
              <HorizontalSection
                title="Вы смотрели"
                icon={Eye}
                items={recentlyViewed}
                linkTo="/listing"
              />
            )}

            <HorizontalSection
              title={personalized ? "Подобрано для вас" : "Горящие товары"}
              icon={personalized ? Sparkles : Flame}
              items={hotListings}
              linkTo="/listing"
            />

            <AdSlot placement="home_mid" className="overflow-hidden rounded-3xl" />

            <HorizontalSection
              title="Бытовая техника"
              icon={HomeIcon}
              items={electronicsListings}
              linkTo="/c/electronics"
            />

            <HorizontalSection
              title="Телефоны"
              icon={Smartphone}
              items={phonesListings}
              linkTo="/c/phones"
            />

            <HorizontalSection
              title="Компьютеры"
              icon={Monitor}
              items={computersListings}
              linkTo="/c/computers"
            />

            <HorizontalSection
              title="Новые объявления"
              icon={TrendingUp}
              items={newestListings}
              linkTo="/listing"
            />
          </div>
            )}
          </>
        )}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="surface-panel p-5">
            <div className="w-11 h-11 icon-box-sun mb-3">
              <ShieldCheck />
            </div>

            <h3 className="font-display font-bold text-lg text-ink">Модерация объявлений</h3>

            <p className="text-sm text-ink-400 mt-2">
              Объявления проверяются перед публикацией, чтобы снизить риск мошенничества и спама.
            </p>
          </div>

          <div className="surface-panel p-5">
            <div className="w-11 h-11 icon-box-sun mb-3">
              <BadgeCheck />
            </div>

            <h3 className="font-display font-bold text-lg text-ink">Личный кабинет</h3>

            <p className="text-sm text-ink-400 mt-2">
              Управляйте объявлениями, избранным, кошельком и настройками профиля в одном месте.
            </p>
          </div>

          <div className="surface-panel p-5">
            <div className="w-11 h-11 icon-box-ink mb-3">
              <Sparkles />
            </div>

            <h3 className="font-display font-bold text-lg text-ink">Продвижение</h3>

            <p className="text-sm text-ink-400 mt-2">
              Поднимайте объявления в TOP и VIP прямо из личного кабинета или со страницы объявления.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
