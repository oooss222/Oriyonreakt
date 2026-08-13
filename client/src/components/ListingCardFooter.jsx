import React from "react";
import { formatPrice, formatListingTimeAgo } from "../lib/format";
import { useListingViewed } from "../lib/viewedListings";

export default function ListingCardFooter({
  item,
  listingId,
  priceSuffix = null,
  priceNote = null,
}) {
  const viewed = useListingViewed(listingId);

  return (
    <div className="listing-card__footer">
      <div className="min-w-0">
        <strong className="listing-card__price">
          {formatPrice(item?.price, { currency: "с." })}
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
          {formatListingTimeAgo(item)}
        </time>
        {viewed ? (
          <span className="listing-card__viewed">Просмотрено</span>
        ) : null}
      </div>
    </div>
  );
}
