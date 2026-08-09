import React from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  Search,
  User,
  Plus,
  Heart,
  Wallet,
  Scale,
  LogIn,
  MessageCircle,
  ClipboardCheck,
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

function NavIcon({ to, title, children, badge, className = "" }) {
  return (
    <Link
      to={to}
      title={title}
      className={`relative grid h-9 w-9 place-items-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white ${className}`}
    >
      {children}
      {badge}
    </Link>
  );
}

function CountBadge({ count, tone = "sun" }) {
  if (!count) return null;

  const toneClass =
    tone === "red"
      ? "bg-red-500"
      : tone === "amber"
        ? "bg-amber-500"
        : "bg-sun";

  return (
    <span
      className={`absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full ${toneClass} text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-ink-800`}
    >
      {count > 99 ? "99+" : count}
    </span>
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

  const compactCategories = pathname !== "/" || scrolled;

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
    const onScroll = () => setScrolled(window.scrollY > 32);
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
    if (!catalogTotal) return "Поиск объявлений";
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

  const searchField = (compact = false) => (
    <div
      className={`relative w-full ${
        compact ? "min-w-0" : "max-w-2xl mx-auto"
      }`}
    >
      <div className="flex h-10 items-center overflow-hidden rounded-xl bg-ink-900/70 ring-1 ring-white/10 transition focus-within:ring-2 focus-within:ring-sun/40 lg:h-11">
        <Search size={17} className="ml-3 shrink-0 text-white/35" />
        <input
          className="min-w-0 flex-1 bg-transparent px-2.5 text-sm text-white outline-none placeholder:text-white/35"
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
          className="mr-1 inline-flex h-8 shrink-0 items-center rounded-lg bg-sun px-3.5 text-sm font-semibold text-white transition hover:bg-sun-600 lg:h-9 lg:px-4"
        >
          Найти
        </button>
      </div>
      {suggestionList}
    </div>
  );

  const actionIcons = isMinimal ? (
    <>
      <Link
        to={comparePath}
        className="hidden rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white sm:inline"
      >
        Сравнение{compareCount > 0 ? ` (${compareCount})` : ""}
      </Link>
      <Link
        to="/"
        className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
      >
        На главную
      </Link>
    </>
  ) : (
    <>
      <NavIcon to="/profile?tab=fav" title="Избранное">
        <Heart size={18} />
      </NavIcon>

      <NavIcon to="/messages" title="Сообщения" badge={<CountBadge count={badgeCount} tone="red" />}>
        <MessageCircle size={18} />
      </NavIcon>

      <NavIcon
        to={comparePath}
        title={compareCount > 0 ? `Сравнение · ${compareCount}` : "Сравнение"}
        badge={<CountBadge count={compareCount} />}
      >
        <Scale size={18} className="text-sun" />
      </NavIcon>

      {canModerate && (
        <NavIcon
          to="/admin?section=moderation"
          title="Модерация"
          badge={<CountBadge count={moderationCount} tone="amber" />}
        >
          <ClipboardCheck size={18} />
        </NavIcon>
      )}

      {token ? (
        <>
          <NavIcon to="/profile?tab=wallet" title="Кошелёк" className="hidden xl:grid">
            <Wallet size={18} />
          </NavIcon>
          <NavIcon to="/profile?tab=profile" title={user?.name || "Профиль"}>
            <User size={18} />
          </NavIcon>
        </>
      ) : (
        <NavIcon to="/auth" title="Войти">
          <LogIn size={18} />
        </NavIcon>
      )}
    </>
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/5 bg-ink-800/95 text-white shadow-[0_8px_30px_rgb(0_0_0_/_0.18)] backdrop-blur-md">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          {/* Desktop */}
          <div
            className={`hidden lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-5 transition-all duration-300 ${
              scrolled ? "h-[60px]" : "h-[68px]"
            }`}
          >
            <Link to="/" className="group flex min-w-0 items-center gap-2.5 shrink-0">
              <img
                src="/oriyon.store.png"
                alt="Oriyon Store"
                className={`object-contain transition-transform duration-300 group-hover:scale-105 ${
                  scrolled ? "h-9 w-9" : "h-10 w-10"
                }`}
              />
              <span
                className={`brand-wordmark truncate transition-all duration-300 ${
                  scrolled ? "text-base" : "text-lg"
                }`}
              >
                Oriyon
                <span className="text-sun">.</span>
                <span className="text-[0.82em] font-semibold text-white/65">store</span>
              </span>
            </Link>

            {!isMinimal ? (
              <div className="min-w-0 px-2">{searchField(false)}</div>
            ) : (
              <div aria-hidden="true" />
            )}

            <div className="flex shrink-0 items-center gap-2">
              {!isMinimal && (
                <Link
                  to="/add"
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-sun px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sun-600 xl:px-4"
                  title="Добавить объявление"
                >
                  <Plus size={17} strokeWidth={2.5} />
                  <span className="hidden xl:inline">Добавить</span>
                </Link>
              )}

              <div className="flex items-center gap-0.5 rounded-xl bg-white/[0.04] p-0.5 ring-1 ring-white/8">
                {actionIcons}
              </div>
            </div>
          </div>

          {/* Mobile */}
          {!isMinimal ? (
            <div className="flex items-center gap-2 py-2.5 lg:hidden">
              <Link to="/" className="shrink-0" aria-label="На главную">
                <img src="/oriyon.store.png" alt="" className="h-9 w-9 object-contain" />
              </Link>
              <div className="min-w-0 flex-1">{searchField(true)}</div>
              <Link
                to="/add"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sun text-white shadow-sm"
                title="Добавить объявление"
              >
                <Plus size={20} strokeWidth={2.5} />
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 py-2.5 lg:hidden">
              <Link to="/" className="shrink-0" aria-label="На главную">
                <img src="/oriyon.store.png" alt="" className="h-9 w-9 object-contain" />
              </Link>
              <div className="flex items-center gap-2">{actionIcons}</div>
            </div>
          )}
        </div>

        {isBrowsePage && (
          <CategoryStrip compact={compactCategories} dense={scrolled} />
        )}
      </header>
    </>
  );
}
