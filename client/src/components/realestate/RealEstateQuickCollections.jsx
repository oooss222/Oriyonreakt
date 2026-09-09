import React from "react";
import { useNavigate } from "react-router-dom";
import { QUICK_COLLECTIONS } from "../../data/realEstate";
import { buildRealEstateListingUrl } from "../../lib/realEstate";
import { useI18n } from "../../i18n";
import { Chip } from "../../ui";

export default function RealEstateQuickCollections({
  city = "Душанбе",
  activeParams = null,
  onSelect,
  className = "",
}) {
  const { t } = useI18n();
  const nav = useNavigate();
  const labelId = React.useId();

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
      <div
        role="group"
        aria-labelledby={labelId}
        className="scrollbar-hide scroll-fade-x flex items-center gap-2 overflow-x-auto pb-1"
      >
        <span id={labelId} className="label-caps">
          {t("realestate.collections")}
        </span>

        {QUICK_COLLECTIONS.map((collection) => (
          <Chip
            key={collection.title}
            active={isActive(collection)}
            className="filter-chip"
            onClick={() => open(collection)}
          >
            {collection.title}
          </Chip>
        ))}
      </div>
    </div>
  );
}
