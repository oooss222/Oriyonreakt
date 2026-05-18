import React from "react";
import { Link } from "react-router-dom";
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

  const [fav, setFav] = React.useState(() => {
    const f = new Set(
      JSON.parse(localStorage.getItem("favs") || "[]")
    );

    return f.has(listingId);
  });

  const toggle = (e) => {
    e.preventDefault();

    const f = new Set(
      JSON.parse(localStorage.getItem("favs") || "[]")
    );

    if (f.has(listingId)) {
      f.delete(listingId);
      setFav(false);
    } else {
      f.add(listingId);
      setFav(true);
    }

    localStorage.setItem(
      "favs",
      JSON.stringify([...f])
    );

    onFav?.(listingId, !fav);
  };

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

      <div className="p-3">
        <div className="badge">
          {item.location || "Не указано"}
        </div>

        <h3 className="mt-2 text-sm font-semibold">
          {item.title}
        </h3>

        <div className="flex items-center justify-between mt-2">
          <strong>{price}</strong>

          <button
            className={`btn ${
              fav
                ? "bg-amber-50 border-amber-200"
                : ""
            }`}
            onClick={toggle}
            title="В избранное"
          >
            ★
          </button>
        </div>
      </div>
    </Link>
  );
}