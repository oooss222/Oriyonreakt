import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { TRAVEL_QUICK_FILTERS } from "../../data/travelFilters";

export default function TravelQuickFilters() {
  const [params] = useSearchParams();
  const current = params.toString();

  return (
    <div className="filter-panel p-3 md:p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">
        Быстрый поиск
      </div>
      <div className="flex flex-wrap gap-2">
        {TRAVEL_QUICK_FILTERS.map((item) => {
          const itemQuery = item.to.split("?")[1] || "";
          const active = current === itemQuery;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`chip ${active ? "chip-active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
