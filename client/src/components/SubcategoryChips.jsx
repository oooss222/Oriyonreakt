import React from "react";

export default function SubcategoryChips({
  subcategories = [],
  activeSubcategory = "",
  onSelect,
  className = "",
}) {
  if (!subcategories.length) return null;

  return (
    <div
      className={`flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      <button
        type="button"
        onClick={() => onSelect("")}
        className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition ${
          !activeSubcategory
            ? "bg-slate-900 text-white border-slate-900"
            : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
        }`}
      >
        Все
      </button>

      {subcategories.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onSelect(item)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition ${
            activeSubcategory === item
              ? "bg-sun text-white border-sun"
              : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
