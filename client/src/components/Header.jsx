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
  ClipboardCheck,
} from "lucide-react";

import { api } from "../lib/api";
import { TOKEN_KEY, USER_KEY } from "../lib/auth";
import { canAccessModeration } from "../lib/adminUtils";
import { subscribeModerationQueue } from "../lib/moderationSocket";
import {
  getUnreadTotal,
  subscribeUnreadCount,
  subscribeUnreadRefresh,
} from "../lib/unread";
import CategoryStrip from "./CategoryStrip";
import HeaderSearchSuggestions from "./HeaderSearchSuggestions";

export default function Header() {
  const nav = useNavigate();
  const location = useLocation();
  const [sp] = useSearchParams();

  const [q, setQ] = React.useState(sp.get("search") || sp.get("q") || "");
  const [catalogTotal, setCatalogTotal] = React.useState(0);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [moderationCount, setModerationCount] = React.useState(0);
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
    pathname === "/" ||
    pathname === "/listing" ||
    pathname.startsWith("/c/");

  const compactCategories = pathname !== "/";

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
    const onScroll = () => setScrolled(window.scrollY > 48);
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
    let active = true;

    async function loadCount() {
      try {
        const data = await api.listingCount({});
        if (active) {
          setCatalogTotal(Number(data?.total || 0));
        }
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
      className={`relative flex items-center w-full rounded-xl bg-ink-600 overflow-visible ring-1 ring-white/10 focus-within:ring-sun/70 transition ${
        compact ? "min-w-0" : ""
      }`}
    >
      <div className="flex items-center w-full rounded-xl overflow-hidden bg-ink-600">
      <Search size={18} className="text-ink-300 shrink-0 ml-3" />

      <input
        className={`flex-1 outline-none bg-transparent text-sm text-white placeholder:text-ink-300 px-2 min-w-0 ${
          compact ? "h-10" : "h-10 lg:h-11"
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
        className={`bg-sun hover:bg-sun-600 text-white text-sm font-semibold transition shrink-0 ${
          compact ? "h-10 px-3.5" : "h-10 lg:h-11 px-4 lg:px-5"
        }`}
      >
        Найти
      </button>
      </div>

      {suggestionList}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 bg-ink-700 text-white border-b border-white/5 shadow-soft">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div
          className={`hidden lg:flex items-center gap-2 sm:gap-3 transition-all duration-300 ${
            scrolled ? "h-14" : "h-16 lg:h-[72px]"
          }`}
        >
          <Link to="/" className="flex items-center gap-2 group shrink-0 min-w-0">
            <img
              src="/oriyon.store.png"
              alt="Oriyon Store"
              className={`object-contain transition-all duration-300 group-hover:scale-105 ${
                scrolled ? "w-10 h-10" : "w-12 h-12 lg:w-14 lg:h-14"
              }`}
            />

            <span
              className={`brand-wordmark transition-all duration-300 truncate ${
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
            className="inline-flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl border border-sun/50 text-sun text-sm font-semibold hover:bg-sun/10 transition"
          >
            <PlusCircle size={17} />
            Добавить объявление
          </Link>

          <div className="flex-1 min-w-0 relative">{searchField(false)}{suggestionList}</div>

          <nav className="flex items-center gap-0.5 shrink-0">
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
              {badgeCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {badgeCount > 99 ? "99+" : badgeCount}
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

            {canModerate && (
              <Link
                to="/admin?section=moderation"
                className="relative p-2.5 rounded-lg hover:bg-white/10 transition"
                title="Модерация"
              >
                <ClipboardCheck size={20} />
                {moderationCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {moderationCount > 99 ? "99+" : moderationCount}
                  </span>
                )}
              </Link>
            )}

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
        </div>

        <div className="lg:hidden pt-2 pb-2.5 relative">
          <div className="flex items-center gap-2">
            <Link to="/" className="shrink-0" aria-label="На главную">
              <img
                src="/oriyon.store.png"
                alt="Oriyon Store"
                className="w-9 h-9 object-contain"
              />
            </Link>

            <div className="flex-1 min-w-0 relative">
              {searchField(true)}
              {suggestionList}
            </div>
          </div>
        </div>
      </div>

      {isBrowsePage && <CategoryStrip compact={compactCategories} />}
    </header>
  );
}
