import React from "react";
import { Link, useNavigate } from "react-router-dom";
import AdSlot from "../components/AdSlot";
import ListingCard from "../components/ListingCard";
import { api } from "../lib/api";
import {
  PlusCircle,
  ShieldCheck,
  Sparkles,
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

function HorizontalSection({ title, icon: Icon, items, linkTo = "/listing" }) {
  if (!items?.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="icon-well-blue">
            <Icon size={20} />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {title}
            </h2>
            <div className="text-sm text-slate-500">{items.length} объявлений</div>
          </div>
        </div>

        <Link
          to={linkTo}
          className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          Смотреть все
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin snap-x">
        {items.map((ad) => (
          <ListingCard
            key={ad.id || ad._id}
            ad={ad}
            listings={items}
            className="min-w-[230px] max-w-[230px] snap-start"
            imageHeight="h-44"
          />
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
    <div className="page-shell">
      <div className="page-container space-y-10 sm:space-y-12">
        <section className="hero-banner">
          <div className="relative z-[1] max-w-2xl">
            <p className="text-blue-100 text-sm font-medium mb-2">
              Маркетплейс объявлений Таджикистана
            </p>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-balance">
              Покупайте и продавайте на Oriyon Store
            </h1>
            <p className="text-blue-100/90 mt-3 text-sm sm:text-base leading-relaxed">
              Тысячи объявлений: авто, техника, мебель, телефоны и многое другое.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/listing" className="btn bg-white text-brand border-white hover:bg-blue-50">
                Смотреть объявления
              </Link>
              <Link to="/add" className="btn bg-white/10 text-white border-white/30 hover:bg-white/20">
                <PlusCircle size={18} />
                Подать объявление
              </Link>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 right-1/4 h-32 w-32 rounded-full bg-blue-300/20 blur-2xl" />
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="section-chip mb-2">
                <Grid3X3 size={16} />
                Разделы
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Категории
              </h2>
            </div>

            <Link
              to="/listing"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Все объявления
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/c/${cat.slug}`}
                className="category-card group"
                aria-label={`Категория: ${cat.title}`}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-accent-50 to-white border border-slate-100 grid place-items-center mb-3 overflow-hidden">
                  <img
                    src={cat.img}
                    alt={cat.title}
                    loading="lazy"
                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                <div className="font-bold text-slate-900 line-clamp-1">{cat.title}</div>

                <div className="text-xs text-slate-500 mt-1 line-clamp-2">{cat.desc}</div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="section-panel overflow-hidden">
            <AdSlot type="banner" id="home-banner" />
          </div>
        </section>

        {loading && <ListingSkeleton />}

        {!loading && error && (
          <div className="section-panel p-6 text-center text-red-700 bg-red-50/50 border-red-200">
            {error}
          </div>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="empty-state">
            <div className="mx-auto icon-well-blue mb-4 w-14 h-14">
              <Sparkles size={24} />
            </div>

            <div className="font-semibold text-lg text-slate-800">
              Пока нет опубликованных объявлений
            </div>

            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
              Добавьте объявление, после модерации оно появится здесь.
            </p>

            <Link to="/add" className="btn btn-primary mt-5">
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
          <div className="feature-card">
            <div className="icon-well-blue mb-4">
              <ShieldCheck size={22} />
            </div>

            <h3 className="font-bold text-lg text-slate-900">Модерация объявлений</h3>

            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Объявления проверяются перед публикацией, чтобы снизить риск мошенничества и спама.
            </p>
          </div>

          <div className="feature-card">
            <div className="icon-well bg-emerald-50 text-emerald-600 mb-4">
              <BadgeCheck size={22} />
            </div>

            <h3 className="font-bold text-lg text-slate-900">Личный кабинет</h3>

            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Управляйте объявлениями, избранным, кошельком и настройками профиля в одном месте.
            </p>
          </div>

          <div className="feature-card">
            <div className="icon-well bg-amber-50 text-amber-600 mb-4">
              <TrendingUp size={22} />
            </div>

            <h3 className="font-bold text-lg text-slate-900">Быстрый поиск</h3>

            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Удобные фильтры по категориям, цене и городу помогают быстро найти нужный товар.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}