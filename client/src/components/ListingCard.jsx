import React from "react";
import { Link } from "react-router-dom";
import ListingCardMedia from "./ListingCardMedia";
import ListingCardFooter from "./ListingCardFooter";
import { getListingCardLinkProps } from "../lib/listingCardNav";
import { useListingViewed } from "../lib/viewedListings";
import { getPromotionCardClass } from "../lib/promotionStyles";
import { useI18n } from "../i18n";

function ListingCard({
  item,
  onFav,
  listings,
  trackSource,
  className = "",
  style,
  layout = "grid",
}) {
  const { t } = useI18n();
  const listingId = item?.id || item?._id;
  const viewed = useListingViewed(listingId);
  const title = item?.title || t("listing.noTitle");
  const location = item?.location || item?.city || t("listing.noLocation");
  const linkProps = getListingCardLinkProps(item, { listings, trackSource });

  return (
    <Link
      {...linkProps}
      className={`listing-card group focus:outline-none focus:ring-2 focus:ring-sun/40 ${
        layout === "list" ? "listing-card--horizontal" : ""
      } ${viewed ? "listing-card--viewed" : ""} ${getPromotionCardClass(
        {
          vip: item?.vip,
          top: item?.top,
        }
      )} ${className}`}
      style={style}
      aria-label={t("a11y.listingCard", { title })}
    >
      <ListingCardMedia
        item={item}
        views={item?.views}
        vip={item?.vip}
        top={item?.top}
        favoriteId={listingId}
        isFavorite={item?.isFavorite}
        onFavChange={(active) => onFav?.(listingId, active)}
      />

      <div className="listing-card__body">
        <span className="listing-card__location">{location}</span>

        <h3 className="listing-card__title">{title}</h3>

        <ListingCardFooter item={item} listingId={listingId} />
      </div>
    </Link>
  );
}

// Grids render dozens of these; without memo a filter or sort change re-renders
// every card even though its listing has not changed.
export default React.memo(ListingCard);
