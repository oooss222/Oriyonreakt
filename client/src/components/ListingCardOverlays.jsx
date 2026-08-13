import React from "react";
import { Eye } from "lucide-react";
import FavoriteButton from "./FavoriteButton";
import { formatViewCount } from "../lib/format";
import { useListingViewed } from "../lib/viewedListings";
import { PromotionBadgeGroup } from "./PromotionBadge";

export default function ListingCardOverlays({
  listingId,
  views = 0,
  vip = false,
  top = false,
  morePhotos = 0,
  favoriteId,
  isFavorite = false,
  onFavChange,
  showFavorite = true,
}) {
  const viewed = useListingViewed(listingId);
  const viewCount = Number(views || 0);

  return (
    <>
      <PromotionBadgeGroup
        vip={vip}
        top={top}
        size="sm"
        className="absolute left-2.5 top-2.5 z-10 max-w-[calc(100%-4.5rem)]"
      />

      {showFavorite && favoriteId && (
        <div
          className="absolute right-2.5 top-2.5 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <FavoriteButton
            id={favoriteId}
            defaultActive={isFavorite}
            onChange={onFavChange}
            overlay
          />
        </div>
      )}

      {viewed && !showFavorite && (
        <span className="absolute right-2.5 top-2.5 z-10 rounded-full border border-white/10 bg-slate-900/65 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
          Просмотрено
        </span>
      )}

      {viewed && showFavorite && (
        <span className="absolute right-2.5 top-12 z-10 rounded-full border border-white/10 bg-slate-900/65 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
          Просмотрено
        </span>
      )}

      {viewCount > 0 && (
        <span className="absolute bottom-2.5 left-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          <Eye className="h-3.5 w-3.5" />
          {formatViewCount(viewCount)}
        </span>
      )}

      {morePhotos > 0 && (
        <span className="absolute bottom-2.5 right-2.5 z-10 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white">
          +{morePhotos}
        </span>
      )}
    </>
  );
}
