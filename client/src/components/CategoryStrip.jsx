import React from "react";
import { Link, useLocation } from "react-router-dom";
import { HOME_CATEGORIES } from "../data/categories";
import { CATEGORY_NAV_META } from "../data/categoryNav";

export default function CategoryStrip({ compact = false }) {
  const { pathname } = useLocation();

  return (
    <div className="border-t border-white/10 bg-gradient-to-b from-ink-800 to-[#141316]">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <nav
          aria-label="Категории"
          className={`category-strip-scroll flex items-start gap-1 sm:gap-2 overflow-x-auto lg:overflow-visible lg:justify-between ${
            compact ? "py-2" : "py-2.5 sm:py-3"
          }`}
        >
          {HOME_CATEGORIES.map((cat) => {
            const active =
              pathname === cat.landingPath || pathname === `/c/${cat.slug}`;
            const meta = CATEGORY_NAV_META[cat.slug] || CATEGORY_NAV_META.repair;
            const Icon = meta.Icon;

            return (
              <Link
                key={cat.slug}
                to={cat.landingPath}
                title={cat.title}
                className={`group shrink-0 flex flex-col items-center text-center transition lg:flex-1 lg:max-w-[7.5rem] ${
                  compact ? "min-w-[4.5rem]" : "min-w-[4.75rem] sm:min-w-[5.25rem]"
                }`}
              >
                <div
                  className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br ring-1 transition-all duration-200 ${
                    compact ? "h-10 w-10 sm:h-11 sm:w-11" : "h-11 w-11 sm:h-12 sm:w-12"
                  } ${meta.accent} ${meta.ringClass} ${
                    active
                      ? `${meta.activeRing} ring-2 scale-[1.03]`
                      : "ring-white/10 group-hover:scale-[1.04] group-hover:ring-white/20"
                  }`}
                >
                  <Icon
                    className={`${compact ? "h-[18px] w-[18px] sm:h-5 sm:w-5" : "h-5 w-5 sm:h-[22px] sm:w-[22px]"} ${meta.iconClass} transition group-hover:scale-110`}
                    strokeWidth={active ? 2.25 : 2}
                  />

                  {active && (
                    <span className="absolute -bottom-0.5 left-1/2 h-1 w-5 -translate-x-1/2 rounded-full bg-sun" />
                  )}
                </div>

                <span
                  className={`mt-1.5 w-full px-0.5 font-medium leading-snug transition ${
                    active
                      ? "text-sun"
                      : "text-white/80 group-hover:text-white"
                  } ${compact ? "text-[10px]" : "text-[11px] sm:text-xs"}`}
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
