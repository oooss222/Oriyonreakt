import React from "react";
import { Link } from "react-router-dom";
import ListingCardMedia from "./ListingCardMedia";
import { enrichRealEstateListing, buildRealEstateCardDisplay } from "../lib/realEstate";
import RealEstateDailyFeatures from "./realestate/RealEstateDailyFeatures";
import RealEstateRentFeatures from "./realestate/RealEstateRentFeatures";
import { useListingViewed } from "../lib/viewedListings";
import { getPromotionCardClass } from "../lib/promotionStyles";
import { MapPin, Maximize2 } from "lucide-react";
import { formatPrice } from "../lib/format";
import { getListingImages } from "../lib/media";
import { cn } from "../ui";
import { useI18n, formatListingTimeAgo, formatNightsLabel } from "../i18n";

export default function RealEstateListingCard({
  item,
  variant = "grid",
  nights = 0,
  onFav,
}) {
  const { t } = useI18n();
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
    : listing.location || t("location.dushanbe");
  const photoCount = getListingImages(listing).length;
  const currency = t("price.currency");

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

  const priceSuffix = isDaily
    ? t("realestate.perNightShort")
    : isRent
      ? t("realestate.perMonthShort")
      : "";

  const stayPriceNote =
    totalStayPrice &&
    t("realestate.stayTotal", {
      price: formatPrice(totalStayPrice, { currency }),
      nights: formatNightsLabel(nights, t),
    });

  if (isHorizontal) {
    return (
      <article
        onClick={onCardClick}
        className={cn(
          "listing-card group flex cursor-pointer flex-row gap-3 p-2.5",
          viewed && "listing-card--viewed",
          getPromotionCardClass({ vip: listing.vip, top: listing.top })
        )}
      >
        <ListingCardMedia
          item={listing}
          className="relative h-32 w-40 shrink-0 overflow-hidden rounded-xl bg-mist-200 sm:w-44"
          views={listing.views}
          vip={listing.vip}
          top={listing.top}
          favoriteId={id}
          isFavorite={listing.isFavorite}
          onFavChange={(active) => onFav?.(id, active)}
          photoCount={photoCount}
        />

        <div className="flex min-w-0 flex-1 flex-col py-0.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="listing-card__price-row">
                <span className="listing-card__price text-base">
                  {formatPrice(listing.price, { currency })}
                </span>
                {priceSuffix ? (
                  <span className="listing-card__price-suffix">{priceSuffix}</span>
                ) : null}
              </div>
              {stayPriceNote ? (
                <div className="listing-card__price-note mt-0.5">{stayPriceNote}</div>
              ) : null}
            </div>
            {summary.deal ? (
              <span className="badge badge-neutral shrink-0 uppercase">
                {summary.deal}
              </span>
            ) : null}
          </div>

          {summary.pricePerSqm && !isDaily ? (
            <div className="listing-card__details">{summary.pricePerSqm}</div>
          ) : null}

          <h3 className="listing-card__title mt-1 font-semibold text-ink-800">
            <Link to={href} className="listing-card__link" onClick={primeDetailView}>
              {cardCopy.title}
            </Link>
          </h3>

          <div className="listing-card__location mt-1.5">
            <MapPin size={12} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{locationLabel}</span>
          </div>

          <div className="mt-auto flex items-end justify-end gap-2 pt-2">
            <div className="listing-card__meta">
              <time className="listing-card__time">
                {formatListingTimeAgo(listing, t)}
              </time>
              {viewed ? (
                <span className="listing-card__viewed">{t("listing.viewed")}</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="hidden items-center pr-2 text-ink-300 group-hover:text-sun-600 sm:flex">
          <Maximize2 size={18} aria-hidden="true" />
        </div>
      </article>
    );
  }

  const dailyOccupancy = [
    summary.guests && t("realestate.guestsShort", { count: summary.guests }),
    summary.rooms && t("realestate.roomsShort", { count: summary.rooms }),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      onClick={onCardClick}
      className={cn(
        "listing-card group",
        id && "cursor-pointer",
        viewed && "listing-card--viewed",
        getPromotionCardClass({ vip: listing.vip, top: listing.top })
      )}
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

      <div className="listing-card__body">
        {/* Price leads, exactly like the generic listing card. */}
        <div className="listing-card__price-row">
          <span className="listing-card__price">
            {formatPrice(listing.price, { currency })}
          </span>
          {priceSuffix ? (
            <span className="listing-card__price-suffix">{priceSuffix}</span>
          ) : null}
          {!isDaily && !isRent && summary.pricePerSqm ? (
            <span className="listing-card__price-note">{summary.pricePerSqm}</span>
          ) : null}
        </div>

        {stayPriceNote ? (
          <p className="listing-card__price-note">{stayPriceNote}</p>
        ) : null}

        <h3 className="listing-card__title">
          <Link to={href} className="listing-card__link" onClick={primeDetailView}>
            {cardCopy.title}
          </Link>
        </h3>

        {cardCopy.specsLine ? (
          <p className="listing-card__details">{cardCopy.specsLine}</p>
        ) : null}

        {isDaily ? (
          <>
            {dailyOccupancy ? (
              <p className="listing-card__details">{dailyOccupancy}</p>
            ) : null}
            <RealEstateDailyFeatures specs={listing.specs} compact />
          </>
        ) : null}

        {isRent ? <RealEstateRentFeatures specs={listing.specs} compact /> : null}

        <div className="listing-card__footer">
          <span className="listing-card__location">
            <MapPin size={12} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{locationLabel}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
