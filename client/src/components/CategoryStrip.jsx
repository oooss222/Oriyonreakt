import React from "react";
import { Link, useLocation } from "react-router-dom";
import { HOME_CATEGORIES } from "../data/categories";

export default function CategoryStrip({ scrolled = false }) {
  const { pathname } = useLocation();

  return (
    <div className="border-t border-white/5 bg-[#10100f]">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <nav
          aria-label="Категории"
          className={`flex items-center gap-3 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:justify-center ${
            scrolled ? "py-2" : "py-2.5 lg:py-3"
          }`}
        >
          {HOME_CATEGORIES.map((cat) => {
            const active =
              pathname === cat.landingPath || pathname === `/c/${cat.slug}`;

            return (
              <Link
                key={cat.slug}
                to={cat.landingPath}
                title={cat.title}
                className="group flex shrink-0 flex-col items-center gap-1.5"
              >
                <span
                  className={`relative block overflow-hidden rounded-full ring-2 transition duration-200 ${
                    scrolled ? "h-10 w-10" : "h-11 w-11 lg:h-12 lg:w-12"
                  } ${
                    active
                      ? "ring-sun shadow-[0_0_0_3px_rgb(255_106_0_/_0.15)]"
                      : "ring-white/10 group-hover:ring-sun/40"
                  }`}
                >
                  <img
                    src={cat.img}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.src = "/img/placeholder.jpg";
                    }}
                  />
                </span>

                <span
                  className={`max-w-[4.5rem] truncate text-center text-[10px] font-medium leading-tight transition lg:max-w-[5rem] lg:text-[11px] ${
                    active ? "text-sun" : "text-white/70 group-hover:text-white"
                  }`}
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
