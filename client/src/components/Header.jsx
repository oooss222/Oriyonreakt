import React from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
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
import CategoryStrip from "./CategoryStrip";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

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

export default function Header() {
  const nav = useNavigate();
  const location = useLocation();
  const [sp] = useSearchParams();

  const [q, setQ] = React.useState(sp.get("search") || sp.get("q") || "");
  const [open, setOpen] = React.useState(false);
  const [listings, setListings] = React.useState([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [scrolled, setScrolled] = React.useState(false);

  const token = localStorage.getItem(TOKEN_KEY) || "";

  const user = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  }, []);

  const pathname = location.pathname;
  const isBrowsePage =
    pathname === "/" ||
    pathname === "/listing" ||
    pathname.startsWith("/c/");

  const compactCategories = scrolled || pathname !== "/";

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    let active = true;

    async function loadListings() {
      try {
        const data = await api.listings({ limit: 30 });
        if (active) setListings(Array.isArray(data) ? data : []);
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
          (sum, item) => sum + Number(item.unreadCount || 0),
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

  const suggestions = React.useMemo(() => {
    const text = q.trim().toLowerCase();
    if (text.length < 2) return [];

    return listings
      .filter((ad) => String(ad.title || "").toLowerCase().includes(text))
      .slice(0, 6);
  }, [q, listings]);

  const listingsCountLabel = React.useMemo(() => {
    const count = listings.length;
    if (!count) return "Поиск объявлений";
    return `${count.toLocaleString("ru-RU")} объявлений`;
  }, [listings.length]);

  const go = React.useCallback(() => {
    const text = q.trim();
    setOpen(false);
    setShowSuggestions(false);

    if (text) {
      window.location.href = `/listing?search=${encodeURIComponent(text)}`;
    } else {
      window.location.href = "/listing";
    }
  }, [q]);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-[#2a2a2a] text-white shadow-lg">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div
          className={`flex items-center gap-2 sm:gap-3 transition-all duration-300 ${
            scrolled ? "h-14" : "h-16 sm:h-[72px]"
          }`}
        >
          <Link
            to="/"
            onClick={close}
            className="flex items-center gap-2 group shrink-0"
          >
            <img
              src="/oriyon.store.png"
              alt="Oriyon Store"
              className={`object-contain transition-all duration-300 group-hover:scale-105 ${
                scrolled ? "w-10 h-10" : "w-12 h-12 sm:w-14 sm:h-14"
              }`}
            />

            <span
              className={`hidden sm:block font-extrabold tracking-tight transition-all duration-300 ${
                scrolled ? "text-base" : "text-lg"
              }`}
            >
              Oriyon
            </span>
          </Link>

          <Link
            to="/add"
            className="hidden md:inline-flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-lg border border-orange-500 text-orange-400 text-sm font-semibold hover:bg-orange-500/10 transition"
          >
            <PlusCircle size={17} />
            <span className="hidden lg:inline">Добавить объявление</span>
            <span className="lg:hidden">Добавить</span>
          </Link>

          <div className="flex-1 min-w-0 hidden md:block relative">
            <div className="flex items-center w-full rounded-xl bg-[#3a3a3a] overflow-hidden ring-1 ring-white/10 focus-within:ring-orange-400/60 transition">
              <Search size={18} className="text-slate-400 shrink-0 ml-3" />

              <input
                className="flex-1 h-10 sm:h-11 outline-none bg-transparent text-sm text-white placeholder:text-slate-400 px-2 min-w-0"
                value={q}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onChange={(e) => {
                  setQ(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={(e) => e.key === "Enter" && go()}
                placeholder={listingsCountLabel}
              />

              <button
                type="button"
                onClick={go}
                className="h-10 sm:h-11 px-4 sm:px-5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition shrink-0"
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
          </div>

          <nav className="hidden lg:flex items-center gap-0.5 shrink-0">
            <Link
              to="/profile?tab=fav"
              className="p-2.5 rounded-lg hover:bg-white/10 transition"
              title="Избранное"
            >
              <Heart size={20} />
            </Link>

            <Link
              to="/messages"
              className="relative p-2.5 rounded-lg hover:bg-white/10 transition"
              title="Сообщения"
            >
              <MessageCircle size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            <Link
              to="/listing"
              className="p-2.5 rounded-lg hover:bg-white/10 transition"
              title="Каталог"
            >
              <Grid3X3 size={20} />
            </Link>

            {token ? (
              <>
                <Link
                  to="/profile?tab=wallet"
                  className="p-2.5 rounded-lg hover:bg-white/10 transition"
                  title="Кошелёк"
                >
                  <Wallet size={20} />
                </Link>

                <Link
                  to="/profile?tab=profile"
                  className="p-2.5 rounded-lg hover:bg-white/10 transition"
                  title={user?.name || "Профиль"}
                >
                  <User size={20} />
                </Link>
              </>
            ) : (
              <Link
                to="/auth"
                className="p-2.5 rounded-lg hover:bg-white/10 transition"
                title="Войти"
              >
                <LogIn size={20} />
              </Link>
            )}
          </nav>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 transition shrink-0"
            aria-label="Открыть меню"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <div className="md:hidden pb-3">
          <div className="flex items-center w-full rounded-xl bg-[#3a3a3a] overflow-hidden ring-1 ring-white/10">
            <Search size={18} className="text-slate-400 shrink-0 ml-3" />

            <input
              className="flex-1 h-10 outline-none bg-transparent text-sm text-white placeholder:text-slate-400 px-2"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go()}
              placeholder={listingsCountLabel}
            />

            <button
              type="button"
              onClick={go}
              className="h-10 px-4 bg-orange-500 text-white text-sm font-semibold"
            >
              Найти
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden pb-3">
            <div className="rounded-xl bg-[#333] p-2 grid gap-1">
              <Link
                to="/"
                onClick={close}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/10"
              >
                <Home size={18} />
                Главная
              </Link>

              <Link
                to="/listing"
                onClick={close}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/10"
              >
                <Grid3X3 size={18} />
                Объявления
              </Link>

              <Link
                to="/add"
                onClick={close}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-orange-400 border border-orange-500/40"
              >
                <PlusCircle size={18} />
                Добавить объявление
              </Link>

              <Link
                to="/messages"
                onClick={close}
                className="relative flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/10"
              >
                <MessageCircle size={18} />
                Сообщения
                {unreadCount > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              <Link
                to="/profile?tab=fav"
                onClick={close}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/10"
              >
                <Heart size={18} />
                Избранное
              </Link>

              {token ? (
                <>
                  <Link
                    to="/profile?tab=wallet"
                    onClick={close}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/10"
                  >
                    <Wallet size={18} />
                    Кошелёк
                  </Link>

                  <Link
                    to="/profile?tab=profile"
                    onClick={close}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/10"
                  >
                    <User size={18} />
                    {user?.name || "Профиль"}
                  </Link>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={close}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/10"
                >
                  <LogIn size={18} />
                  Войти
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {isBrowsePage && (
        <CategoryStrip compact={compactCategories} />
      )}
    </header>
  );
}
