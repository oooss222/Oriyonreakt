import React from "react";
import { Search } from "lucide-react";
import { CATS } from "../../data/listingCategories";
import { useI18n } from "../../i18n";

export default function ListingCategoryPicker({ onSelect, selected = "" }) {
  const { t } = useI18n();
  const [query, setQuery] = React.useState("");
  const needle = query.trim().toLowerCase();

  const categories = React.useMemo(() => {
    const rows = Object.entries(CATS).filter(([, cat]) => !cat.hiddenFromHome);
    rows.sort((a, b) => {
      const featured = Number(Boolean(b[1].featured)) - Number(Boolean(a[1].featured));
      if (featured) return featured;
      return (a[1].shortTitle || a[1].title).localeCompare(
        b[1].shortTitle || b[1].title,
        "ru"
      );
    });
    if (!needle) return rows;
    return rows.filter(([, cat]) => {
      const hay = `${cat.shortTitle || ""} ${cat.title || ""} ${cat.desc || ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [needle]);

  return (
    <section className="listing-form-card overflow-hidden">
      <div className="listing-form-card__head">
        <div className="listing-form-card__title">
          {t("listing.pickCategoryTitle")}
        </div>
      </div>
      <div className="listing-form-card__body">
        <p className="text-sm text-ink-400 mb-4">
          {t("listing.pickCategoryHint")}
        </p>

        <label className="listing-form-search mb-4">
          <Search className="listing-form-search__icon" size={16} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("listing.categorySearch")}
            className="listing-form-search__input"
          />
        </label>

        <div className="listing-form-cat-grid">
          {categories.map(([key, cat]) => {
            const active = selected === key;
            const title = cat.shortTitle || cat.title;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                className={`listing-form-cat-tile ${
                  active ? "listing-form-cat-tile--active" : ""
                }`}
              >
                <span className="listing-form-cat-tile__media" aria-hidden>
                  <img
                    src={cat.img}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    onError={(event) => {
                      event.currentTarget.src = "/img/placeholder.jpg";
                    }}
                  />
                </span>
                <span className="listing-form-cat-tile__copy">
                  <span className="listing-form-cat-tile__title">{title}</span>
                  {cat.desc ? (
                    <span className="listing-form-cat-tile__desc">{cat.desc}</span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>

        {categories.length === 0 ? (
          <p className="mt-4 text-sm text-ink-400">{t("listing.categorySearchEmpty")}</p>
        ) : null}
      </div>
    </section>
  );
}
