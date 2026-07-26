import React from "react";
import { useNavigate } from "react-router-dom";
import FavoriteButton from "./FavoriteButton";
import { API_BASE } from "../lib/api";

function imageUrl(src) {
  if (!src) return "";

  if (src.startsWith("http")) {
    return src;
  }

  const server = API_BASE.replace(/\/api$/, "");
  const clean = String(src).replace(/^\/+/, "");

  return `${server}/${clean}`;
}

export default function ListingCard({ item, onFav }) {
  const nav = useNavigate();
  const listingId = item?.id || item?._id;

  const image =
    item.images?.[0]?.url ||
    item.images?.[0] ||
    item.image ||
    "";

  const price =
    typeof item.price === "number"
      ? new Intl.NumberFormat("ru-RU", {
          style: "currency",
          currency: "TJS",
          maximumFractionDigits: 0,
        }).format(item.price)
      : item.price || "Цена не указана";

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
          src={
            image
              ? imageUrl(image)
              : "/img/placeholder.jpg"
          }
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

        <div className="mt-2 flex items-center justify-between gap-2">
          <strong className="text-price text-base">{price}</strong>

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
