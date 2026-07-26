import React from "react";
import { Link, useLocation } from "react-router-dom";
import { HOME_CATEGORIES } from "../data/categories";

export default function CategoryStrip({ compact = false }) {
  const { pathname } = useLocation();
  const trackRef = React.useRef(null);
  const [overflowing, setOverflowing] = React.useState(false);

  React.useEffect(() => {
    const track = trackRef.current;

    if (!track) return undefined;

    const updateOverflow = () => {
      setOverflowing(track.scrollWidth > track.clientWidth + 2);
    };

    updateOverflow();

    const observer = new ResizeObserver(updateOverflow);
    observer.observe(track);

    window.addEventListener("resize", updateOverflow);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateOverflow);
    };
  }, [compact]);

  return (
    <div className="border-t border-white/10 bg-ink-800">
      <div className="container mx-auto max-w-5xl px-3 sm:px-4">
        <nav
          ref={trackRef}
          aria-label="Категории"
          className={`flex items-start gap-2 sm:gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            compact ? "py-2" : "py-3"
          } ${overflowing ? "justify-start" : "justify-center"}`}
        >
          {HOME_CATEGORIES.map((cat) => {
            const active = pathname === `/c/${cat.slug}`;

            return (
              <Link
                key={cat.slug}
                to={`/c/${cat.slug}`}
                className="group shrink-0 snap-center flex w-[72px] sm:w-[80px] flex-col items-center text-center"
              >
                <div
                  className={`relative h-[56px] sm:h-[64px] w-full overflow-hidden rounded-xl bg-ink-600 ring-1 transition duration-200 group-hover:ring-sun/70 ${
                    active
                      ? "ring-sun shadow-[0_0_0_1px_rgba(255,122,26,0.35)]"
                      : "ring-white/10"
                  }`}
                >
                  <img
                    src={cat.img}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = "/img/placeholder.jpg";
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent" />
                </div>

                <span
                  className={`mt-1.5 w-full px-0.5 font-medium leading-tight line-clamp-2 transition group-hover:text-sun ${
                    active ? "text-sun" : "text-white/90"
                  } ${compact ? "text-[10px]" : "text-[11px] sm:text-xs"}`}
                >
                  {cat.title}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
