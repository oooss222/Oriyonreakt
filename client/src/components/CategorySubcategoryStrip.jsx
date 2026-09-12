import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../i18n";

/**
 * Paydo-style horizontal strip of equal subcategory tiles on a category landing.
 */
export default function CategorySubcategoryStrip({
  items = [],
  slug,
  counts = {},
}) {
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
  }, [updateScrollState, items.length]);

  const scrollByPage = (direction) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(220, Math.round(el.clientWidth * 0.65)) * direction;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  if (!items.length) return null;

  return (
    <div className="subcat-strip">
      {canPrev && (
        <button
          type="button"
          className="subcat-strip__arrow subcat-strip__arrow--prev"
          onClick={() => scrollByPage(-1)}
          aria-label={t("common.prev")}
        >
          <ChevronLeft size={18} />
        </button>
      )}

      <nav ref={scrollerRef} className="subcat-strip__track" aria-label={t("category.subcatsFound")}>
        {items.map((item) => {
          const filter = item.filterValue || item.label;
          const count = counts[filter] || item.count || 0;
          const to = `/listing?cat=${slug}&subcategory=${encodeURIComponent(filter)}`;

          return (
            <Link key={filter} to={to} className="subcat-strip__item group" title={item.label}>
              <div className="subcat-strip__media">
                {item.img ? (
                  <img
                    src={item.img}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    className="subcat-strip__img"
                  />
                ) : (
                  <span className="subcat-strip__glyph" aria-hidden>
                    {item.glyph || item.label.slice(0, 1)}
                  </span>
                )}
              </div>
              <span className="subcat-strip__label">
                {item.label}
                {count > 0 ? ` (${count})` : ""}
              </span>
            </Link>
          );
        })}
      </nav>

      {canNext && (
        <button
          type="button"
          className="subcat-strip__arrow subcat-strip__arrow--next"
          onClick={() => scrollByPage(1)}
          aria-label={t("common.next")}
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}
