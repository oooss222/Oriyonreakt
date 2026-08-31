import React from "react";
import ListingCardMedia from "../ListingCardMedia";
import { formatPrice } from "../../lib/format";
import { useI18n } from "../../i18n";

export default function ListingFormPreview({ item }) {
  const { t } = useI18n();
  const title = item?.title?.trim() || t("listing.previewNoTitle");
  const location = item?.location || item?.city || t("listing.noLocation");

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-400">
        {t("listing.previewTitle")}
      </div>
      <article className="listing-card listing-card--preview pointer-events-none select-none">
        <ListingCardMedia
          item={item}
          views={0}
          vip={false}
          top={false}
          showFavorite={false}
          showCompare={false}
        />
        <div className="listing-card__body">
          <span className="listing-card__location">{location}</span>
          <h3 className="listing-card__title">{title}</h3>
          <div className="listing-card__footer">
            <strong className="listing-card__price">
              {formatPrice(item?.price, {
                currency: t("price.currency"),
                emptyLabel: t("price.negotiable"),
              })}
            </strong>
            <span className="listing-card__meta text-ink-400 text-xs">
              {t("listing.previewBadge")}
            </span>
          </div>
        </div>
      </article>
    </div>
  );
}
