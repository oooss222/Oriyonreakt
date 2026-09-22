import React from "react";
import { Camera } from "lucide-react";
import ListingCardMedia from "../ListingCardMedia";
import { formatPrice } from "../../lib/format";
import { getListingImages } from "../../lib/media";
import { useI18n } from "../../i18n";

export default function ListingFormPreview({ item }) {
  const { t } = useI18n();
  const title = item?.title?.trim() || t("listing.previewNoTitle");
  const location = item?.location || item?.city || t("listing.noLocation");
  const hasPhoto = getListingImages(item, { width: 400 }).length > 0;

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-400">
        {t("listing.previewTitle")}
      </div>
      <article className="listing-card listing-card--preview pointer-events-none select-none">
        {hasPhoto ? (
          <ListingCardMedia
            item={item}
            views={0}
            vip={false}
            top={false}
            showFavorite={false}
          />
        ) : (
          <div className="listing-card__media listing-form-preview-empty">
            <Camera className="w-7 h-7" strokeWidth={1.5} aria-hidden />
            <span>{t("listing.previewAddPhotos")}</span>
          </div>
        )}
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
