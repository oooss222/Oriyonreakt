import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HOME_CATEGORIES } from "../data/categories";
import { useI18n } from "../i18n";

function getStripLabel(cat, t) {
  const shortKey = `categoriesShort.${cat.slug}`;
  const short = t(shortKey);
  if (short !== shortKey) return short;
  // Prefer data shortTitle over long i18n labels in the strip.
  return cat.title || t(`categories.${cat.slug}`);
}

export default function CategoryStrip({ compact = false }) {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const scrollerRef = React.useRef(null);
  const [canPrev, setCanPrev] = React.useState(false);
  const [canNext, setCanNext] = React.useState(false);

  const updateScrollState = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(maxScroll > 4 && el.scrollLeft < maxScroll - 4);
  }, []);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;

    updateScrollState();

    const onScroll = () => updateScrollState();
    const onWheel = (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      if (el.scrollWidth <= el.clientWidth) return;
      event.preventDefault();
      el.scrollLeft += event.deltaY;
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", onWheel);
      resizeObserver.disconnect();
    };
  }, [updateScrollState]);

  const scrollByPage = (direction) => {
    const el = scrollerRef.current;
    if (!el) return;

    const amount = Math.max(240, Math.round(el.clientWidth * 0.7)) * direction;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <div className="border-t border-white/10 bg-ink-800">
      <div className={`category-strip ${compact ? "category-strip--compact" : ""}`}>
        <button
          type="button"
          className={`category-strip__arrow category-strip__arrow--prev ${
            canPrev ? "" : "category-strip__arrow--hidden"
          }`}
          onClick={() => scrollByPage(-1)}
          aria-label={t("common.prev")}
          aria-hidden={!canPrev}
          tabIndex={canPrev ? 0 : -1}
          disabled={!canPrev}
        >
          <ChevronLeft size={20} />
        </button>

        <nav
          ref={scrollerRef}
          aria-label={t("a11y.categories")}
          className="category-strip__track"
        >
          {HOME_CATEGORIES.map((cat) => {
            const active =
              pathname === cat.landingPath ||
              pathname === `/c/${cat.slug}` ||
              (cat.slug === "realestate" && pathname.startsWith("/realestate/"));
            const label = getStripLabel(cat, t);
            const fullLabel =
              t(`categories.${cat.slug}`) !== `categories.${cat.slug}`
                ? t(`categories.${cat.slug}`)
                : cat.fullTitle || cat.title;

            return (
              <Link
                key={cat.slug}
                to={cat.landingPath}
                title={fullLabel}
                className={`category-strip__item group ${
                  active ? "category-strip__item--active" : ""
                }`}
              >
                <div className="category-strip__media">
                  <img
                    src={cat.img}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    className="category-strip__img"
                    onError={(e) => {
                      e.currentTarget.src = "/img/placeholder.jpg";
                    }}
                  />
                  <div className="category-strip__shade" />
                  {active && <span className="category-strip__dot" />}
                </div>

                <span className="category-strip__label">{label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className={`category-strip__arrow category-strip__arrow--next ${
            canNext ? "" : "category-strip__arrow--hidden"
          }`}
          onClick={() => scrollByPage(1)}
          aria-label={t("common.next")}
          aria-hidden={!canNext}
          tabIndex={canNext ? 0 : -1}
          disabled={!canNext}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
