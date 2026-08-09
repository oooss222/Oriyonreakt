import React from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  Search,
  Heart,
  Scale,
  MessageCircle,
  ArrowRight,
} from "lucide-react";

import { api } from "../lib/api";
import { trackSearch } from "../lib/track";
import { TOKEN_KEY, USER_KEY } from "../lib/auth";
import { canAccessModeration } from "../lib/adminUtils";
import { subscribeModerationQueue } from "../lib/moderationSocket";
import {
  getActiveCompareCat,
  findCompareCatWithItems,
  readCompareCount,
} from "../lib/compareListings";
import { getComparePath } from "../lib/compareConfig";
import {
  getUnreadTotal,
  subscribeUnreadCount,
  subscribeUnreadRefresh,
} from "../lib/unread";
import CategoryStrip from "./CategoryStrip";
import HeaderSearchSuggestions from "./HeaderSearchSuggestions";

function TextNavLink({ to, children, badge = 0 }) {
  return (
    <Link
      to={to}
      className="relative hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-white/75 transition hover:bg-white/8 hover:text-white md:inline-flex"
    >
      {children}
      {badge > 0 && (
        <span className="min-w-[18px] rounded-full bg-sun px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

function UserAvatar({ user, token }) {
  const initial = String(user?.name || user?.email || "G")
    .trim()
    .charAt(0)
    .toUpperCase();

  if (!token) {
    return (
      <Link
        to="/auth"
        className="inline-flex h-10 items-center rounded-xl px-3.5 text-sm font-semibold text-white/90 ring-1 ring-white/15 transition hover:bg-white/10"
      >
        Войти
      </Link>
    );
  }

  return (
    <Link
      to="/profile?tab=profile"
      title={user?.name || "Профиль"}
      className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-sun to-sun-600 text-sm font-bold text-white ring-2 ring-white/15 transition hover:ring-sun/50"
    >
      {initial}
    </Link>
  );
}

export default function Header({ variant = "full" }) {
  const nav = useNavigate();
  const location = useLocation();
  const [sp] = useSearchParams();
  const isMinimal = variant === "minimal";

  const [q, setQ] = React.useState(sp.get("search") || sp.get("q") || "");
  const [catalogTotal, setCatalogTotal] = React.useState(0);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [moderationCount, setModerationCount] = React.useState(0);
  const [scrolled, setScrolled] = React.useState(false);
  const [compareCount, setCompareCount] = React.useState(0);

  const token = localStorage.getItem(TOKEN_KEY) || "";

  const user = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  }, []);

  const pathname = location.pathname;
  const compareCat =
    findCompareCatWithItems(getActiveCompareCat(pathname)) ||
    getActiveCompareCat(pathname) ||
    "realestate";
  const comparePath = getComparePath(compareCat);
  const onMessagesPage = pathname === "/messages";
  const badgeCount = onMessagesPage ? 0 : unreadCount;
  const canModerate = canAccessModeration(user?.role);

  React.useEffect(() => {
    if (!token || !canModerate) {
      setModerationCount(0);
      return undefined;
    }

    let active = true;

    api
      .moderationQueueCount(token)
      .then((data) => {
        if (active) setModerationCount(Number(data?.pendingCount || 0));
      })
      .catch(() => {
        if (active) setModerationCount(0);
      });

    const unsubscribe = subscribeModerationQueue((payload) => {
      if (payload?.pendingCount != null) {
        setModerationCount(Number(payload.pendingCount || 0));
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [token, canModerate]);

  const isBrowsePage =
    !isMinimal &&
    (pathname === "/" ||
      pathname === "/listing" ||
      pathname === "/realestate" ||
      pathname.startsWith("/realestate/") ||
      pathname.startsWith("/c/"));

  const loadUnread = React.useCallback(async () => {
    if (!token || onMessagesPage) {
      setUnreadCount(0);
      return;
    }

    try {
      const data = await api.messageInbox(token);
      setUnreadCount(getUnreadTotal(data));
    } catch {
      setUnreadCount(0);
    }
  }, [token, onMessagesPage]);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    loadUnread();
    const timer = setInterval(loadUnread, 15000);
    return () => clearInterval(timer);
  }, [loadUnread]);

  React.useEffect(() => subscribeUnreadCount(setUnreadCount), []);
  React.useEffect(() => subscribeUnreadRefresh(loadUnread), [loadUnread]);

  React.useEffect(() => {
    const syncCompare = () => {
      const cat =
        findCompareCatWithItems(getActiveCompareCat(location.pathname)) ||
        getActiveCompareCat(location.pathname) ||
        "realestate";
      setCompareCount(readCompareCount(cat));
    };

    syncCompare();
    window.addEventListener("oriyon:compare-change", syncCompare);
    return () => window.removeEventListener("oriyon:compare-change", syncCompare);
  }, [location.pathname]);

  React.useEffect(() => {
    let active = true;

    async function loadCount() {
      try {
        const data = await api.listingCount({});
        if (active) setCatalogTotal(Number(data?.total || 0));
      } catch {
        if (active) setCatalogTotal(0);
      }
    }

    loadCount();
    return () => {
      active = false;
    };
  }, []);

  const listingsCountLabel = React.useMemo(() => {
    if (!catalogTotal) return "Что ищете?";
    return `Поиск среди ${catalogTotal.toLocaleString("ru-RU")} объявлений`;
  }, [catalogTotal]);

  const go = React.useCallback(() => {
    const text = q.trim();
    setShowSuggestions(false);

    if (text) {
      trackSearch(text);
      nav(`/listing?search=${encodeURIComponent(text)}`);
    } else {
      nav("/listing");
    }
  }, [q, nav]);

  const suggestionList = (
    <HeaderSearchSuggestions
      query={q}
      visible={showSuggestions}
      onSelect={(ad, id) => {
        sessionStorage.setItem("ad_preview", JSON.stringify(ad));
        setShowSuggestions(false);
        nav(`/ad/${id}`);
      }}
      onNavigate={() => {
        setShowSuggestions(false);
        go();
      }}
    />
  );

  const searchPanel = (compact = false) => (
    <div className={`relative w-full ${compact ? "min-w-0" : ""}`}>
      <div
        className={`flex items-center gap-2 rounded-2xl bg-white shadow-[0_8px_30px_rgb(0_0_0_/_0.12)] ring-1 ring-black/5 transition focus-within:ring-2 focus-within:ring-sun/40 ${
          compact ? "p-1" : "p-1.5"
        }`}
      >
        <Search size={compact ? 18 : 20} className="ml-2 shrink-0 text-ink-300" />
        <input
          className={`min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-300 ${
            compact ? "h-10 text-sm" : "h-11 text-[15px]"
          }`}
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
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-sun font-semibold text-white transition hover:bg-sun-600 ${
            compact ? "h-10 px-3.5 text-sm" : "h-11 px-5 text-sm"
          }`}
        >
          Найти
          {!compact && <ArrowRight size={16} />}
        </button>
      </div>
      {suggestionList}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 bg-[#141312] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sun/60 to-transparent" />

      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        {/* Top bar */}
        <div className="flex h-14 items-center justify-between gap-3 lg:h-[58px]">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5 min-w-0">
            <img
              src="/oriyon.store.png"
              alt="Oriyon Store"
              className="h-9 w-9 object-contain transition group-hover:scale-105 lg:h-10 lg:w-10"
            />
            <span className="brand-wordmark hidden truncate text-lg sm:block">
              Oriyon
              <span className="text-sun">.</span>
              <span className="text-[0.82em] font-semibold text-white/55">store</span>
            </span>
          </Link>

          {isMinimal ? (
            <div className="flex items-center gap-2">
              <Link
                to={comparePath}
                className="text-sm font-medium text-white/75 hover:text-white"
              >
                Сравнение
              </Link>
              <Link to="/" className="text-sm font-medium text-white/75 hover:text-white">
                На главную
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="hidden md:contents">
                <TextNavLink to="/profile?tab=fav" badge={0}>
                  <Heart size={16} />
                  Избранное
                </TextNavLink>

                <TextNavLink to="/messages" badge={badgeCount}>
                  <MessageCircle size={16} />
                  Сообщения
                </TextNavLink>

                <TextNavLink to={comparePath} badge={compareCount}>
                  <Scale size={16} />
                  Сравнение
                </TextNavLink>

                {canModerate && (
                  <Link
                    to="/admin?section=moderation"
                    className="relative hidden items-center rounded-lg px-2.5 py-1.5 text-sm font-medium text-amber-300/90 transition hover:bg-white/8 lg:inline-flex"
                  >
                    Модерация
                    {moderationCount > 0 && (
                      <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {moderationCount}
                      </span>
                    )}
                  </Link>
                )}

                <UserAvatar user={user} token={token} />
              </div>

              <Link
                to="/add"
                className="ml-1 inline-flex h-10 items-center rounded-xl bg-sun px-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgb(255_106_0_/_0.35)] transition hover:bg-sun-600 sm:px-4"
              >
                <span className="hidden sm:inline">Подать объявление</span>
                <span className="sm:hidden">Подать</span>
              </Link>
            </div>
          )}
        </div>

        {/* Search hero strip */}
        {!isMinimal && (
          <div
            className={`transition-all duration-300 ${
              scrolled ? "pb-2 pt-0" : "pb-3 pt-0 lg:pb-4"
            }`}
          >
            {searchPanel(false)}
          </div>
        )}

        {/* Mobile compact search when scrolled - hide duplicate, always show search above */}
      </div>

      {isBrowsePage && <CategoryStrip scrolled={scrolled} />}

      {/* Mobile-only second row for quick icons when not minimal */}
      {!isMinimal && (
        <div className="flex items-center justify-between gap-2 border-t border-white/5 px-3 py-2 md:hidden">
          <div className="flex items-center gap-1">
            <Link to="/profile?tab=fav" className="rounded-lg p-2 text-white/75 hover:bg-white/8">
              <Heart size={18} />
            </Link>
            <Link to="/messages" className="relative rounded-lg p-2 text-white/75 hover:bg-white/8">
              <MessageCircle size={18} />
              {badgeCount > 0 && (
                <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-red-500" />
              )}
            </Link>
            <Link to={comparePath} className="relative rounded-lg p-2 text-white/75 hover:bg-white/8">
              <Scale size={18} />
              {compareCount > 0 && (
                <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-sun" />
              )}
            </Link>
          </div>
          <UserAvatar user={user} token={token} />
        </div>
      )}
    </header>
  );
}
