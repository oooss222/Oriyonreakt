import React from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import FavoriteButton from "./FavoriteButton";
import { getListingThumb } from "../lib/media";
import { formatPrice, formatViews } from "../lib/format";

export default function ListingCard({ item, onFav }) {
  const nav = useNavigate();
  const listingId = item?.id || item?._id;

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
      className="card overflow-hidden block group cursor-pointer focus:outline-none focus:ring-2 focus:ring-sun/40"
    >
      <div className="relative overflow-hidden">
        <img
          src={getListingThumb(item)}
          alt={item.title}
          className="w-full h-40 object-cover bg-mist transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = "/img/placeholder.jpg";
          }}
        />
      </div>

      <div className="p-3">
        <div className="badge">
          {item.location || "Не указано"}
        </div>

        <h3 className="mt-2 text-sm font-semibold text-ink line-clamp-2 group-hover:text-sun-700 transition-colors">
          {item.title}
        </h3>

        <div className="mt-1 text-xs text-slate-400 inline-flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" />
          {formatViews(item.views)}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <strong className="text-price text-base">
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
