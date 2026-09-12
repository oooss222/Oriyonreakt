import React from "react";
import { Link } from "react-router-dom";
import { getLifestyleQuickChips } from "../data/categoryLifestyle";

export default function CategoryQuickFilters({ slug }) {
  const chips = getLifestyleQuickChips(slug);

  if (!chips.length) return null;

  return (
    <div className="filter-panel p-3 md:p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">
        Быстрый поиск
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((item) => (
          <Link
            key={item.label}
            to={`/listing?cat=${slug}&subcategory=${encodeURIComponent(
              item.subcategory
            )}`}
            className="chip"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
