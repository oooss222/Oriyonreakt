import React from "react";
import { Link, useLocation } from "react-router-dom";
import { HOME_CATEGORIES } from "../data/categories";
import { useI18n } from "../i18n";
import { cn } from "../ui";

export default function CategoryStrip({ compact = false }) {
  const { pathname } = useLocation();
  const { t } = useI18n();

  const labelOf = (cat) => {
    const key = `categories.${cat.slug}`;
    const translated = t(key);
    return translated === key ? cat.fullTitle || cat.title : translated;
  };

  return (
    <div className="border-b border-ink-200 bg-white">
      <div className="page-container">
        <nav
          aria-label={t("a11y.categories")}
          className={cn(
            "flex items-stretch gap-1 overflow-x-auto scroll-fade-x scrollbar-none lg:justify-center lg:overflow-visible",
            compact ? "py-2" : "py-2.5 sm:py-3"
          )}
        >
          {HOME_CATEGORIES.map((cat) => {
            const active =
              pathname === cat.landingPath ||
              pathname === `/c/${cat.slug}` ||
              (cat.slug === "realestate" && pathname.startsWith("/realestate/"));

            const label = labelOf(cat);

            return (
              <Link
                key={cat.slug}
                to={cat.landingPath}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex w-[88px] shrink-0 flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-center transition-colors sm:w-[96px] lg:w-[104px]",
                  active ? "bg-sun-50" : "hover:bg-mist-100"
                )}
              >
                <span
                  className={cn(
                    "relative block w-full overflow-hidden rounded-lg bg-mist-200 ring-1 transition",
                    compact ? "h-10" : "h-11 sm:h-12",
                    active ? "ring-sun-300" : "ring-ink-200 group-hover:ring-ink-300"
                  )}
                >
                  <img
                    src={cat.img}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(event) => {
                      event.currentTarget.src = "/img/placeholder.jpg";
                    }}
                  />
                </span>

                <span
                  className={cn(
                    "line-clamp-2 w-full text-2xs font-semibold leading-tight transition-colors sm:text-xs",
                    active ? "text-sun-800" : "text-ink-600 group-hover:text-ink-900"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
