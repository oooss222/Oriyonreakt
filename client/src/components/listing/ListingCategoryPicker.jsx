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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(CATS).map(([key, cat]) => {
            const active = selected === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                className={`rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-sun/40 bg-sun-50 shadow-soft"
                    : "border-ink/10 bg-white hover:border-sun/25 hover:bg-mist/40"
                }`}
              >
                <div className="text-2xl mb-2" aria-hidden>
                  {CAT_ICONS[key] || "📦"}
                </div>
                <div className="font-semibold text-ink text-sm leading-snug">
                  {cat.shortTitle || cat.title}
                </div>
                {cat.desc ? (
                  <div className="mt-1 text-xs text-ink-400 line-clamp-2">
                    {cat.desc}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
