import React from "react";
import { Link } from "react-router-dom";
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
  const listingId = item.id || item._id;

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

  return (
    <Link
      to={`/ad/${listingId}`}
      className="card overflow-hidden block"
    >
      <div className="relative">
        <img
          src={
            image
              ? imageUrl(image)
              : "https://placehold.co/600x400?text=No+Image"
          }
          alt={item.title}
          className="w-full h-40 object-cover bg-indigo-50"
          onError={(e) => {
            e.currentTarget.src =
              "https://placehold.co/600x400?text=No+Image";
          }}
        />
      </div>

      <div className="p-3">
        <div className="badge">
          {item.location || "Не указано"}
        </div>

        <h3 className="mt-2 text-sm font-semibold">
          {item.title}
        </h3>

        <div className="mt-2 flex items-center justify-between gap-2">
          <strong>{price}</strong>

          <FavoriteButton
            id={listingId}
            defaultActive={item.isFavorite}
            onChange={(active) => onFav?.(listingId, active)}
            compact
          />
        </div>
      </div>
    </Link>
  );
}
