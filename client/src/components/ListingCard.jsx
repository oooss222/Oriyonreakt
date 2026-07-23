import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Clock3 } from "lucide-react";
import FavoriteButton from "./FavoriteButton";
import { API_BASE } from "../lib/api";

function imageUrl(src) {
  if (!src) return "/img/placeholder.jpg";
  if (src.startsWith("http") || src.startsWith("/img/")) return src;
  const server = API_BASE.replace(/\/api$/, "");
  return `${server}/${String(src).replace(/^\/+/, "")}`;
}

function getThumb(ad) {
  const first = ad?.images?.[0];

  if (typeof first === "string") return imageUrl(first);

  return imageUrl(
    first?.url ||
      first?.src ||
      first?.path ||
      first?.secure_url ||
      first?.preview ||
      ad?.img ||
      ad?.image ||
      ""
  );
}

function fmtPrice(value) {
  if (value == null || value === "") return "Цена не указана";

  const n = Number(String(value).replace(/\s/g, ""));

  if (Number.isFinite(n)) {
    return `${n.toLocaleString("ru-RU")} TJS`;
  }

  return String(value);
}

export default function ListingCard({
  ad,
  item,
  listings,
  className = "",
  imageHeight = "h-40",
  animationDelay,
  onFav,
}) {
  const data = ad || item;
  const id = data?.id || data?._id;
  const img = getThumb(data);
  const more = Math.max(0, (data?.images?.length || 0) - 1);

  return (
    <Link
      to={`/ad/${id}`}
      onClick={() => {
        sessionStorage.setItem("ad_preview", JSON.stringify(data));
        if (listings) {
          sessionStorage.setItem("ad_list", JSON.stringify(listings));
        }
      }}
      className={`listing-card ${className}`}
      style={animationDelay != null ? { animationDelay: `${animationDelay}ms` } : undefined}
      aria-label={`Объявление: ${data?.title || "Без названия"}`}
    >
      <div className="listing-card__media">
        <img
          src={img}
          alt={data?.title || "Объявление"}
          loading="lazy"
          className={`listing-card__image ${imageHeight}`}
        />

        {(data?.vip || data?.top) && (
          <div className="absolute left-2 top-2 flex gap-1.5 z-[1]">
            {data.vip && <span className="badge-vip">VIP</span>}
            {data.top && <span className="badge-top">TOP</span>}
          </div>
        )}

        {more > 0 && (
          <span className="absolute bottom-2 right-2 text-[11px] bg-black/70 text-white rounded-lg px-1.5 py-0.5">
            +{more}
          </span>
        )}
      </div>

      <div className="listing-card__body">
        <div className="listing-card__title min-h-[40px]">
          {data?.title || "Без названия"}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="listing-card__price">{fmtPrice(data?.price)}</div>
          <FavoriteButton
            id={id}
            defaultActive={data?.isFavorite}
            onChange={(active) => onFav?.(id, active)}
            compact
          />
        </div>

        <div className="listing-card__meta">
          <MapPin size={13} className="shrink-0" />
          {data?.location || data?.city || "Локация не указана"}
        </div>

        <div className="listing-card__date">
          <Clock3 size={13} className="shrink-0" />
          {data?.createdAt
            ? new Date(data.createdAt).toLocaleDateString("ru-RU")
            : "Новое объявление"}
        </div>
      </div>
    </Link>
  );
}
