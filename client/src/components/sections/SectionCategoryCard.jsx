import React from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { getSubcategoryBrowsePath } from "../../lib/categoryRoutes";
import { useI18n } from "../../i18n";

const AUTO_OPEN_LIMIT = 4;
const PREVIEW_LIMIT = 8;

export default function SectionCategoryCard({
  slug,
  title,
  fullTitle,
  desc,
  img,
  to,
  listingCount,
  subcategories = [],
  featured = false,
}) {
  const { t, lang } = useI18n();
  const reactId = React.useId();
  const [open, setOpen] = React.useState(false);
  const panelId = `section-subs-${slug}-${reactId}`;
  const numberLocale =
    lang === "en" ? "en-US" : lang === "tg" ? "tg-TJ" : "ru-RU";

  const hasSubs = subcategories.length > 0;
  const autoOpen = hasSubs && subcategories.length <= AUTO_OPEN_LIMIT;
  const expanded = autoOpen || open;
  const visibleSubs = expanded
    ? subcategories.slice(0, PREVIEW_LIMIT)
    : [];
  const hiddenCount = Math.max(0, subcategories.length - PREVIEW_LIMIT);
  const showToggle = hasSubs && !autoOpen;

  return (
    <article
      id={`section-${slug}`}
      className={`section-card ${featured ? "section-card--featured" : ""}`}
    >
      <div className="section-card__row">
        <Link
          to={to}
          className="section-card__main"
          aria-label={t("sections.openCategory", { name: fullTitle || title })}
        >
          <span className="section-card__media" aria-hidden="true">
            <img
              src={img}
              alt=""
              loading="lazy"
              draggable={false}
              onError={(event) => {
                event.currentTarget.src = "/img/placeholder.jpg";
              }}
            />
          </span>

          <span className="section-card__copy">
            <span className="section-card__title">{title}</span>
            <span className="section-card__meta">
              {listingCount > 0 ? (
                <span>
                  {t("listing.count", {
                    count: listingCount.toLocaleString(numberLocale),
                  })}
                </span>
              ) : null}
              {hasSubs ? (
                <span>
                  {t("sections.subcount", { count: subcategories.length })}
                </span>
              ) : null}
              {!listingCount && !hasSubs && desc ? (
                <span className="line-clamp-1">{desc}</span>
              ) : null}
            </span>
          </span>
        </Link>

        {showToggle ? (
          <button
            type="button"
            className="section-card__toggle"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">
              {open ? t("sections.hideSubs") : t("sections.showSubs")}
            </span>
            <ChevronDown
              size={18}
              className={`transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>
        ) : null}
      </div>

      {expanded && hasSubs ? (
        <div id={panelId} className="section-card__subs">
          <ul>
            {visibleSubs.map((sub) => (
              <li key={sub.value}>
                <Link to={getSubcategoryBrowsePath(slug, sub.value)}>
                  {sub.label}
                </Link>
              </li>
            ))}
          </ul>

          {hiddenCount > 0 ? (
            <Link to={to} className="section-card__more">
              {t("sections.moreSubs")}
            </Link>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
