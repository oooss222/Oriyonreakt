import React from "react";
import { Link } from "react-router-dom";
import { useI18n, getCategoryLabel } from "../i18n";

export default function CategoryHero({ cat, slug, total = 0 }) {
  const { t } = useI18n();

  const secondary =
    slug === "transport"
      ? { label: t("category.sellCar"), to: "/add?cat=transport" }
      : { label: t("footer.postListing"), to: `/add?cat=${slug}` };

  return (
    <header className="category-hero category-hero-banner">
      <div className="grid md:grid-cols-[1fr_min(42%,20rem)]">
        <div className="flex min-w-0 flex-col justify-center p-5 md:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="badge border-white/20 bg-white/10 text-white">
              {t("category.badge")}
            </span>
            {total > 0 && (
              <span className="text-xs text-white/75">
                {t("category.listingsCount", {
                  count: total.toLocaleString("ru-RU"),
                })}
              </span>
            )}
          </div>

          <h1 className="font-display text-2xl font-bold leading-tight md:text-3xl">
            {getCategoryLabel(slug, t) || cat.title}
          </h1>

          {cat.desc ? (
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/75">
              {cat.desc}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <Link to={`/listing?cat=${slug}`} className="btn btn-primary">
              {t("footer.allListings")}
            </Link>
            <Link
              to={secondary.to}
              className="btn border-white/25 bg-white/10 text-white hover:bg-white/20"
            >
              {secondary.label}
            </Link>
          </div>
        </div>

        <div className="relative hidden min-h-[12rem] items-end justify-center p-6 md:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgb(255_106_0_/_0.28),transparent_55%)]" />
          <img
            src={cat.img}
            alt=""
            loading="lazy"
            decoding="async"
            className="relative z-[1] max-h-44 w-auto object-contain"
          />
        </div>
      </div>

      <div className="flex items-center justify-center border-t border-white/10 bg-black/15 px-5 py-4 md:hidden">
        <img
          src={cat.img}
          alt=""
          loading="lazy"
          decoding="async"
          className="max-h-24 w-auto object-contain"
        />
      </div>
    </header>
  );
}
