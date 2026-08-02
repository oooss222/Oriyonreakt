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
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {Object.entries(SUBCATEGORY_META).map(([name, meta]) => {
        const Icon = SUB_ICONS[meta.icon] || Building2;
        const count = statsBySubcategory[name] || 0;

        return (
          <Link
            key={name}
            to={buildRealEstateCategoryUrl(city, name)}
            className={`group relative rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
              meta.highlight
                ? "bg-gradient-to-br from-sun-50/80 to-white border-sun/25 hover:border-sun/40"
                : "bg-white border-ink/10 hover:border-ink/20"
            }`}
          >
            {count > 0 && (
              <span className="absolute top-3 right-3 rounded-full bg-ink text-white text-[10px] font-bold px-2 py-0.5 tabular-nums">
                {count}
              </span>
            )}

            <div
              className={`w-11 h-11 rounded-xl grid place-items-center mb-3 transition-colors ${
                meta.highlight
                  ? "bg-sun text-white group-hover:bg-sun-600"
                  : "bg-mist text-sun group-hover:bg-sun-50"
              }`}
            >
              <Icon size={20} />
            </div>

            <div className="font-semibold text-sm text-ink leading-snug pr-6">{name}</div>
            <div className="text-xs text-ink-400 mt-1 leading-relaxed line-clamp-2">{meta.desc}</div>
          </Link>
        );
      })}
    </section>
  );
}
