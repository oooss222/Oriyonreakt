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
        className={`chip ${!activeSubcategory ? "chip-active" : ""}`}
      >
        Все
      </button>

      {subcategories.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onSelect(item)}
          className={`chip ${activeSubcategory === item ? "chip-active" : ""}`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
