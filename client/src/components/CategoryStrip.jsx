import React from "react";
import { Link, useLocation } from "react-router-dom";
import { HOME_CATEGORIES } from "../data/categories";

export default function CategoryStrip({ compact = false }) {
  const { pathname } = useLocation();

  return (
    <div className="border-t border-white/10 bg-ink-800">
      <div className="container mx-auto max-w-7xl px-2 sm:px-4">
        <nav
          aria-label="Категории"
          className={`flex items-start gap-2 sm:gap-3 lg:gap-4 overflow-x-auto lg:overflow-visible lg:justify-center scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            compact ? "py-2 lg:py-2.5" : "py-3 lg:py-4"
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
                className="group shrink-0 flex w-[84px] sm:w-[92px] lg:w-[104px] xl:w-[112px] flex-col items-center text-center"
              >
                <div
                  className={`relative h-[50px] sm:h-[56px] lg:h-[68px] xl:h-[72px] w-full overflow-hidden rounded-xl lg:rounded-2xl bg-ink-600 ring-1 transition duration-200 group-hover:ring-sun/60 group-hover:shadow-md ${
                    active
                      ? "ring-sun shadow-[0_0_0_1px_rgba(255,122,26,0.4)]"
                      : "ring-white/10"
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

                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/15 to-transparent" />

                  {active && (
                    <span className="absolute bottom-1 left-1/2 h-1 w-5 -translate-x-1/2 rounded-full bg-sun" />
                  )}
                </div>

                <span
                  className={`mt-1.5 lg:mt-2 min-h-[2.35rem] lg:min-h-[2.5rem] w-full px-0.5 font-medium leading-[1.2] transition group-hover:text-sun ${
                    active ? "text-sun" : "text-white/95"
                  } ${compact ? "text-[11px] lg:text-sm" : "text-[11px] sm:text-xs lg:text-sm"}`}
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
