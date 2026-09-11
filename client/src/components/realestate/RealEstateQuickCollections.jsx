import React from "react";
import { useNavigate } from "react-router-dom";
import { QUICK_COLLECTIONS } from "../../data/realEstate";
import { buildRealEstateListingUrl } from "../../lib/realEstate";
import { useI18n } from "../../i18n";

export default function RealEstateQuickCollections({
  city = "Душанбе",
  activeParams = null,
  onSelect,
  className = "",
}) {
  const nav = useNavigate();
  const { t } = useI18n();

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
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide scroll-fade-x">
        <span className="label-caps">{t("realestate.quickCollections.label")}</span>
        {QUICK_COLLECTIONS.map((collection) => (
          <button
            key={collection.title}
            type="button"
            onClick={() => open(collection)}
            className={`chip ${isActive(collection) ? "chip-active" : ""}`}
          >
            {collection.title}
          </button>
        ))}
      </div>
    </div>
  );
}
