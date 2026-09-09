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
  X,
} from "lucide-react";

import { api } from "../lib/api";
import { trackSearch } from "../lib/track";
import { TOKEN_KEY, USER_KEY } from "../lib/auth";
import { canAccessModeration } from "../lib/adminUtils";
import { subscribeModerationQueue } from "../lib/moderationSocket";
import { useUnreadCount } from "../lib/unread";
import CategoryStrip from "./CategoryStrip";
import HeaderSearchSuggestions, { useSearchSuggestions } from "./HeaderSearchSuggestions";
import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "../i18n";
import {
  readCompareIds,
  getActiveCompareCat,
  findCompareCatWithItems,
} from "../lib/compareListings";
import { getComparePath } from "../lib/compareConfig";
import { cn } from "../ui";

/** Icon link with a counter. 44px square so it is comfortable on touch. */
function NavIconLink({ to, icon: Icon, label, count = 0, tone = "danger" }) {
  const toneClass = {
    danger: "bg-danger-600",
    sun: "bg-sun-500",
    warning: "bg-warning-600",
  }[tone];

  return (
    <Link
      to={to}
      aria-label={count > 0 ? `${label} (${count})` : label}
      title={label}
      className="relative grid h-11 w-11 place-items-center rounded-xl text-ink-600 transition-colors hover:bg-mist-100 hover:text-ink-900"
    >
      <Icon size={20} strokeWidth={1.9} aria-hidden="true" />

      {count > 0 && (
        <span
          className={cn(
            "absolute right-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-2xs font-bold text-white ring-2 ring-white",
            toneClass
          )}
          aria-hidden="true"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

export default function Header({ variant = "full" }) {
  const nav = useNavigate();
  const location = useLocation();
  const [sp] = useSearchParams();
  const isMinimal = variant === "minimal";
  const { t, lang } = useI18n();

  const numberLocale = lang === "en" ? "en-US" : lang === "tg" ? "tg-TJ" : "ru-RU";

  const [q, setQ] = React.useState(sp.get("search") || sp.get("q") || "");
  const [catalogTotal, setCatalogTotal] = React.useState(0);
  const [suggestionsOpen, setSuggestionsOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [moderationCount, setModerationCount] = React.useState(0);
  const [compareCount, setCompareCount] = React.useState(0);
  const [comparePath, setComparePath] = React.useState("/realestate/sravnenie");

  const inputRef = React.useRef(null);
  const listboxId = React.useId();
  const optionId = React.useCallback((index) => `${listboxId}-option-${index}`, [listboxId]);

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
  const badgeCount = useUnreadCount(Boolean(token) && !onMessagesPage);
  const canModerate = canAccessModeration(user?.role);

  const { items: suggestions, loading: suggestionsLoading } = useSearchSuggestions(
    q,
    suggestionsOpen && !isMinimal
  );

  React.useEffect(() => {
    setActiveIndex(-1);
  }, [q]);

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

  React.useEffect(() => {
    const syncCompare = () => {
      const pathCat = getActiveCompareCat(pathname);
      const activeCat = findCompareCatWithItems(pathCat) || pathCat || "realestate";
      setComparePath(getComparePath(activeCat));
      setCompareCount(readCompareIds(activeCat).length);
    };

    syncCompare();
    window.addEventListener("oriyon:compare-change", syncCompare);
    return () => window.removeEventListener("oriyon:compare-change", syncCompare);
  }, [pathname]);

  React.useEffect(() => {
    let active = true;

    api
      .listingCount({})
      .then((data) => {
        if (active) setCatalogTotal(Number(data?.total || 0));
      })
      .catch(() => {
        if (active) setCatalogTotal(0);
      });

    return () => {
      active = false;
    };
  }, []);

  const searchPlaceholder = React.useMemo(() => {
    if (!catalogTotal) return t("header.searchPlaceholder");
    return t("header.searchAmong", { count: catalogTotal.toLocaleString(numberLocale) });
  }, [catalogTotal, t, numberLocale]);

  const go = React.useCallback(
    (text = q) => {
      const value = String(text || "").trim();
      setSuggestionsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();

      if (value) {
        trackSearch(value);
        nav(`/listing?search=${encodeURIComponent(value)}`);
      } else {
        nav("/listing");
      }
    },
    [q, nav]
  );

  const openSuggestion = React.useCallback(
    (ad, id) => {
      sessionStorage.setItem("ad_preview", JSON.stringify(ad));
      setSuggestionsOpen(false);
      setActiveIndex(-1);
      nav(`/ad/${id}`);
    },
    [nav]
  );

  const onSearchKeyDown = (event) => {
    if (event.key === "Escape") {
      setSuggestionsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key === "Enter") {
      const picked = suggestions[activeIndex];

      if (picked) {
        event.preventDefault();
        openSuggestion(picked, picked.id || picked._id);
        return;
      }

      go();
      return;
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    if (suggestions.length === 0) return;

    event.preventDefault();
    setSuggestionsOpen(true);
    // The cycle has one extra slot past the last option, which means "back to
    // whatever I typed".
    const slots = suggestions.length + 1;
    const delta = event.key === "ArrowDown" ? 1 : -1;
    setActiveIndex((prev) => (prev + delta + slots + 1) % slots);
  };

  const expanded = suggestionsOpen && (suggestions.length > 0 || suggestionsLoading);

  const searchField = (
    <div className="relative w-full">
      <div
        className="flex h-11 w-full items-center overflow-hidden rounded-xl border border-ink-200 bg-white
                   transition focus-within:border-sun-400 focus-within:ring-2 focus-within:ring-sun/25"
      >
        <Search size={18} className="ml-3 shrink-0 text-ink-400" aria-hidden="true" />

        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-label={t("a11y.mainSearch")}
          aria-expanded={expanded}
          aria-controls={expanded ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 && activeIndex < suggestions.length ? optionId(activeIndex) : undefined
          }
          className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm text-ink-900 outline-none
                     placeholder:text-ink-400 [&::-webkit-search-cancel-button]:hidden"
          value={q}
          onFocus={() => setSuggestionsOpen(true)}
          onBlur={() => setTimeout(() => setSuggestionsOpen(false), 120)}
          onChange={(event) => {
            setQ(event.target.value);
            setSuggestionsOpen(true);
          }}
          onKeyDown={onSearchKeyDown}
          placeholder={searchPlaceholder}
        />

        {q && (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setQ("");
              inputRef.current?.focus();
            }}
            aria-label={t("a11y.clearSearch")}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 transition hover:bg-mist-100 hover:text-ink-900"
          >
            <X size={15} aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          onClick={() => go()}
          aria-label={t("a11y.submitSearch")}
          className="ml-1 h-11 shrink-0 bg-sun-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-sun-600 sm:px-5"
        >
          <Search size={17} strokeWidth={2.4} className="sm:hidden" aria-hidden="true" />
          <span className="hidden sm:inline">{t("common.find")}</span>
        </button>
      </div>

      {suggestionsOpen && (
        <HeaderSearchSuggestions
          listboxId={listboxId}
          optionId={optionId}
          items={suggestions}
          loading={suggestionsLoading}
          activeIndex={activeIndex}
          onSelect={openSuggestion}
          onNavigate={() => go()}
        />
      )}
    </div>
  );

  const logo = (
    <Link to="/" className="group flex shrink-0 items-center gap-2" aria-label="Oriyon.store">
      <img
        src="/oriyon.store.png"
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 object-contain transition-transform duration-200 group-hover:scale-105"
      />
      <span className="brand-wordmark hidden text-lg text-ink-900 sm:inline">
        Oriyon
        <span className="text-sun-500">.</span>
        <span className="text-2xs font-bold uppercase tracking-wider text-ink-400">store</span>
      </span>
    </Link>
  );

  return (
    <>
      <header
        className="sticky top-0 border-b border-ink-200 bg-white"
        style={{ zIndex: "var(--z-header)" }}
      >
        <div className="page-container">
          {/* Desktop */}
          <div className="hidden h-16 items-center gap-3 lg:flex">
            {logo}

            {isMinimal ? (
              <div className="flex-1" aria-hidden="true" />
            ) : (
              <div className="min-w-0 flex-1">{searchField}</div>
            )}

            {isMinimal ? (
              <nav className="flex items-center gap-1" aria-label={t("nav.mobileNav")}>
                <Link to="/listing" className="btn btn-ghost">
                  {t("nav.catalog")}
                </Link>
                <Link to="/" className="btn btn-ghost">
                  {t("nav.backHome")}
                </Link>
                <LanguageSwitcher />
              </nav>
            ) : (
              <nav className="flex shrink-0 items-center gap-0.5" aria-label={t("nav.mobileNav")}>
                <NavIconLink to="/profile?tab=fav" icon={Heart} label={t("nav.favorites")} />
                <NavIconLink
                  to="/messages"
                  icon={MessageCircle}
                  label={t("nav.messages")}
                  count={badgeCount}
                />
                <NavIconLink
                  to={comparePath}
                  icon={Scale}
                  label={t("nav.compare")}
                  count={compareCount}
                  tone="sun"
                />

                {canModerate && (
                  <NavIconLink
                    to="/admin?section=moderation"
                    icon={ClipboardCheck}
                    label={t("nav.moderation")}
                    count={moderationCount}
                    tone="warning"
                  />
                )}

                {token ? (
                  <>
                    <NavIconLink to="/profile?tab=wallet" icon={Wallet} label={t("nav.wallet")} />
                    <NavIconLink
                      to="/profile?tab=profile"
                      icon={User}
                      label={user?.name || t("nav.profile")}
                    />
                  </>
                ) : (
                  <NavIconLink to="/auth" icon={LogIn} label={t("nav.login")} />
                )}

                <LanguageSwitcher className="ml-1" />

                <Link to="/add" className="btn btn-primary ml-2 shrink-0">
                  <Plus size={17} strokeWidth={2.4} aria-hidden="true" />
                  {t("header.addListing")}
                </Link>
              </nav>
            )}
          </div>

          {/* Mobile */}
          {isMinimal ? (
            <div className="flex h-14 items-center justify-between gap-3 lg:hidden">
              {logo}

              <div className="flex items-center gap-1">
                <Link to="/listing" className="btn btn-ghost btn-sm">
                  {t("nav.catalog")}
                </Link>
                <LanguageSwitcher />
              </div>
            </div>
          ) : (
            <div className="flex h-14 items-center gap-2 lg:hidden">
              <Link to="/" className="shrink-0" aria-label={t("nav.backHome")}>
                <img
                  src="/oriyon.store.png"
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain"
                />
              </Link>

              <div className="min-w-0 flex-1">{searchField}</div>

              <LanguageSwitcher />
            </div>
          )}
        </div>
      </header>

      {isBrowsePage && <CategoryStrip compact={pathname !== "/"} />}
    </>
  );
}
