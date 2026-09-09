import React from "react";
import { CATS } from "../../data/listingCategories";
import { useI18n } from "../../i18n";

const CAT_ICONS = {
  realestate: "🏠",
  transport: "🚗",
  furniture: "🪑",
  phones: "📱",
  electronics: "📺",
  computers: "💻",
  services: "🛠️",
  repair: "🧱",
};

export default function ListingCategoryPicker({ onSelect, selected = "" }) {
  const { t } = useI18n();

  return (
    <section className="card overflow-hidden" aria-labelledby="listing-pick-cat">
      <header className="border-b border-ink-200 px-4 py-3.5 sm:px-5">
        <h2
          id="listing-pick-cat"
          className="text-base font-bold text-ink-900"
        >
          {t("listing.pickCategoryTitle")}
        </h2>
        <p className="mt-0.5 text-sm text-ink-400">
          {t("listing.pickCategoryHint")}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:p-5 lg:grid-cols-4">
        {Object.entries(CATS).map(([key, cat]) => {
          const active = selected === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-pressed={active}
              className={`rounded-2xl border p-4 text-left transition ${
                active
                  ? "border-sun-300 bg-sun-50 shadow-xs"
                  : "border-ink-200 bg-white hover:border-sun-200 hover:bg-mist-50 hover:shadow-xs"
              }`}
            >
              <span className="mb-2 block text-2xl leading-none" aria-hidden>
                {CAT_ICONS[key] || "📦"}
              </span>
              <span className="block text-sm font-semibold leading-snug text-ink-900">
                {cat.shortTitle || cat.title}
              </span>
              {cat.desc ? (
                <span className="mt-1 block text-xs leading-snug text-ink-400 line-clamp-2">
                  {cat.desc}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
