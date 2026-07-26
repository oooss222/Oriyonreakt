import React from "react";
import { Link, useNavigate } from "react-router-dom";
import FavoriteButton from "../components/FavoriteButton";
import { api, API_BASE } from "../lib/api";
import { HOME_CATEGORIES } from "../data/categories";
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
} from "lucide-react";

const cityChips = ["Душанбе", "Худжанд", "Бохтар", "Куляб", "Вахдат"];

function imageUrl(src) {
  if (!src) return "/img/placeholder.jpg";
  if (src.startsWith("http") || src.startsWith("/img/")) return src;
  return API_BASE.replace("/api", "") + src;
}

function getThumb(ad) {
  const first = ad?.images?.[0];

  if (typeof first === "string") return imageUrl(first);

  return imageUrl(
    first?.url ||
      first?.src ||
      first?.path ||
      first?.secure_url ||
      first?.preview ||
      ad?.img ||
      ad?.image ||
      ""
  );
}

function fmtPrice(value) {
  if (value == null || value === "") return "Цена не указана";

  const n = Number(String(value).replace(/\s/g, ""));

  if (Number.isFinite(n)) {
    return `${n.toLocaleString("ru-RU")} TJS`;
  }

  return String(value);
}

function ListingCard({ ad, listings }) {
  const nav = useNavigate();
  const id = ad.id || ad._id;
  const img = getThumb(ad);

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
      className="group min-w-[230px] max-w-[230px] card p-2 hover:shadow-lift hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-sun/50"
      aria-label={`Объявление: ${ad.title || "Без названия"}`}
    >
      <div className="relative overflow-hidden rounded-2xl">
        <img
          src={img}
          alt={ad.title || "Объявление"}
          className="w-full h-44 object-cover bg-mist transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {(ad.vip || ad.top) && (
          <div className="absolute left-2 top-2 flex gap-2">
            {ad.vip && (
              <span className="px-2 py-0.5 text-[11px] rounded-lg bg-sun text-white shadow-soft font-semibold">
                VIP
              </span>
            )}

            {ad.top && (
              <span className="px-2 py-0.5 text-[11px] rounded-lg bg-lagoon text-white shadow-soft font-semibold">
                TOP
              </span>
            )}
          </div>
        )}
      </div>

      <div className="p-2 flex-1 flex flex-col gap-1">
        <div className="font-semibold text-sm text-ink line-clamp-2 group-hover:text-sun-700 transition min-h-[40px]">
          {ad.title || "Без названия"}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="text-price">
            {fmtPrice(ad.price)}
          </div>

          <FavoriteButton id={id} defaultActive={ad.isFavorite} compact />
        </div>

        <div className="text-xs text-ink-400 line-clamp-1 flex items-center gap-1">
          <MapPin size={13} />
          {ad.location || ad.city || "Локация не указана"}
        </div>

        <div className="text-xs text-ink-300 line-clamp-1 flex items-center gap-1">
          <Clock3 size={13} />
          {ad.createdAt
            ? new Date(ad.createdAt).toLocaleDateString("ru-RU")
            : "Новое объявление"}
        </div>
      </div>
    </div>
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

      <div className="flex gap-4 overflow-x-auto pb-3">
        {items.map((ad) => (
          <ListingCard key={ad.id || ad._id} ad={ad} listings={items} />
        ))}
      </div>
    </section>
  );
}

function ListingSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="min-w-[230px] card p-2 animate-pulse"
        >
          <div className="h-44 rounded-2xl bg-mist-200" />
          <div className="p-2 space-y-2">
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
  const nav = useNavigate();

  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [q, setQ] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    async function loadListings() {
      try {
        setLoading(true);
        setError("");

        const data = await api.listings({
          limit: 50,
        });

        if (active) {
          setListings(Array.isArray(data) ? data : []);
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

  const goSearch = React.useCallback(() => {
    const text = q.trim();

    if (text) {
      nav(`/listing?search=${encodeURIComponent(text)}`);
    } else {
      nav("/listing");
    }
  }, [q, nav]);

  const suggestions = React.useMemo(() => {
  const text = q.trim().toLowerCase();

  if (text.length < 2) return [];

  return listings
    .filter((ad) =>
      String(ad.title || "").toLowerCase().includes(text)
    )
    .slice(0, 6);
}, [q, listings]);

  const stats = React.useMemo(() => {
    const withPhoto = listings.filter((item) => item?.images?.length).length;
    const locations = new Set(
      listings.map((item) => item.location || item.city).filter(Boolean)
    );

    return {
      listings: listings.length,
      categories: HOME_CATEGORIES.length,
      withPhoto,
      locations: locations.size,
    };
  }, [listings]);

  

  const hotListings = listings.slice(0, 10);

  const electronicsListings = listings
    .filter((item) => item.cat === "electronics")
    .slice(0, 10);

  const phonesListings = listings
    .filter((item) => item.cat === "phones")
    .slice(0, 10);

  const computersListings = listings
    .filter((item) => item.cat === "computers")
    .slice(0, 10);

  const newestListings = [...listings]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 10);

  return (
    <div className="page-shell">
      <div className="container mx-auto px-4 py-6 space-y-10">
        {loading && <ListingSkeleton />}

        {!loading && error && (
          <div className="surface-panel p-6 text-center text-red-700 bg-red-50/80">
            {error}
          </div>
        )}

        {!loading && !error && listings.length === 0 && (
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
        )}

        {!loading && !error && listings.length > 0 && (
          <div className="space-y-10">
            <HorizontalSection
              title="Горящие товары"
              icon={Flame}
              items={hotListings}
              linkTo="/listing"
            />

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
              Кошелёк подготовлен для будущих VIP, TOP и платных услуг продвижения.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}