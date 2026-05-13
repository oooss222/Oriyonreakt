import React from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../lib/api";

function imageUrl(src) {
  if (!src) return "";

  if (src.startsWith("http")) return src;

  return API_BASE.replace("/api", "") + src;
}

export default function ListingCard({ listing }) {
  if (!listing) return null;

  const id = listing.id || listing._id;

  const firstImage =
    listing.images?.[0]?.url ||
    listing.images?.[0] ||
    "";

  return (
    <Link
      to={`/ad/${id}`}
      className="block rounded-xl border bg-white overflow-hidden hover:shadow-md transition"
    >
      <div className="aspect-[4/3] bg-gray-100">
        {firstImage ? (
          <img
            src={imageUrl(firstImage)}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400">
            Нет фото
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-semibold line-clamp-2">
          {listing.title}
        </h3>

        <div className="mt-1 text-lg font-bold">
          {listing.price || "Цена не указана"}
        </div>

        <div className="mt-1 text-sm text-gray-500">
          {listing.location || "Локация не указана"}
        </div>

        {listing.subcategory && (
          <div className="mt-2 text-xs text-gray-400">
            {listing.subcategory}
          </div>
        )}
      </div>
    </Link>
  );
}