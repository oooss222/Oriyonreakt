import React from "react";
import { Link } from "react-router-dom";
import ListingCardMedia from "./ListingCardMedia";
import { enrichRealEstateListing, buildRealEstateCardDisplay } from "../lib/realEstate";
import RealEstateDailyFeatures from "./realestate/RealEstateDailyFeatures";
import RealEstateRentFeatures from "./realestate/RealEstateRentFeatures";
import { useListingViewed } from "../lib/viewedListings";
import { getPromotionCardClass } from "../lib/promotionStyles";
import { MapPin, Maximize2 } from "lucide-react";
import { formatPrice, formatListingTimeAgo } from "../lib/format";
import { getListingImages } from "../lib/media";

export default function RealEstateListingCard({
  item,
  variant = "grid",
  nights = 0,
  onFav,
}) {
  const listing = enrichRealEstateListing(item);
  const id = listing.id || listing._id;
  const summary = listing.realEstateSummary || {};
  const cardCopy = buildRealEstateCardDisplay(listing);
  const viewed = useListingViewed(id);
  const isHorizontal = variant === "horizontal";
  const isDaily = summary.deal === "Посуточно";
  const isRent = summary.deal === "Снять";
  const nightlyPrice = Number(String(listing.price || "").replace(/[^\d]/g, ""));
  const totalStayPrice =
    isDaily && nights > 0 && nightlyPrice
      ? nightlyPrice * nights
      : null;
  const locationLabel = summary.district
    ? summary.district
    : listing.location || "Душанбе";
  const photoCount = getListingImages(listing).length;

  const href = id ? `/ad/${id}` : "#";

  const primeDetailView = () => {
    if (!id) return;
    try {
      sessionStorage.setItem("ad_preview", JSON.stringify(listing));
    } catch {
      // Private browsing and full quotas only cost us the warm start.
    }
  };

  // The title anchor is the real navigation target; this only widens the mouse
  // target without stealing clicks from the controls layered on the photo.
  const onCardClick = (event) => {
    if (!id) return;
    if (event.target.closest("a, button, input, [role='button']")) return;

    primeDetailView();
    event.currentTarget.querySelector(".listing-card__link")?.click();
  };

  const stayPriceNote =
    totalStayPrice &&
    `${totalStayPrice.toLocaleString("ru-RU")} с. за ${nights} ${
      nights === 1 ? "ночь" : nights < 5 ? "ночи" : "ночей"
    }`;

  if (isHorizontal) {
    return (
      <article
        onClick={onCardClick}
        className={`listing-card group flex cursor-pointer flex-row gap-3 p-2.5 ${getPromotionCardClass(
          { vip: listing.vip, top: listing.top }
        )}`}
      >
        <ListingCardMedia
          item={listing}
          className="relative h-32 w-40 shrink-0 overflow-hidden rounded-xl sm:w-44"
          views={listing.views}
          vip={listing.vip}
          top={listing.top}
          favoriteId={id}
          isFavorite={listing.isFavorite}
          onFavChange={(active) => onFav?.(id, active)}
          photoCount={photoCount}
        />

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
              <span className="shrink-0 inline-flex px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-2xs font-bold uppercase">
                {summary.deal}
              </span>
            )}
          </div>

          {summary.pricePerSqm && !isDaily && (
            <div className="text-xs text-slate-500 font-medium">
              {summary.pricePerSqm}
            </div>
          )}

          <h3 className="mt-1 text-sm font-semibold leading-snug text-ink-800 line-clamp-2">
            <Link to={href} className="listing-card__link" onClick={primeDetailView}>
              {cardCopy.title}
            </Link>
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
      onClick={onCardClick}
      className={`re-listing-card group cursor-pointer ${viewed ? "listing-card--viewed" : ""} ${getPromotionCardClass(
        { vip: listing.vip, top: listing.top }
      )}`}
    >
      <ListingCardMedia
        item={listing}
        views={listing.views}
        vip={listing.vip}
        top={listing.top}
        favoriteId={id}
        isFavorite={listing.isFavorite}
        onFavChange={(active) => onFav?.(id, active)}
        photoCount={photoCount}
      />

      <div className="re-listing-card__body">
        <span className="re-listing-card__district">{locationLabel}</span>

        <h3 className="re-listing-card__title">
          <Link to={href} className="listing-card__link" onClick={primeDetailView}>
            {cardCopy.title}
          </Link>
        </h3>

        {cardCopy.specsLine ? (
          <p className="re-listing-card__specs">{cardCopy.specsLine}</p>
        ) : null}

        {isDaily ? (
          <>
            <p className="re-listing-card__specs">
              {[summary.guests && `${summary.guests} гост.`, summary.rooms && `${summary.rooms} комн.`]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <RealEstateDailyFeatures specs={listing.specs} compact />
          </>
        ) : null}

        {isRent ? (
          <RealEstateRentFeatures specs={listing.specs} compact />
        ) : null}

        <div className="re-listing-card__price-row">
          <strong className="re-listing-card__price">
            {formatPrice(listing.price, { currency: "с." })}
            {isDaily ? (
              <span className="ml-1 text-xs font-semibold text-ink-400">
                / сут.
              </span>
            ) : null}
            {isRent ? (
              <span className="ml-1 text-xs font-semibold text-ink-400">
                / мес.
              </span>
            ) : null}
          </strong>
          {!isDaily && !isRent && summary.pricePerSqm ? (
            <span className="re-listing-card__price-per-sqm">
              {summary.pricePerSqm}
            </span>
          ) : null}
        </div>

        {stayPriceNote ? (
          <p className="re-listing-card__specs">{stayPriceNote}</p>
        ) : null}
      </div>
    </article>
  );
}
