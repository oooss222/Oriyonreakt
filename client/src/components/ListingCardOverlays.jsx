import React from "react";
import FavoriteButton from "./FavoriteButton";
import CompareListingButton from "./CompareListingButton";
import { PromotionBadgeGroup } from "./PromotionBadge";
import { formatViewCount } from "../lib/format";
import { isCompareSupported } from "../lib/compareListings";
import { Eye } from "lucide-react";

export default function ListingCardOverlays({
  views = 0,
  vip = false,
  top = false,
  morePhotos = 0,
  photoCount = 0,
  favoriteId,
  isFavorite = false,
  onFavChange,
  showFavorite = true,
  showCompare = true,
  compareCat = "",
  compactBottom = false,
}) {
  const viewCount = Number(views || 0);
  const photos = Number(photoCount || 0);
  const canCompare = showCompare && favoriteId && isCompareSupported(compareCat);

  return (
    <>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-12 bg-gradient-to-b from-black/30 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-10 bg-gradient-to-t from-black/25 to-transparent"
        aria-hidden
      />

      <div className="absolute left-2 top-2 z-10 max-w-[calc(100%-3.5rem)]">
        <PromotionBadgeGroup vip={vip} top={top} size="sm" />
      </div>

      {(showFavorite && favoriteId) || canCompare ? (
        <div
          className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {showFavorite && favoriteId ? (
            <FavoriteButton
              id={favoriteId}
              defaultActive={isFavorite}
              onChange={onFavChange}
              overlay
            />
          ) : null}
          {canCompare ? (
            <CompareListingButton
              listingId={favoriteId}
              cat={compareCat}
              overlay
              showOpenLink={false}
            />
          ) : null}
        </div>
      ) : null}

      {(viewCount > 0 || morePhotos > 0 || photos > 0) && (
        <div
          className={`absolute inset-x-0 z-10 flex items-center justify-between gap-2 px-2 ${
            compactBottom ? "bottom-5 pb-0" : "bottom-0 p-2"
          }`}
        >
          {photos > 0 ? (
            <span className="rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              {photos} фото
            </span>
          ) : viewCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              <Eye className="h-3 w-3" />
              {formatViewCount(viewCount)}
            </span>
          ) : (
            <span />
          )}
          {morePhotos > 0 ? (
            <span className="rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              +{morePhotos}
            </span>
          ) : null}
        </div>
      )}
    </>
  );
}
