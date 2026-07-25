import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { HOME_CATEGORIES } from "../data/categories";

export default function CategoryStrip({ compact = false }) {
  const { pathname } = useLocation();
  const scrollRef = React.useRef(null);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const updateScrollState = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  React.useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);

    return () => window.removeEventListener("resize", updateScrollState);
  }, [updateScrollState, compact]);

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 220, behavior: "smooth" });
  };

  return (
    <div className="relative border-t border-white/10 bg-ink-800">
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className={`flex gap-2 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          compact ? "px-3 py-2" : "px-4 py-3"
        }`}
      >
        {HOME_CATEGORIES.map((cat) => {
          const active = pathname === `/c/${cat.slug}`;

          return (
            <Link
              key={cat.slug}
              to={`/c/${cat.slug}`}
              className={`group shrink-0 flex flex-col items-center text-center transition ${
                compact ? "w-[68px]" : "w-[84px] sm:w-[92px]"
              }`}
            >
              <div
                className={`relative w-full overflow-hidden rounded-xl bg-ink-600 ring-1 ring-white/10 transition group-hover:ring-sun/70 ${
                  active ? "ring-sun" : ""
                } ${compact ? "h-[52px]" : "h-[64px] sm:h-[72px]"}`}
              >
                <img
                  src={cat.img}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
              </div>

              <span
                className={`mt-1.5 w-full font-medium text-white/90 leading-tight line-clamp-2 transition group-hover:text-sun ${
                  compact ? "text-[10px]" : "text-[11px] sm:text-xs"
                }`}
              >
                {cat.title}
              </span>
            </Link>
          );
        })}
      </div>

      {canScrollRight && (
        <button
          type="button"
          onClick={scrollRight}
          aria-label="Прокрутить категории"
          className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 grid place-items-center rounded-xl bg-ink-600 border border-white/10 text-sun shadow-soft hover:bg-ink-500 transition ${
            compact ? "w-8 h-8" : "w-9 h-9"
          }`}
        >
          <ChevronRight size={compact ? 16 : 18} />
        </button>
      )}
    </div>
  );
}
