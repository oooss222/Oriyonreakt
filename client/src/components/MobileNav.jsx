import React from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  Home,
  Heart,
  PlusCircle,
  MessageCircle,
  User,
} from "lucide-react";
import { TOKEN_KEY } from "../lib/auth";
import { useUnreadCount } from "../lib/unread";
import { useI18n } from "../i18n";
import UnreadBadge from "./UnreadBadge";

export default function MobileNav({ showPolicyLink = false }) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "my";
  const token = localStorage.getItem(TOKEN_KEY) || "";
  const unreadCount = useUnreadCount(Boolean(token));
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

  return (
    <nav
      data-mobile-nav
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-ink/10 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 pb-[max(env(safe-area-inset-bottom),0px)]"
      aria-label={t("nav.mobileNav")}
    >
      {showPolicyLink ? (
        <div className="border-b border-ink/5 px-4 py-1.5 text-center">
          <Link
            to="/policy"
            className="text-xs font-semibold text-ink-400 hover:text-sun transition"
          >
            {t("nav.policy")}
          </Link>
        </div>
      ) : null}
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        {navItems.map(({ to, label, icon: Icon, highlight, badge, match }) => {
          const active = match(pathname, tab);
          const showBadge = badge && unreadCount > 0;

          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-16 min-w-0 flex-col items-center justify-end gap-0.5 px-0.5 pb-1.5 text-[11px] font-semibold transition-colors duration-200 sm:text-xs ${
                active
                  ? "text-sun"
                  : highlight
                  ? "text-sun"
                  : "text-ink-400"
              }`}
            >
              <span
                className={`relative grid place-items-center rounded-xl transition-transform duration-200 ${
                  highlight
                    ? "w-12 h-12 -mt-5 bg-sun text-white shadow-soft"
                    : "w-9 h-9"
                } ${active && !highlight ? "bg-sun-50" : ""} ${
                  active ? "scale-105" : ""
                }`}
              >
                <Icon size={highlight ? 22 : 20} />
                {showBadge && <UnreadBadge count={unreadCount} ringed />}
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
