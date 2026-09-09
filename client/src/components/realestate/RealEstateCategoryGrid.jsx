import React from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Home,
  LandPlot,
  Store,
  Car,
  DoorOpen,
} from "lucide-react";
import { buildRealEstateCategoryUrl } from "../../lib/realEstate";
import { SUBCATEGORY_META } from "../../data/realEstate";
import { cn } from "../../ui";

const SUB_ICONS = {
  building: Building2,
  apartment: Building2,
  door: DoorOpen,
  home: Home,
  land: LandPlot,
  garage: Car,
  commercial: Store,
};

export default function RealEstateCategoryGrid({ city, statsBySubcategory = {} }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {Object.entries(SUBCATEGORY_META).map(([name, meta]) => {
        const Icon = SUB_ICONS[meta.icon] || Building2;
        const count = statsBySubcategory[name] || 0;

        return (
          <Link
            key={name}
            to={buildRealEstateCategoryUrl(city, name)}
            className={cn(
              "card card-interactive group relative p-4",
              meta.highlight && "border-sun-200 bg-sun-50"
            )}
          >
            {count > 0 && (
              <span className="badge badge-neutral absolute right-3 top-3 tabular-nums">
                {count}
              </span>
            )}

            <span
              className={cn(
                "mb-3 grid h-11 w-11 place-items-center rounded-xl transition-colors",
                meta.highlight
                  ? "bg-sun-500 text-white group-hover:bg-sun-600"
                  : "bg-mist-100 text-sun-700 group-hover:bg-sun-50"
              )}
            >
              <Icon size={20} aria-hidden="true" />
            </span>

            <span className="block pr-6 text-sm font-semibold leading-snug text-ink-900">
              {name}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-ink-400 line-clamp-2">
              {meta.desc}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
