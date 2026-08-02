import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { HOME_CATEGORIES } from "../data/categories";

const FEATURED_SLUGS = new Set(["realestate", "transport", "phones", "electronics"]);

export default function HomeCategoryGrid() {
  const ordered = [
    ...HOME_CATEGORIES.filter((item) => FEATURED_SLUGS.has(item.slug)),
    ...HOME_CATEGORIES.filter((item) => !FEATURED_SLUGS.has(item.slug)),
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="section-title">Каталог</h2>
          <p className="text-sm text-ink-400 mt-1">
            Все разделы Oriyon.store — от недвижимости до услуг
          </p>
        </div>
        <Link
          to="/listing"
          className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-sun-700 hover:text-sun transition"
        >
          Весь каталог
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {ordered.map((cat) => (
          <Link
            key={cat.slug}
            to={cat.landingPath}
            className="group card p-3 hover:-translate-y-0.5"
          >
            <div className="aspect-[4/3] rounded-xl bg-mist border border-ink/5 overflow-hidden mb-3 grid place-items-center">
              <img
                src={cat.img}
                alt=""
                className="max-h-[70%] max-w-[80%] object-contain transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="font-semibold text-sm text-ink group-hover:text-sun-700 transition">
              {cat.title}
            </div>
            {cat.desc && (
              <div className="text-xs text-ink-400 mt-1 line-clamp-2">{cat.desc}</div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
