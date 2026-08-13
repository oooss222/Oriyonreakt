import React from "react";
import { useNavigate } from "react-router-dom";
import ListingCardOverlays from "./ListingCardOverlays";
import ListingCardFooter from "./ListingCardFooter";
import { getListingThumb } from "../lib/media";
import { enrichRealEstateListing } from "../lib/realEstate";
import { useListingViewed } from "../lib/viewedListings";
import {
  getPromotionCardClass,
  getPromotionMediaClass,
} from "../lib/promotionStyles";
import { MapPin, Maximize2 } from "lucide-react";
import { formatPrice, formatListingTimeAgo } from "../lib/format";

export default function RealEstateListingCard({
  item,
  variant = "grid",
  nights = 0,
  onFav,
}) {
  const nav = useNavigate();
  const listing = enrichRealEstateListing(item);
  const id = listing.id || listing._id;
  const img = getListingThumb(listing);
  const summary = listing.realEstateSummary || {};
  const viewed = useListingViewed(id);
  const isHorizontal = variant === "horizontal";
  const isDaily = summary.deal === "Посуточно";
  const nightlyPrice = Number(String(listing.price || "").replace(/[^\d]/g, ""));
  const totalStayPrice =
    isDaily && nights > 0 && nightlyPrice
      ? nightlyPrice * nights
      : null;
  const housingLabel =
    listing.subcategory === "Дома и коттеджи"
      ? "Дом"
      : listing.subcategory === "Комнаты"
        ? "Комната"
        : listing.subcategory === "Квартиры" || listing.subcategory === "Новостройки"
          ? "Квартира"
          : listing.subcategory || "Жильё";
  const locationLabel = summary.district
    ? summary.district
    : listing.location || "Душанбе";

  const openAd = () => {
    if (!id) return;
    sessionStorage.setItem("ad_preview", JSON.stringify(listing));
    nav(`/ad/${id}`);
  };

  const stayPriceNote =
    totalStayPrice &&
    `${totalStayPrice.toLocaleString("ru-RU")} с. за ${nights} ${
      nights === 1 ? "ночь" : nights < 5 ? "ночи" : "ночей"
    }`;

  if (isHorizontal) {
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
        className={`group relative flex cursor-pointer overflow-hidden rounded-2xl border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sun/40 ${getPromotionCardClass(
          { vip: listing.vip, top: listing.top }
        )} flex-row p-2.5 gap-3`}
      >
        <div className="relative h-32 w-40 shrink-0 overflow-hidden rounded-xl sm:w-44">
          <img
            src={img}
            alt={listing.title || "Недвижимость"}
            loading="lazy"
            className={`h-full w-full object-cover bg-slate-100 transition-transform duration-500 group-hover:scale-105 ${getPromotionMediaClass({ vip: listing.vip })}`}
            onError={(e) => {
              e.currentTarget.src = "/img/placeholder.jpg";
            }}
          />

          <ListingCardOverlays
            views={listing.views}
            vip={listing.vip}
            top={listing.top}
            morePhotos={Math.max(0, (listing.images?.length || 0) - 1)}
            favoriteId={id}
            isFavorite={listing.isFavorite}
            onFavChange={(active) => onFav?.(id, active)}
          />
        </div>

        <div className="min-w-0 flex-1 flex flex-col py-0.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="listing-card__price text-base">
                {formatPrice(listing.price, { currency: "с." })}
                {isDaily && (
                  <span className="ml-1 text-sm font-semibold text-slate-500">
                    / сут.
                  </span>
                )}
              </div>
              {stayPriceNote && (
                <div className="text-xs font-medium text-slate-500 mt-0.5">
                  {stayPriceNote}
                </div>
              )}
            </div>
            {summary.deal && (
              <span className="shrink-0 inline-flex px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                {summary.deal}
              </span>
            )}
          </div>

          {summary.pricePerSqm && !isDaily && (
            <div className="text-xs text-slate-500 font-medium">
              {summary.pricePerSqm}
            </div>
          )}

          <h3 className="mt-1 text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-sun transition">
            {listing.title || summary.line || "Без названия"}
          </h3>

          <div className="mt-1.5 text-xs text-slate-500 line-clamp-1 flex items-center gap-1">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{locationLabel}</span>
          </div>

          <div className="mt-auto pt-2 flex items-end justify-end gap-2">
            <div className="listing-card__meta">
              <time className="listing-card__time">
                {formatListingTimeAgo(listing)}
              </time>
              {viewed ? (
                <span className="listing-card__viewed">Просмотрено</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center pr-2 text-slate-300 group-hover:text-sun">
          <Maximize2 size={18} />
        </div>
      </article>
    );
  }

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
        { vip: listing.vip, top: listing.top }
      )}`}
    >
      <div className="listing-card__media">
        <img
          src={img}
          alt={listing.title || "Недвижимость"}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${getPromotionMediaClass({ vip: listing.vip })}`}
          onError={(e) => {
            e.currentTarget.src = "/img/placeholder.jpg";
          }}
        />

        <ListingCardOverlays
          views={listing.views}
          vip={listing.vip}
          top={listing.top}
          morePhotos={Math.max(0, (listing.images?.length || 0) - 1)}
          favoriteId={id}
          isFavorite={listing.isFavorite}
          onFavChange={(active) => onFav?.(id, active)}
        />
      </div>

      <div className="listing-card__body">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="listing-card__location">{locationLabel}</span>
          {summary.deal && (
            <span className="listing-card__tag">{summary.deal}</span>
          )}
        </div>

        <h3 className="listing-card__title">
          {listing.title || summary.line || "Без названия"}
        </h3>

        {isDaily ? (
          <p className="listing-card__details">
            {[housingLabel, summary.guests && `${summary.guests} гост.`, summary.rooms && `${summary.rooms} комн.`, summary.area]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : (
          summary.line &&
          summary.line !== listing.title && (
            <p className="listing-card__details">{summary.line}</p>
          )
        )}

        {!isDaily && summary.pricePerSqm && (
          <p className="listing-card__details">{summary.pricePerSqm}</p>
        )}

        <ListingCardFooter
          item={listing}
          listingId={id}
          priceSuffix={isDaily ? "/ сут." : null}
          priceNote={stayPriceNote || null}
        />
      </div>
    </article>
  );
}
