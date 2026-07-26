import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  PlusCircle,
  MessageCircle,
  User,
} from "lucide-react";
import { api } from "../lib/api";
import { TOKEN_KEY } from "../lib/auth";

const NAV_ITEMS = [
  { to: "/", label: "Главная", icon: Home, match: (path) => path === "/" },
  {
    to: "/listing",
    label: "Поиск",
    icon: Search,
    match: (path) => path === "/listing" || path.startsWith("/c/"),
  },
  {
    to: "/add",
    label: "Добавить",
    icon: PlusCircle,
    highlight: true,
    match: (path) => path === "/add" || path.startsWith("/edit/"),
  },
  {
    to: "/messages",
    label: "Чат",
    icon: MessageCircle,
    badge: true,
    match: (path) => path === "/messages",
  },
  {
    to: "/profile",
    label: "Профиль",
    icon: User,
    match: (path) => path === "/profile" || path.startsWith("/profile"),
  },
];

export default function MobileNav() {
  const { pathname } = useLocation();
  const token = localStorage.getItem(TOKEN_KEY) || "";
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      return undefined;
    }

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

  if (pathname === "/messages" || pathname === "/auth") {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-ink/10 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 pb-[max(env(safe-area-inset-bottom),0px)]"
      aria-label="Мобильная навигация"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon, highlight, badge, match }) => {
          const active = match(pathname);
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
