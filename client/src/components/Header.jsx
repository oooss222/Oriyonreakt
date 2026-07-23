import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  User,
  PlusCircle,
  Heart,
  Wallet,
  Menu,
  X,
  Home,
  Grid3X3,
  LogIn,
  MessageCircle,
} from "lucide-react";

import { api, API_BASE } from "../lib/api";
import { categories } from "../data/categories";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export default function Header() {
  const nav = useNavigate();
  const [sp] = useSearchParams();

  const [q, setQ] = React.useState(sp.get("search") || sp.get("q") || "");
  const [open, setOpen] = React.useState(false);
  const [listings, setListings] = React.useState([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [showCategories, setShowCategories] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const categoriesRef = React.useRef(null);
  const token = localStorage.getItem(TOKEN_KEY) || "";

  const user = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  }, []);

  React.useEffect(() => {
  let active = true;

  async function loadListings() {
    try {
      const data = await api.listings({
        limit: 30,
      });

      if (active) {
        setListings(Array.isArray(data) ? data : []);
      }
    } catch {}
  }

  loadListings();

  return () => {
    active = false;
  };
}, []);

React.useEffect(() => {
  if (!token) return;

  let active = true;

  async function loadUnread() {
    try {
      const data = await api.messageInbox(token);

      if (!active) return;

      const total = (Array.isArray(data) ? data : []).reduce(
        (sum, item) =>
          sum + Number(item.unreadCount || 0),
        0
      );

      setUnreadCount(total);
    } catch {}
  }

  loadUnread();

  const timer = setInterval(loadUnread, 15000);

  return () => {
    active = false;
    clearInterval(timer);
  };
}, [token]);

function imageUrl(src) {
  if (!src) return "/img/placeholder.jpg";

  if (src.startsWith("http") || src.startsWith("/img/")) {
    return src;
  }

  return API_BASE.replace("/api", "") + src;
}

function getThumb(ad) {
  const first = ad?.images?.[0];

  if (typeof first === "string") {
    return imageUrl(first);
  }

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

const suggestions = React.useMemo(() => {
  const text = q.trim().toLowerCase();

  if (text.length < 2) return [];

  return listings
    .filter((ad) =>
      String(ad.title || "").toLowerCase().includes(text)
    )
    .slice(0, 6);
}, [q, listings]);

  const go = React.useCallback(() => {
  const text = q.trim();

  setOpen(false);

  if (text) {
    window.location.href =
      `/listing?search=${encodeURIComponent(text)}`;
  } else {
    window.location.href = "/listing";
  }
}, [q]);

  const close = () => {
    setOpen(false);
    setShowCategories(false);
  };

  React.useEffect(() => {
    if (!showCategories) return;

    function handleClickOutside(e) {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target)) {
        setShowCategories(false);
      }
    }

    function handleEscape(e) {
      if (e.key === "Escape") setShowCategories(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showCategories]);

  return (
    <header className="sticky top-0 z-50 border-b border-blue-100 bg-white/90 backdrop-blur-xl shadow-sm">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="h-20 flex items-center justify-between gap-4">
          <Link to="/" onClick={close} className="flex items-center gap-3 group shrink-0">
            <img
              src="/oriyon.store.png"
              alt="Oriyon Store"
              className="w-24 h-24 object-contain transition-transform duration-300 group-hover:scale-105"
            />

            <div className="hidden lg:block -ml-3">
              <div className="text-lg font-extrabold text-slate-900 leading-none">
                Oriyon Store
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Онлайн-платформа объявлений
              </div>
            </div>
          </Link>

          <div ref={categoriesRef} className="relative hidden md:block shrink-0">
            <button
              type="button"
              onClick={() => setShowCategories((v) => !v)}
              aria-expanded={showCategories}
              aria-haspopup="true"
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                showCategories
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              <Grid3X3 size={16} />
              Разделы
            </button>

            {showCategories && (
              <div className="absolute left-0 top-full mt-2 z-50 w-[min(92vw,720px)] rounded-2xl border bg-white p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-900">Категории</div>
                  <Link
                    to="/listing"
                    onClick={close}
                    className="text-sm font-medium text-blue-700 hover:underline"
                  >
                    Все объявления
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      to={`/c/${cat.slug}`}
                      onClick={close}
                      className="group flex items-center gap-3 rounded-xl border p-3 hover:bg-slate-50 hover:shadow-sm transition"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-blue-50 to-white border grid place-items-center shrink-0 overflow-hidden">
                        <img
                          src={cat.img}
                          alt={cat.title}
                          className="w-8 h-8 object-contain"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {cat.title}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {cat.desc}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 max-w-2xl hidden md:block relative">
            <div className="flex items-center gap-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition">
              <Search size={20} className="text-slate-400 shrink-0" />

              <input
                className="flex-1 h-10 outline-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400"
                value={q}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setQ(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={(e) => e.key === "Enter" && go()}
                placeholder="Поиск объявлений, категорий или товаров..."
              />

              <button
                type="button"
                onClick={go}
                aria-label="Искать"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 text-white w-10 h-10 hover:bg-blue-700 transition shrink-0"
              >
                <Search size={18} />
              </button>
            </div>
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

            sessionStorage.setItem(
              "ad_preview",
              JSON.stringify(ad)
            );

            setShowSuggestions(false);

            nav(`/ad/${id}`);
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
              {ad.price || "Цена не указана"}
            </div>
          </div>
        </button>
      );
    })}
  </div>
)}

          <nav className="hidden lg:flex items-center gap-2">
 

            
            <Link
              to="/add"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
            >
              <PlusCircle size={18} />
              Подать объявление 
            </Link>

            <Link
      to="/messages"
      className="relative inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
    >
      <MessageCircle size={18} />

      Сообщения

      {unreadCount > 0 && (
        <div className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
          {unreadCount > 99 ? "99+" : unreadCount}
        </div>
      )}
    </Link>

            <Link
              to="/profile?tab=fav"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium text-slate-700 hover:bg-slate-50 transition group"
            >
              <Heart
                size={18}
                className="transition-all duration-300 group-hover:fill-red-500 group-hover:text-red-500"
              />
              Избранное
            </Link>

            {token ? (
              <>
                <Link
                  to="/profile?tab=wallet"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  <Wallet size={18} />
                  Кошелёк
                </Link>

                <Link
                  to="/profile?tab=profile"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  <User size={18} />
                  {user?.name || "Профиль"}
                </Link>
              </>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <LogIn size={18} />
                Войти
              </Link>
            )}
          </nav>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl border hover:bg-slate-50 transition"
            aria-label="Открыть меню"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <div className="md:hidden pb-3">
          <div className="flex items-center gap-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition">
            <Search size={19} className="text-slate-400 shrink-0" />

            <input
              className="flex-1 h-10 outline-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go()}
              placeholder="Поиск..."
            />

            <button
              type="button"
              onClick={go}
              className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition"
            >
              Найти
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden pb-4">
            <div className="rounded-2xl border bg-white p-2 shadow-sm grid gap-2">
              <Link
                to="/"
                onClick={close}
                className="flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-slate-50"
              >
                <Home size={18} />
                Главная
              </Link>

              <Link
                to="/listing"
                onClick={close}
                className="flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-slate-50"
              >
                <Grid3X3 size={18} />
                Объявления
              </Link>

              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Категории
              </div>

              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/c/${cat.slug}`}
                  onClick={close}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50"
                >
                  <img
                    src={cat.img}
                    alt={cat.title}
                    className="w-8 h-8 object-contain"
                  />
                  {cat.title}
                </Link>
              ))}

              <Link
                to="/add"
                onClick={close}
                className="flex items-center gap-2 px-3 py-3 rounded-xl bg-blue-600 text-white"
              >
                <PlusCircle size={18} />
                Подать объявление
              </Link>

              <Link
  to="/messages"
  onClick={close}
  className="relative flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-slate-50"
>
  <MessageCircle size={18} />

  Сообщения

  {unreadCount > 0 && (
    <div className="ml-auto min-w-[22px] h-[22px] px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
      {unreadCount > 99 ? "99+" : unreadCount}
    </div>
  )}
</Link>

              <Link
                to="/profile?tab=fav"
                onClick={close}
                className="flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-slate-50"
              >
                <Heart size={18} />
                Избранное
              </Link>

              {token ? (
                <>
                  <Link
                    to="/profile?tab=wallet"
                    onClick={close}
                    className="flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-slate-50"
                  >
                    <Wallet size={18} />
                    Кошелёк
                  </Link>

                  <Link
                    to="/profile?tab=profile"
                    onClick={close}
                    className="flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-slate-50"
                  >
                    <User size={18} />
                    {user?.name || "Профиль"}
                  </Link>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={close}
                  className="flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-slate-50"
                >
                  <LogIn size={18} />
                  Войти / Зарегистрироваться
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}