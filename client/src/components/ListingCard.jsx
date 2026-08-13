import React from "react";
import { useNavigate } from "react-router-dom";
import CompareListingButton from "./CompareListingButton";
import FavoriteButton from "./FavoriteButton";
import ListingCardOverlays from "./ListingCardOverlays";
import BusinessBadge from "./BusinessBadge";
import { isCompareSupported } from "../lib/compareListings";
import { getListingThumb } from "../lib/media";
import { formatPrice, formatListingTimeAgo } from "../lib/format";
import { trackListingClick } from "../lib/track";
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
  const cat = item?.cat || "";
  const showCompare = isCompareSupported(cat);
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
      className={`listing-card group cursor-pointer focus:outline-none focus:ring-2 focus:ring-sun/40 ${getPromotionCardClass(
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
          listingId={listingId}
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
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="listing-card__location">{location}</span>
          <BusinessBadge
            sellerType={item?.ownerSellerType}
            businessVerified={item?.ownerBusinessVerified}
          />
        </div>

        <h3 className="listing-card__title">{item?.title || "Без названия"}</h3>

        <div className="listing-card__footer">
          <strong className="listing-card__price">
            {formatPrice(item?.price, { currency: "с." })}
          </strong>
          <time className="listing-card__time">
            {formatListingTimeAgo(item)}
          </time>
        </div>

        {showCompare && (
          <div className="mt-2 flex justify-end" onClick={(e) => e.stopPropagation()}>
            <CompareListingButton listingId={listingId} cat={cat} compact />
          </div>
        )}
      </div>
    </article>
  );
}
