import React from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  Home,
  Heart,
  PlusCircle,
  MessageCircle,
  User,
} from "lucide-react";
import { api } from "../lib/api";
import { TOKEN_KEY } from "../lib/auth";
import {
  getUnreadTotal,
  subscribeUnreadCount,
  subscribeUnreadRefresh,
} from "../lib/unread";
import { useI18n } from "../i18n";

export default function MobileNav() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "my";
  const token = localStorage.getItem(TOKEN_KEY) || "";
  const [unreadCount, setUnreadCount] = React.useState(0);
  const { t } = useI18n();

  const navItems = React.useMemo(
    () => [
      { to: "/", label: t("nav.home"), icon: Home, match: (path) => path === "/" },
      {
        to: "/profile?tab=fav",
        label: t("nav.favorites"),
        icon: Heart,
        match: (path, tabValue) =>
          path === "/profile" && (tabValue === "fav" || tabValue === "favorites"),
      },
      {
        to: "/add",
        label: t("nav.add"),
        icon: PlusCircle,
        highlight: true,
        match: (path) => path === "/add" || path.startsWith("/edit/"),
      },
      {
        to: "/messages",
        label: t("nav.chat"),
        icon: MessageCircle,
        badge: true,
        match: (path) => path === "/messages",
      },
      {
        to: "/profile",
        label: t("nav.profile"),
        icon: User,
        match: (path, tabValue) =>
          path === "/profile" && tabValue !== "fav" && tabValue !== "favorites",
      },
    ],
    [t]
  );

  const loadUnread = React.useCallback(async () => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {
      const data = await api.messageInbox(token);
      setUnreadCount(getUnreadTotal(data));
    } catch {
      setUnreadCount(0);
    }
  }, [token]);

  React.useEffect(() => {
    loadUnread();
    const timer = setInterval(loadUnread, 15000);
    return () => clearInterval(timer);
  }, [loadUnread]);

  React.useEffect(() => subscribeUnreadCount(setUnreadCount), []);
  React.useEffect(() => subscribeUnreadRefresh(loadUnread), [loadUnread]);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-ink/10 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 pb-[max(env(safe-area-inset-bottom),0px)]"
      aria-label={t("nav.mobileNav")}
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        {navItems.map(({ to, label, icon: Icon, highlight, badge, match }) => {
          const active = match(pathname, tab);
          const showBadge = badge && unreadCount > 0;

          return (
            <Link
              key={to}
              to={to}
              className={`relative flex flex-col items-center justify-end gap-0.5 pb-1.5 text-[10px] font-semibold transition min-w-0 px-0.5 ${
                active
                  ? "text-sun"
                  : highlight
                  ? "text-sun"
                  : "text-ink-400"
              }`}
            >
              <span
                className={`relative grid place-items-center rounded-xl transition ${
                  highlight
                    ? "w-11 h-11 -mt-5 bg-sun text-white shadow-soft"
                    : "w-8 h-8"
                } ${active && !highlight ? "bg-sun-50" : ""}`}
              >
                <Icon size={highlight ? 22 : 20} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
              <span className="truncate w-full text-center leading-none">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
