import React from "react";
import { formatPrice } from "../lib/format";
import { useListingViewed } from "../lib/viewedListings";
import { useI18n } from "../i18n";

export default function ListingCardPrice({
  item,
  listingId,
  priceSuffix = null,
  priceNote = null,
}) {
  const { t } = useI18n();
  const viewed = useListingViewed(listingId);

  return (
    <div className="listing-card__price-row">
      <strong className="listing-card__price">
        {formatPrice(item?.price, {
          currency: t("price.currency"),
          emptyLabel: t("price.negotiable"),
        })}
        {priceSuffix ? (
          <span className="listing-card__price-suffix">{priceSuffix}</span>
        ) : null}
      </strong>

      {priceNote ? (
        <span className="listing-card__price-note">{priceNote}</span>
      ) : null}

      {viewed ? (
        <span className="listing-card__viewed">{t("listing.viewed")}</span>
      ) : null}
    </div>
  );
}
