import React from "react";
import { formatPrice } from "../lib/format";
import { formatListingTimeAgo } from "../i18n/helpers";
import { useListingViewed } from "../lib/viewedListings";
import { useI18n } from "../i18n";

export default function ListingCardFooter({
  item,
  listingId,
  priceSuffix = null,
  priceNote = null,
}) {
  const { t } = useI18n();
  const viewed = useListingViewed(listingId);

  return (
    <div className="listing-card__footer">
      <div className="min-w-0">
        <strong className="listing-card__price">
          {formatPrice(item?.price, {
            currency: t("price.currency"),
            emptyLabel: t("price.negotiable"),
          })}
          {priceSuffix ? (
            <span className="ml-1 text-xs font-semibold text-slate-500">
              {priceSuffix}
            </span>
          ) : null}
        </strong>
        {priceNote ? (
          <div className="mt-0.5 text-[11px] font-medium text-slate-500">
            {priceNote}
          </div>
        ) : null}
      </div>
      <div className="listing-card__meta">
        <time className="listing-card__time">
          {formatListingTimeAgo(item, t)}
        </time>
        {viewed ? (
          <span className="listing-card__viewed">{t("listing.viewed")}</span>
        ) : null}
      </div>
    </div>
  );
}
