import React from "react";
import { useNavigate } from "react-router-dom";
import CompareListingButton from "./CompareListingButton";
import FavoriteButton from "./FavoriteButton";
import PriceAdequacyBadge from "./PriceAdequacyBadge";
import ListingCardOverlays from "./ListingCardOverlays";
import BusinessBadge from "./BusinessBadge";
import { getListingThumb } from "../lib/media";
import { formatPrice } from "../lib/format";
import { enrichRealEstateListing } from "../lib/realEstate";
import {
  getPromotionCardClass,
  getPromotionMediaClass,
} from "../lib/promotionStyles";
import { MapPin, Maximize2 } from "lucide-react";

export default function RealEstateListingCard({
  item,
  variant = "grid",
  onFav,
}) {
  const nav = useNavigate();
  const listing = enrichRealEstateListing(item);
  const id = listing.id || listing._id;
  const img = getListingThumb(listing);
  const summary = listing.realEstateSummary || {};
  const isHorizontal = variant === "horizontal";

  const openAd = () => {
    if (!id) return;
    sessionStorage.setItem("ad_preview", JSON.stringify(listing));
    nav(`/ad/${id}`);
  };

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
      )} ${isHorizontal ? "flex-row p-2.5 gap-3" : "flex-col p-1.5"}`}
    >
      <div
        className={`relative overflow-hidden shrink-0 ${
          isHorizontal ? "w-40 h-32 rounded-xl sm:w-44" : "w-full"
        }`}
      >
        <img
          src={img}
          alt={listing.title || "Недвижимость"}
          loading="lazy"
          className={`object-cover bg-slate-100 transition-transform duration-500 group-hover:scale-105 ${getPromotionMediaClass({ vip: listing.vip })} ${
            isHorizontal ? "w-full h-full" : "w-full h-40 sm:h-44"
          }`}
        />

        <ListingCardOverlays
          listingId={id}
          views={listing.views}
          vip={listing.vip}
          top={listing.top}
          morePhotos={Math.max(0, (listing.images?.length || 0) - 1)}
        />

        {summary.deal && (
          <span className="absolute left-2 bottom-2 z-10 inline-flex px-2 py-0.5 rounded-lg bg-black/65 text-white text-[10px] font-semibold">
            {summary.deal}
          </span>
        )}
      </div>

      <div className={`min-w-0 flex-1 flex flex-col ${isHorizontal ? "py-0.5" : "p-2"}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="font-display font-extrabold text-lg text-lagoon-700 leading-tight">
            {formatPrice(listing.price)}
          </div>
          {summary.deal && isHorizontal && (
            <span className="shrink-0 inline-flex px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
              {summary.deal}
            </span>
          )}
        </div>

        {summary.pricePerSqm && (
          <div className="text-xs text-slate-500 font-medium">
            {summary.pricePerSqm}
          </div>
        )}

        {summary.line && (
          <div className="mt-1 text-sm font-semibold text-slate-800 line-clamp-1">
            {summary.line}
          </div>
        )}

        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <PriceAdequacyBadge item={listing} compact />
        </div>

        <h3 className="mt-1 text-sm text-slate-700 line-clamp-2 group-hover:text-sun transition">
          {listing.title || "Без названия"}
        </h3>

        <div className="mt-1.5">
          <BusinessBadge
            sellerType={listing.ownerSellerType}
            businessVerified={listing.ownerBusinessVerified}
          />
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <div onClick={(e) => e.stopPropagation()}>
            <CompareListingButton listingId={id} />
          </div>

          <FavoriteButton
            id={id}
            defaultActive={listing.isFavorite}
            onChange={(active) => onFav?.(id, active)}
            compact
          />
        </div>

        <div className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1 min-w-0 mt-2">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">
            {summary.district
              ? `${summary.district}, ${listing.location || "Душанбе"}`
              : listing.location || "Локация не указана"}
          </span>
        </div>

        {listing.subcategory && !isHorizontal && (
          <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
            {listing.subcategory}
          </div>
        )}
      </div>

      {isHorizontal && (
        <div className="hidden sm:flex items-center pr-2 text-slate-300 group-hover:text-sun">
          <Maximize2 size={18} />
        </div>
      )}
    </article>
  );
}
