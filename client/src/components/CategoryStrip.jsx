import React from "react";
import { Link, useLocation } from "react-router-dom";
import { HOME_CATEGORIES } from "../data/categories";

export default function CategoryStrip({ compact = false, dense = false }) {
  const { pathname } = useLocation();
  const isCompact = compact || dense;

  return (
    <div className="border-t border-white/5 bg-ink-900/40">
      <div className="container mx-auto max-w-6xl px-2 sm:px-4">
        <nav
          aria-label="Категории"
          className={`flex items-center gap-1.5 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2 lg:justify-center ${
            isCompact ? "py-1.5" : "py-2.5"
          }`}
        >
          {HOME_CATEGORIES.map((cat) => {
            const active =
              pathname === cat.landingPath || pathname === `/c/${cat.slug}`;

            return (
              <Link
                key={cat.slug}
                to={cat.landingPath}
                title={cat.title}
                className={`group flex shrink-0 items-center gap-2 rounded-xl transition ${
                  isCompact
                    ? "px-2 py-1"
                    : "flex-col px-1.5 py-1 sm:w-[88px] lg:w-[96px]"
                } ${
                  active
                    ? "bg-white/10 ring-1 ring-sun/40"
                    : "hover:bg-white/[0.06]"
                }`}
              >
                <div
                  className={`relative shrink-0 overflow-hidden rounded-lg bg-ink-700 ring-1 ring-white/10 transition group-hover:ring-sun/40 ${
                    isCompact
                      ? "h-8 w-8"
                      : "h-11 w-11 sm:h-12 sm:w-full sm:rounded-xl lg:h-14"
                  }`}
                >
                  <img
                    src={cat.img}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = "/img/placeholder.jpg";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />
                </div>

                <span
                  className={`font-medium leading-tight transition group-hover:text-sun ${
                    active ? "text-sun" : "text-white/90"
                  } ${
                    isCompact
                      ? "whitespace-nowrap text-xs"
                      : "mt-0 w-full text-center text-[10px] sm:mt-1 sm:text-[11px] lg:text-xs"
                  }`}
                >
                  {cat.title}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
