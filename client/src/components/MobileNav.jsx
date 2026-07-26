import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  PlusCircle,
  MessageCircle,
  User,
} from "lucide-react";

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

  if (pathname === "/messages" || pathname === "/auth") {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 xl:hidden border-t border-ink/10 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Мобильная навигация"
    >
      <div className="grid grid-cols-5 h-16">
        {NAV_ITEMS.map(({ to, label, icon: Icon, highlight, match }) => {
          const active = match(pathname);

          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition ${
                active
                  ? "text-sun"
                  : highlight
                  ? "text-sun"
                  : "text-ink-400 hover:text-ink"
              }`}
            >
              <span
                className={`grid place-items-center rounded-xl transition ${
                  highlight
                    ? "w-10 h-10 -mt-4 bg-sun text-white shadow-soft"
                    : "w-8 h-8"
                } ${active && !highlight ? "bg-sun-50" : ""}`}
              >
                <Icon size={highlight ? 22 : 20} />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
