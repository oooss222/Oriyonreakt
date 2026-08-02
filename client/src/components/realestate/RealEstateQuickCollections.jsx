import React from "react";
import { useNavigate } from "react-router-dom";
import { QUICK_COLLECTIONS } from "../../data/realEstate";
import { buildRealEstateListingUrl } from "../../lib/realEstate";

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 h-9 px-3.5 rounded-full border text-sm font-medium transition ${
        active
          ? "border-sun bg-sun-50 text-sun-800"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

export default function RealEstateQuickCollections({
  city = "Душанбе",
  activeParams = null,
  onSelect,
  className = "",
}) {
  const nav = useNavigate();

  const isActive = (collection) => {
    if (!activeParams) return false;
    const params = collection.params;
    return (
      (activeParams.subcategory || "") === (params.subcategory || "") &&
      (activeParams.specs?.["Тип сделки"] || "") ===
        (params.specs?.["Тип сделки"] || "") &&
      (activeParams.specs?.["Комнат"] || "") === (params.specs?.["Комнат"] || "")
    );
  };

  const open = (collection) => {
    const url = buildRealEstateListingUrl({
      ...collection.params,
      city: collection.params.location || city,
    });

    if (onSelect) {
      onSelect(collection);
      return;
    }

    nav(url);
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Подборки
        </span>
        {QUICK_COLLECTIONS.map((collection) => (
          <Chip
            key={collection.title}
            active={isActive(collection)}
            onClick={() => open(collection)}
          >
            {collection.title}
          </Chip>
        ))}
      </div>
    </div>
  );
}
