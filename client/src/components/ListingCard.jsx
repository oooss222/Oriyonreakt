import React from "react";
import { useNavigate } from "react-router-dom";
import ListingCardMedia from "./ListingCardMedia";
import ListingCardFooter from "./ListingCardFooter";
import { trackListingClick } from "../lib/track";
import { useListingViewed } from "../lib/viewedListings";
import { getPromotionCardClass } from "../lib/promotionStyles";
import { useI18n } from "../i18n";

export default function ListingCard({
  item,
  onFav,
  listings,
  trackSource,
  className = "",
  style,
}) {
  const nav = useNavigate();
  const { t } = useI18n();
  const listingId = item?.id || item?._id;
  const viewed = useListingViewed(listingId);
  const title = item?.title || t("listing.noTitle");
  const location = item?.location || item?.city || t("listing.noLocation");

  const openAd = () => {
    if (!listingId) return;

    if (trackSource) {
      trackListingClick(item, { source: trackSource });
    }

    sessionStorage.setItem("ad_preview", JSON.stringify(item));

    if (listings?.length) {
      sessionStorage.setItem("ad_list", JSON.stringify(listings));
    }

    nav(`/ad/${listingId}`);
  };

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={openAd}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openAd();
        }
      }}
      className={`listing-card group cursor-pointer focus:outline-none focus:ring-2 focus:ring-sun/40 ${viewed ? "listing-card--viewed" : ""} ${getPromotionCardClass(
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
    </article>
  );
}
