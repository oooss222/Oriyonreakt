import React from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { HOME_CATEGORIES } from "../data/categories";
import { useI18n } from "../i18n";

/**
 * Category entry point on the home page. The dark CategoryStrip under the
 * header is a horizontally scrolling rail — easy to miss and it only ever
 * shows a few items at a time; on the home page people need to see the whole
 * catalogue at a glance, so this renders every category as a large tap target
 * instead. Collapsed to two rows on phones (13 tiles is a lot of scrolling
 * before the first listing) and expandable in place.
 */
export default function HomeCategoryGrid() {
  const { t } = useI18n();
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div>
      <div
        className={`home-category-grid ${
          expanded ? "" : "home-category-grid--collapsed"
        }`}
      >
        {HOME_CATEGORIES.map((cat) => {
          const translated = t(`categories.${cat.slug}`);
          const label =
            translated === `categories.${cat.slug}`
              ? cat.fullTitle || cat.title
              : translated;

          return (
            <Link
              key={cat.slug}
              to={cat.landingPath}
              className="home-category-tile group"
            >
              <span className="home-category-tile__media">
                <img
                  src={cat.img}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  onError={(e) => {
                    e.currentTarget.src = "/img/placeholder.jpg";
                  }}
                />
              </span>

              <span className="home-category-tile__label">{label}</span>
            </Link>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="home-category-toggle sm:hidden"
      >
        {expanded ? t("home.categoriesLess") : t("home.categoriesAll")}
        <ChevronDown
          size={16}
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
    </div>
  );
}
