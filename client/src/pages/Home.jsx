import React from "react";
import { Link, useNavigate } from "react-router-dom";
import AdSlot from "../components/AdSlot";
import { api, API_BASE } from "../lib/api";
import {
  Search,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  MapPin,
  Clock3,
  ArrowRight,
  Grid3X3,
  TrendingUp,
  BadgeCheck,
  Flame,
  Home as HomeIcon,
  Smartphone,
  Monitor,
} from "lucide-react";

const categories = [
  {
    slug: "transport",
    title: "Авто",
    img: "/img/car.png",
    desc: "Авто, запчасти, техника",
  },
  {
    slug: "furniture",
    title: "Мебель",
    img: "/img/furniture.png",
    desc: "Дом, офис, интерьер",
  },
  {
    slug: "phones",
    title: "Телефоны",
    img: "/img/phone.png",
    desc: "Смартфоны и аксессуары",
  },
  {
    slug: "electronics",
    title: "Бытовая техника",
    img: "/img/electronics.png",
    desc: "Техника для дома",
  },
  {
    slug: "computers",
    title: "Компьютеры",
    img: "/img/computers.png",
    desc: "ПК, ноутбуки, оргтехника",
  },
  {
    slug: "repair",
    title: "Ремонт",
    img: "/img/repair.png",
    desc: "Материалы и инструменты",
  },
];

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
  const id = ad.id || ad._id;
  const img = getThumb(ad);

  return (
    <Link
      to={`/ad/${id}`}
      onClick={() => {
        sessionStorage.setItem("ad_preview", JSON.stringify(ad));
        sessionStorage.setItem("ad_list", JSON.stringify(listings));
      }}
      className="group min-w-[230px] max-w-[230px] rounded-3xl border bg-white p-2 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label={`Объявление: ${ad.title || "Без названия"}`}
    >
      <div className="relative overflow-hidden rounded-2xl">
        <img
          src={img}
          alt={ad.title || "Объявление"}
          className="w-full h-44 object-cover bg-slate-100 transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {(ad.vip || ad.top) && (
          <div className="absolute left-2 top-2 flex gap-2">
            {ad.vip && (
              <span className="px-2 py-0.5 text-[11px] rounded-full bg-amber-500 text-white shadow">
                VIP
              </span>
            )}

            {ad.top && (
              <span className="px-2 py-0.5 text-[11px] rounded-full bg-indigo-600 text-white shadow">
                TOP
              </span>
            )}
          </div>
        )}
      </div>

      <div className="p-2 flex-1 flex flex-col gap-1">
        <div className="font-semibold text-sm text-slate-900 line-clamp-2 group-hover:text-blue-600 transition min-h-[40px]">
          {ad.title || "Без названия"}
        </div>

        <div className="text-blue-700 font-extrabold">
          {fmtPrice(ad.price)}
        </div>

        <div className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1">
          <MapPin size={13} />
          {ad.location || ad.city || "Локация не указана"}
        </div>

        <div className="text-xs text-slate-400 line-clamp-1 flex items-center gap-1">
          <Clock3 size={13} />
          {ad.createdAt
            ? new Date(ad.createdAt).toLocaleDateString("ru-RU")
            : "Новое объявление"}
        </div>
      </div>
    </Link>
  );
}

function HorizontalSection({ title, icon: Icon, items, linkTo = "/listing" }) {
  if (!items?.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 grid place-items-center">
            <Icon className="text-blue-600" size={20} />
          </div>

          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            <div className="text-sm text-slate-500">
              {items.length} объявлений
            </div>
          </div>
        </div>

        <Link
          to={linkTo}
          className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
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
          className="min-w-[230px] rounded-3xl border bg-white p-2 animate-pulse"
        >
          <div className="h-44 rounded-2xl bg-slate-200" />
          <div className="p-2 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-5/6" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-3 bg-slate-200 rounded w-2/3" />
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
    window.location.href = `/listing?search=${encodeURIComponent(text)}`;
  } else {
    window.location.href = "/listing";
  }
}, [q]);

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
      categories: categories.length,
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
    <div className="bg-slate-50">
      <div className="container mx-auto px-4 py-6 space-y-10">
<section className="relative rounded-[1.5rem] border bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 text-white shadow-lg">  <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-sm" />
  <div className="absolute right-10 bottom-8 w-24 h-24 rounded-full bg-white/10" />

  <div className="relative p-5 md:p-7">
    <div className="max-w-3xl space-y-4">
      <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-3 py-1 text-sm">
        <ShieldCheck size={16} />
        Доступно только в городе Душанбе
      </div>

      <div>
        <h1 className="text-2xl md:text-4xl font-extrabold leading-tight">
          Объявления в Душанбе на Oriyon Store
        </h1>

        <p className="mt-3 text-blue-100 text-sm md:text-base max-w-2xl">
          Покупайте и продавайте товары и услуги в пределах города Душанбе.
          Все объявления проходят модерацию перед публикацией.
        </p>
      </div>

      <div className="relative rounded-2xl bg-white p-2 shadow-md max-w-2xl">
  <div className="flex items-center gap-2">
    <Search className="text-slate-400 ml-3 shrink-0" size={21} />

    <input
      value={q}
      onFocus={() => setShowSuggestions(true)}
      onChange={(e) => {
        setQ(e.target.value);
        setShowSuggestions(true);
      }}
      onKeyDown={(e) => e.key === "Enter" && goSearch()}
      placeholder="Что ищем в Душанбе? Например: телефон, авто, мебель..."
      className="h-11 flex-1 outline-none text-slate-800 placeholder:text-slate-400 text-sm"
    />

    <button
      type="button"
      onClick={goSearch}
      className="h-11 rounded-xl bg-blue-600 px-5 text-white text-sm font-semibold hover:bg-blue-700 transition"
    >
      Найти
    </button>
  </div>

  {showSuggestions && suggestions.length > 0 && (
    <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border bg-white shadow-xl overflow-hidden text-slate-900">
      {suggestions.map((ad) => {
        const id = ad.id || ad._id;

        return (
          <button
            key={id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              sessionStorage.setItem("ad_preview", JSON.stringify(ad));
              setShowSuggestions(false);
              window.location.href = `/ad/${id}`;
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left border-b last:border-b-0"
          >
            <img
              src={getThumb(ad)}
              alt={ad.title || "Объявление"}
              className="w-12 h-12 rounded-xl object-cover bg-slate-100"
            />

            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">
                {ad.title || "Без названия"}
              </div>

              <div className="text-xs text-slate-500">
                {fmtPrice(ad.price)}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  )}
</div>

      <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 max-w-2xl">
        <div className="text-sm md:text-base font-semibold">
          Сейчас сервис работает только по Душанбе
        </div>

        <div className="text-xs md:text-sm text-blue-100 mt-1">
          Поиск, подача и просмотр объявлений ориентированы на этот город.
        </div>
      </div>
    </div>
  </div>
</section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-2">
                <Grid3X3 size={16} />
                Разделы
              </div>

              <h2 className="text-2xl font-bold">Категории</h2>
            </div>

            <Link
              to="/listing"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
            >
              Все объявления
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/c/${cat.slug}`}
                className="group rounded-3xl border bg-white p-4 transition hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={`Категория: ${cat.title}`}
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-blue-50 to-white border grid place-items-center mb-3 overflow-hidden">
                  <img
                    src={cat.img}
                    alt={cat.title}
                    loading="lazy"
                    className="w-14 h-14 object-contain transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                <div className="font-bold text-slate-900 line-clamp-1">
                  {cat.title}
                </div>

                <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {cat.desc}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="rounded-3xl overflow-hidden border bg-white shadow-sm">
            <AdSlot type="banner" id="home-banner" />
          </div>
        </section>

        {loading && <ListingSkeleton />}

        {!loading && error && (
          <div className="rounded-3xl border bg-red-50 p-6 text-center text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="rounded-3xl border bg-white p-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 grid place-items-center mb-3">
              <Sparkles className="text-blue-600" />
            </div>

            <div className="font-semibold text-slate-800">
              Пока нет опубликованных объявлений
            </div>

            <p className="text-sm text-slate-500 mt-1">
              Добавьте объявление, после модерации оно появится здесь.
            </p>

            <Link
              to="/add"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
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
          <div className="rounded-3xl border bg-white p-5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 grid place-items-center mb-3">
              <ShieldCheck className="text-blue-600" />
            </div>

            <h3 className="font-bold text-lg">Модерация объявлений</h3>

            <p className="text-sm text-slate-500 mt-2">
              Объявления проверяются перед публикацией, чтобы снизить риск мошенничества и спама.
            </p>
          </div>

          <div className="rounded-3xl border bg-white p-5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 grid place-items-center mb-3">
              <BadgeCheck className="text-emerald-600" />
            </div>

            <h3 className="font-bold text-lg">Личный кабинет</h3>

            <p className="text-sm text-slate-500 mt-2">
              Управляйте объявлениями, избранным, кошельком и настройками профиля в одном месте.
            </p>
          </div>

          <div className="rounded-3xl border bg-white p-5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 grid place-items-center mb-3">
              <Sparkles className="text-amber-600" />
            </div>

            <h3 className="font-bold text-lg">Продвижение</h3>

            <p className="text-sm text-slate-500 mt-2">
              Кошелёк подготовлен для будущих VIP, TOP и платных услуг продвижения.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}