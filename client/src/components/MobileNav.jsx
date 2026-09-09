import React from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Home, Heart, Plus, MessageCircle, User } from "lucide-react";
import { TOKEN_KEY } from "../lib/auth";
import { useUnreadCount } from "../lib/unread";
import { useI18n } from "../i18n";
import { cn } from "../ui";

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
        icon: Plus,
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
      className="fixed inset-x-0 bottom-0 border-t border-ink-200 bg-white/95 backdrop-blur-md
                 supports-[backdrop-filter]:bg-white/90 pb-[max(env(safe-area-inset-bottom),0px)] lg:hidden"
      style={{ zIndex: "var(--z-mobile-nav)" }}
      aria-label={t("nav.mobileNav")}
    >
      {showPolicyLink && (
        <div className="border-b border-ink-100 px-4 py-1.5 text-center">
          <Link
            to="/policy"
            className="text-2xs font-semibold text-ink-400 transition-colors hover:text-ink-900"
          >
            {t("nav.policy")}
          </Link>
        </div>
      )}

      <div className="mx-auto grid h-[4.25rem] max-w-lg grid-cols-5">
        {navItems.map(({ to, label, icon: Icon, highlight, badge, match }) => {
          const active = match(pathname, tab);
          const showBadge = badge && unreadCount > 0;

          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              aria-label={showBadge ? `${label} (${unreadCount})` : undefined}
              className={cn(
                "relative flex min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-2xs font-semibold transition-colors",
                active || highlight ? "text-sun-700" : "text-ink-500"
              )}
            >
              <span
                className={cn(
                  "relative grid place-items-center rounded-xl transition-colors",
                  highlight
                    ? "h-10 w-12 bg-sun-500 text-white"
                    : cn("h-8 w-12", active && "bg-sun-50")
                )}
              >
                <Icon size={highlight ? 22 : 20} strokeWidth={active || highlight ? 2.3 : 1.9} aria-hidden="true" />

                {showBadge && (
                  <span
                    className="absolute -right-0.5 -top-1 flex h-4 min-w-[16px] items-center justify-center
                               rounded-full bg-danger-600 px-1 text-2xs font-bold text-white ring-2 ring-white"
                    aria-hidden="true"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>

              <span className="w-full truncate text-center leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
