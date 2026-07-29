import React from "react";
import { useNavigate } from "react-router-dom";
import FavoriteButton from "./FavoriteButton";
import ListingCardOverlays from "./ListingCardOverlays";
import { getListingThumb } from "../lib/media";
import { formatPrice } from "../lib/format";
import {
  getPromotionCardAccent,
  getPromotionCardClass,
} from "../lib/promotionStyles";

export default function ListingCard({ item, onFav }) {
  const nav = useNavigate();
  const listingId = item?.id || item?._id;
  const morePhotos = Math.max(0, (item?.images?.length || 0) - 1);

  const openAd = () => {
    if (!listingId) return;
    nav(`/ad/${listingId}`);
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={openAd}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openAd();
        }
      }}
      className={`card overflow-hidden block group cursor-pointer focus:outline-none focus:ring-2 focus:ring-sun/40 relative ${getPromotionCardClass({
        vip: item?.vip,
        top: item?.top,
      })}`}
    >
      <span
        className={getPromotionCardAccent({
          vip: item?.vip,
          top: item?.top,
        })}
        aria-hidden="true"
      />
      <div className="relative overflow-hidden">
        <img
          src={getListingThumb(item)}
          alt={item.title}
          className="w-full h-32 object-cover bg-mist transition-transform duration-500 group-hover:scale-105"
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
        />
      </div>

      <div className="p-2">
        <div className="badge text-[10px] px-1.5 py-0.5">
          {item.location || "Не указано"}
        </div>

        <h3 className="mt-1.5 text-xs sm:text-sm font-semibold text-ink line-clamp-2 group-hover:text-sun-700 transition-colors">
          {item.title}
        </h3>

        <div className="mt-1.5 flex items-center justify-between gap-2">
          <strong className="text-price text-sm">
            {formatPrice(item.price)}
          </strong>

          <FavoriteButton
            id={listingId}
            defaultActive={item.isFavorite}
            onChange={(active) => onFav?.(listingId, active)}
            compact
          />
        </div>
      </div>
    </div>
  );
}
