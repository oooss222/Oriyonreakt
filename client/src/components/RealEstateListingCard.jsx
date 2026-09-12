import React from "react";
import { Link } from "react-router-dom";
import ListingCardMedia from "./ListingCardMedia";
import { getListingCardLinkProps } from "../lib/listingCardNav";
import { enrichRealEstateListing, buildRealEstateCardDisplay } from "../lib/realEstate";
import RealEstateDailyFeatures from "./realestate/RealEstateDailyFeatures";
import RealEstateRentFeatures from "./realestate/RealEstateRentFeatures";
import { useListingViewed } from "../lib/viewedListings";
import { getPromotionCardClass } from "../lib/promotionStyles";
import { MapPin, Maximize2 } from "lucide-react";
import { formatPrice } from "../lib/format";
import { formatListingTimeAgo, formatNightsLabel } from "../i18n/helpers";
import { getListingImages } from "../lib/media";
import { useI18n } from "../i18n";

function RealEstateListingCard({
  item,
  variant = "grid",
  nights = 0,
  onFav,
}) {
  const { t, lang } = useI18n();
  const numberLocale =
    lang === "en" ? "en-US" : lang === "tg" ? "tg-TJ" : "ru-RU";
  const listing = enrichRealEstateListing(item);
  const id = listing.id || listing._id;
  const summary = listing.realEstateSummary || {};
  const cardCopy = buildRealEstateCardDisplay(listing);
  const viewed = useListingViewed(id);
  const isHorizontal = variant === "horizontal";
  // summary.deal comes from getSpecValue(specs, "Тип сделки") / item.reDealType,
  // which stores the Russian display label itself (DEAL_TYPES has no separate
  // stable code — value === label there too). Comparing against the label is
  // fragile but changing it would mean reworking the real estate data model,
  // which is out of scope here.
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
  const linkProps = getListingCardLinkProps(listing);

  const stayPriceNote =
    totalStayPrice &&
    t("realestate.card.stayTotal", {
      price: totalStayPrice.toLocaleString(numberLocale),
      currency: t("price.currency"),
      nights: formatNightsLabel(nights, t),
    });

  if (isHorizontal) {
    return (
      <Link
        {...linkProps}
        className={`group relative flex overflow-hidden rounded-2xl border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sun/40 ${getPromotionCardClass(
          { vip: listing.vip, top: listing.top }
        )} flex-row p-2.5 gap-3`}
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
                {formatPrice(listing.price, { currency: t("price.currency") })}
                {isDaily && (
                  <span className="ml-1 text-sm font-semibold text-ink-500">
                    {t("realestate.card.perDay")}
                  </span>
                )}
              </div>
              {stayPriceNote && (
                <div className="text-xs font-medium text-ink-500 mt-0.5">
                  {stayPriceNote}
                </div>
              )}
            </div>
            {summary.deal && (
              <span className="shrink-0 inline-flex px-2 py-0.5 rounded-lg bg-mist-100 text-ink-600 text-[10px] font-bold uppercase">
                {summary.deal}
              </span>
            )}
          </div>

          {summary.pricePerSqm && !isDaily && (
            <div className="text-xs text-ink-500 font-medium">
              {summary.pricePerSqm}
            </div>
          )}

          <h3 className="mt-1 text-sm font-bold text-ink-800 line-clamp-2 group-hover:text-sun transition">
            {cardCopy.title}
          </h3>

          <div className="mt-1.5 text-xs text-ink-500 line-clamp-1 flex items-center gap-1">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{locationLabel}</span>
          </div>

          <div className="mt-auto pt-2 flex items-end justify-end gap-2">
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

        <div className="hidden sm:flex items-center pr-2 text-ink-300 group-hover:text-sun">
          <Maximize2 size={18} />
        </div>
      </Link>
    );
  }

  return (
    <Link
      {...linkProps}
      className={`re-listing-card group focus:outline-none focus:ring-2 focus:ring-sun/40 ${viewed ? "listing-card--viewed" : ""} ${getPromotionCardClass(
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

        <h3 className="re-listing-card__title">{cardCopy.title}</h3>

        {cardCopy.specsLine ? (
          <p className="re-listing-card__specs">{cardCopy.specsLine}</p>
        ) : null}

        {isDaily ? (
          <>
            <p className="re-listing-card__specs">
              {[
                summary.guests &&
                  t("realestate.card.guestsAbbr", { count: summary.guests }),
                summary.rooms &&
                  t("realestate.card.roomsAbbr", { count: summary.rooms }),
              ]
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
            {formatPrice(listing.price, { currency: t("price.currency") })}
            {isDaily ? (
              <span className="ml-1 text-xs font-semibold text-ink-400">
                {t("realestate.card.perDay")}
              </span>
            ) : null}
            {isRent ? (
              <span className="ml-1 text-xs font-semibold text-ink-400">
                {t("realestate.card.perMonth")}
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
    </Link>
  );
}

// Grids render dozens of these; without memo a filter or sort change
// re-renders every card even though its listing has not changed (matches
// the same optimization ListingCard.jsx already had).
export default React.memo(RealEstateListingCard);
