import React from "react";
import { useI18n } from "../i18n";

export default function SubcategoryChips({
  subcategories = [],
  activeSubcategory = "",
  onSelect,
  className = "",
}) {
  const { t } = useI18n();

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
        {t("category.all")}
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
