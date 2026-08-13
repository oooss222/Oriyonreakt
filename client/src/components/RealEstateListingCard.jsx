import React from "react";
import { useNavigate } from "react-router-dom";
import PriceAdequacyBadge from "./PriceAdequacyBadge";
import ListingCardOverlays from "./ListingCardOverlays";
import BusinessBadge from "./BusinessBadge";
import { getListingThumb } from "../lib/media";
import { formatPrice, formatListingTimeAgo } from "../lib/format";
import { enrichRealEstateListing } from "../lib/realEstate";
import {
  getPromotionCardClass,
  getPromotionMediaClass,
  getListingLocationClass,
} from "../lib/promotionStyles";
import { MapPin, Maximize2 } from "lucide-react";

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
          />

          <ListingCardOverlays
            listingId={id}
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
              {totalStayPrice && (
                <div className="text-xs font-medium text-slate-500 mt-0.5">
                  {totalStayPrice.toLocaleString("ru-RU")} с. за {nights}{" "}
                  {nights === 1 ? "ночь" : nights < 5 ? "ночи" : "ночей"}
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

          <div className="mt-auto pt-2 flex items-center justify-end gap-2">
            <time className="listing-card__time">{formatListingTimeAgo(listing)}</time>
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
      className={`listing-card group cursor-pointer focus:outline-none focus:ring-2 focus:ring-sun/40 ${getPromotionCardClass(
        { vip: listing.vip, top: listing.top }
      )}`}
    >
      <div className="listing-card__media">
        <img
          src={img}
          alt={listing.title || "Недвижимость"}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${getPromotionMediaClass({ vip: listing.vip })}`}
        />

        <ListingCardOverlays
          listingId={id}
          views={listing.views}
          vip={listing.vip}
          top={listing.top}
          morePhotos={Math.max(0, (listing.images?.length || 0) - 1)}
          favoriteId={id}
          isFavorite={listing.isFavorite}
          onFavChange={(active) => onFav?.(id, active)}
        />

        {summary.deal && (
          <span className="absolute bottom-2.5 right-2.5 z-10 inline-flex rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
            {summary.deal}
          </span>
        )}
      </div>

      <div className="listing-card__body">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={getListingLocationClass({
              vip: listing.vip,
              top: listing.top,
            })}
          >
            {locationLabel}
          </span>
          {summary.deal && (
            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
              {summary.deal}
            </span>
          )}
          <BusinessBadge
            sellerType={listing.ownerSellerType}
            businessVerified={listing.ownerBusinessVerified}
          />
        </div>

        <h3 className="listing-card__title">
          {listing.title || summary.line || "Без названия"}
        </h3>

        {isDaily ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <span className="rounded-md bg-slate-100 px-2 py-0.5">{housingLabel}</span>
            {summary.guests && <span>{summary.guests} гост.</span>}
            {summary.rooms && <span>{summary.rooms} комн.</span>}
            {summary.area && <span>{summary.area}</span>}
          </div>
        ) : (
          summary.line &&
          summary.line !== listing.title && (
            <p className="mt-1 text-xs font-medium text-slate-500 line-clamp-1">
              {summary.line}
            </p>
          )
        )}

        {!isDaily && summary.pricePerSqm && (
          <p className="mt-1 text-xs font-medium text-slate-500">{summary.pricePerSqm}</p>
        )}

        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <PriceAdequacyBadge item={listing} compact />
        </div>

        <div className="listing-card__footer">
          <div>
            <strong className="listing-card__price">
              {formatPrice(listing.price, { currency: "с." })}
              {isDaily && (
                <span className="ml-1 text-xs font-semibold text-slate-500">/ сут.</span>
              )}
            </strong>
            {totalStayPrice && (
              <div className="mt-0.5 text-[11px] font-medium text-slate-500">
                {totalStayPrice.toLocaleString("ru-RU")} с. за {nights}{" "}
                {nights === 1 ? "ночь" : nights < 5 ? "ночи" : "ночей"}
              </div>
            )}
          </div>
          <time className="listing-card__time">{formatListingTimeAgo(listing)}</time>
        </div>
      </div>
    </article>
  );
}
