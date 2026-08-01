import React from "react";
import { Link, useNavigate } from "react-router-dom";
import FavoriteButton from "../components/FavoriteButton";
import ListingCardOverlays from "../components/ListingCardOverlays";
import RealEstateListingCard from "../components/RealEstateListingCard";
import AdSlot from "../components/AdSlot";
import BusinessPromoBanner from "../components/BusinessPromoBanner";
import { api } from "../lib/api";
import { getListingThumb } from "../lib/media";
import { formatPrice, formatListingDate } from "../lib/format";
import { sortListingsByPromotion } from "../lib/listingSort";
import { REAL_ESTATE_CAT } from "../data/realEstate";
import {
  getPromotionCardClass,
  getPromotionMediaClass,
} from "../lib/promotionStyles";
import {
  PlusCircle,
  ShieldCheck,
  Sparkles,
  MapPin,
  Clock3,
  ArrowRight,
  TrendingUp,
  BadgeCheck,
  Flame,
  Home as HomeIcon,
  Smartphone,
  Monitor,
  Building2,
} from "lucide-react";

function ListingCard({ ad, listings }) {
  const nav = useNavigate();
  const id = ad.id || ad._id;
  const img = getListingThumb(ad);

  const openAd = () => {
    if (!id) return;
    sessionStorage.setItem("ad_preview", JSON.stringify(ad));
    sessionStorage.setItem("ad_list", JSON.stringify(listings));
    nav(`/ad/${id}`);
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={openAd}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openAd();
        }
      }}
      className={`group card p-1.5 hover:shadow-lift transition-all duration-300 flex flex-col overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-sun/50 relative ${getPromotionCardClass(
        { vip: ad.vip, top: ad.top }
      )}`}
      aria-label={`Объявление: ${ad.title || "Без названия"}`}
    >
      <div className="relative overflow-hidden rounded-2xl">
        <img
          src={img}
          alt={ad.title || "Объявление"}
          className={`w-full h-32 object-cover bg-mist transition-transform duration-500 group-hover:scale-105 ${getPromotionMediaClass({ vip: ad.vip })}`}
          loading="lazy"
        />

        <ListingCardOverlays
          listingId={id}
          views={ad.views}
          vip={ad.vip}
          top={ad.top}
        />
      </div>

      <div className="p-1.5 flex-1 flex flex-col gap-0.5">
        <div className="font-semibold text-xs sm:text-sm text-ink line-clamp-2 group-hover:text-sun-700 transition min-h-[32px]">
          {ad.title || "Без названия"}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="text-price">
            {formatPrice(ad.price)}
          </div>

          <FavoriteButton id={id} defaultActive={ad.isFavorite} compact />
        </div>

        <div className="text-xs text-ink-400 line-clamp-1 flex items-center gap-1">
          <MapPin size={13} />
          {ad.location || ad.city || "Локация не указана"}
        </div>

        <div className="text-xs text-ink-300 line-clamp-1 flex items-center gap-1">
          <Clock3 size={13} />
          {formatListingDate(ad, { emptyLabel: "Новое объявление" })}
        </div>
      </div>
    </div>
  );
}

function RealEstateSection({ items }) {
  if (!items?.length) {
    return (
      <section className="rounded-3xl border bg-gradient-to-br from-ink-800 to-lagoon-800 text-white p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-sun-100 bg-white/10 rounded-full px-3 py-1 mb-3">
              Новая категория
            </div>
            <h2 className="text-2xl font-bold">Недвижимость на Oriyon</h2>
            <p className="text-white/75 mt-2 text-sm max-w-xl">
              Квартиры, дома, участки и коммерция — с фильтрами, ценой за м² и
              районами Душанбе.
            </p>
          </div>
          <Link
            to="/realestate"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-sun text-white font-bold hover:bg-sun-600 transition shrink-0"
          >
            <Building2 size={18} />
            Смотреть недвижимость
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-lagoon-50 grid place-items-center ring-1 ring-lagoon/15">
            <Building2 className="text-lagoon" size={20} />
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
          <ListingCard key={ad.id || ad._id} ad={ad} listings={items} />
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
          className="card p-1.5 animate-pulse"
        >
          <div className="h-32 rounded-xl bg-mist-200" />
          <div className="p-1.5 space-y-2">
            <div className="h-4 bg-mist-200 rounded w-5/6" />
            <div className="h-4 bg-mist-200 rounded w-1/2" />
            <div className="h-3 bg-mist-200 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [listings, setListings] = React.useState([]);
  const [realEstateListings, setRealEstateListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;

    async function loadListings() {
      try {
        setLoading(true);
        setError("");

        const [data, realEstate] = await Promise.all([
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
          setListings(Array.isArray(data) ? data : []);
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
  }, []);

  const sortedListings = React.useMemo(
    () => sortListingsByPromotion(listings),
    [listings]
  );

  const hotListings = sortedListings.slice(0, 10);

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
            <HorizontalSection
              title="Горящие товары"
              icon={Flame}
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
            <div className="w-11 h-11 rounded-2xl bg-lagoon-50 grid place-items-center mb-3 ring-1 ring-lagoon/15">
              <ShieldCheck className="text-lagoon" />
            </div>

            <h3 className="font-display font-bold text-lg text-ink">Модерация объявлений</h3>

            <p className="text-sm text-ink-400 mt-2">
              Объявления проверяются перед публикацией, чтобы снизить риск мошенничества и спама.
            </p>
          </div>

          <div className="surface-panel p-5">
            <div className="w-11 h-11 rounded-2xl bg-sun-50 grid place-items-center mb-3 ring-1 ring-sun/15">
              <BadgeCheck className="text-sun" />
            </div>

            <h3 className="font-display font-bold text-lg text-ink">Личный кабинет</h3>

            <p className="text-sm text-ink-400 mt-2">
              Управляйте объявлениями, избранным, кошельком и настройками профиля в одном месте.
            </p>
          </div>

          <div className="surface-panel p-5">
            <div className="w-11 h-11 rounded-2xl bg-ink-50 grid place-items-center mb-3 ring-1 ring-ink/10">
              <Sparkles className="text-ink" />
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
