import React from "react";
import { useNavigate } from "react-router-dom";
import ListingCardOverlays from "./ListingCardOverlays";
import ListingCardFooter from "./ListingCardFooter";
import { getListingThumb } from "../lib/media";
import { trackListingClick } from "../lib/track";
import { useListingViewed } from "../lib/viewedListings";
import {
  getPromotionCardClass,
  getPromotionMediaClass,
} from "../lib/promotionStyles";

export default function ListingCard({
  item,
  onFav,
  listings,
  trackSource,
  className = "",
  style,
}) {
  const nav = useNavigate();
  const listingId = item?.id || item?._id;
  const viewed = useListingViewed(listingId);
  const morePhotos = Math.max(0, (item?.images?.length || 0) - 1);
  const location = item?.location || item?.city || "Не указано";

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
      aria-label={`Объявление: ${item?.title || "Без названия"}`}
    >
      <div className="listing-card__media">
        <img
          src={getListingThumb(item)}
          alt={item?.title || "Объявление"}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${getPromotionMediaClass(
            { vip: item?.vip }
          )}`}
          onError={(e) => {
            e.currentTarget.src = "/img/placeholder.jpg";
          }}
        />

        <ListingCardOverlays
          views={item?.views}
          vip={item?.vip}
          top={item?.top}
          morePhotos={morePhotos}
          favoriteId={listingId}
          isFavorite={item?.isFavorite}
          onFavChange={(active) => onFav?.(listingId, active)}
        />
      </div>

      <div className="listing-card__body">
        <span className="listing-card__location">{location}</span>

        <h3 className="listing-card__title">{item?.title || "Без названия"}</h3>

        <ListingCardFooter item={item} listingId={listingId} />
      </div>
    </article>
  );
}
