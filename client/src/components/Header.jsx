import React from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  Search,
  User,
  PlusCircle,
  Heart,
  Wallet,
  Grid3X3,
  LogIn,
  MessageCircle,
} from "lucide-react";

import { api } from "../lib/api";
import { TOKEN_KEY, USER_KEY } from "../lib/auth";
import CategoryStrip from "./CategoryStrip";
import { getListingThumb } from "../lib/media";

export default function Header() {
  const nav = useNavigate();
  const location = useLocation();
  const [sp] = useSearchParams();

  const [q, setQ] = React.useState(sp.get("search") || sp.get("q") || "");
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

  const compactCategories = pathname !== "/";

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
    setShowSuggestions(false);

    if (text) {
      nav(`/listing?search=${encodeURIComponent(text)}`);
    } else {
      nav("/listing");
    }
  }, [q, nav]);

  const suggestionList =
    showSuggestions && suggestions.length > 0 ? (
      <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-ink/10 bg-white shadow-lift overflow-hidden text-ink">
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
                nav(`/ad/${id}`);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-sun-50 text-left border-b border-ink/5 last:border-b-0"
            >
              <img
                src={getListingThumb(ad)}
                alt={ad.title || "Объявление"}
                className="w-12 h-12 rounded-xl object-cover bg-mist"
              />
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">
                  {ad.title || "Без названия"}
                </div>
                <div className="text-xs text-ink-400">
                  {ad.price || "Цена не указана"}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    ) : null;

  return (
    <header className="sticky top-0 z-50 bg-ink-700 text-white border-b border-white/5 shadow-soft">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div
          className={`flex items-center gap-2 sm:gap-3 transition-all duration-300 ${
            scrolled ? "h-14" : "h-14 sm:h-16 lg:h-[72px]"
          }`}
        >
          <Link to="/" className="flex items-center gap-2 group shrink-0 min-w-0">
            <img
              src="/oriyon.store.png"
              alt="Oriyon Store"
              className={`object-contain transition-all duration-300 group-hover:scale-105 ${
                scrolled ? "w-9 h-9 sm:w-10 sm:h-10" : "w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14"
              }`}
            />

            <span
              className={`brand-wordmark hidden sm:block transition-all duration-300 truncate ${
                scrolled ? "text-base" : "text-lg"
              }`}
            >
              Oriyon
              <span className="text-sun">.</span>
              <span className="text-white/70 font-semibold text-[0.85em]">store</span>
            </span>
          </Link>

          <Link
            to="/add"
            className="hidden lg:inline-flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl border border-sun/50 text-sun text-sm font-semibold hover:bg-sun/10 transition"
          >
            <PlusCircle size={17} />
            Добавить объявление
          </Link>

          <div className="flex-1 min-w-0 hidden lg:block relative">
            <div className="flex items-center w-full rounded-xl bg-ink-600 overflow-hidden ring-1 ring-white/10 focus-within:ring-sun/70 transition">
              <Search size={18} className="text-ink-300 shrink-0 ml-3" />

              <input
                className="flex-1 h-10 lg:h-11 outline-none bg-transparent text-sm text-white placeholder:text-ink-300 px-2 min-w-0"
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
                className="h-10 lg:h-11 px-4 lg:px-5 bg-sun hover:bg-sun-600 text-white text-sm font-semibold transition shrink-0"
              >
                Найти
              </button>
            </div>

            {suggestionList}
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

          <nav
            className="lg:hidden ml-auto flex items-center gap-0.5 shrink-0"
            aria-label="Быстрые действия"
          >
            <Link
              to="/profile?tab=fav"
              className="p-2 rounded-lg hover:bg-white/10 transition"
              title="Избранное"
            >
              <Heart size={20} />
            </Link>

            <Link
              to="/messages"
              className="relative p-2 rounded-lg hover:bg-white/10 transition"
              title="Сообщения"
            >
              <MessageCircle size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            {token ? (
              <Link
                to="/profile"
                className="p-2 rounded-lg hover:bg-white/10 transition"
                title={user?.name || "Профиль"}
              >
                <User size={20} />
              </Link>
            ) : (
              <Link
                to="/auth"
                className="p-2 rounded-lg hover:bg-white/10 transition"
                title="Войти"
              >
                <LogIn size={20} />
              </Link>
            )}
          </nav>
        </div>

        <div className="lg:hidden pb-2.5 relative">
          <div className="flex items-center w-full rounded-xl bg-ink-600 overflow-hidden ring-1 ring-white/10 focus-within:ring-sun/70 transition">
            <Search size={18} className="text-ink-300 shrink-0 ml-3" />

            <input
              className="flex-1 h-10 outline-none bg-transparent text-sm text-white placeholder:text-ink-300 px-2 min-w-0"
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
              className="h-10 px-4 bg-sun hover:bg-sun-600 text-white text-sm font-semibold shrink-0"
            >
              Найти
            </button>
          </div>

          {suggestionList}
        </div>
      </div>

      {isBrowsePage && <CategoryStrip compact={compactCategories} />}
    </header>
  );
}
