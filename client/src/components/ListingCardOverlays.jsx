import React from "react";
import { Camera, Eye } from "lucide-react";
import FavoriteButton from "./FavoriteButton";
import CompareListingButton from "./CompareListingButton";
import { PromotionBadgeGroup } from "./PromotionBadge";
import { formatViewCount } from "../lib/format";
import { isCompareSupported } from "../lib/compareListings";
import { useI18n } from "../i18n";

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
  const { t } = useI18n();
  const viewCount = Number(views || 0);
  const photos = Number(photoCount || 0);
  const canCompare = showCompare && favoriteId && isCompareSupported(compareCat);

  return (
    <>
      {vip || top ? (
        <div className="absolute left-2 top-2 z-10 max-w-[calc(100%-4rem)]">
          <PromotionBadgeGroup vip={vip} top={top} size="sm" />
        </div>
      ) : null}

      {(showFavorite && favoriteId) || canCompare ? (
        <div className="absolute right-1.5 top-1.5 z-20 flex flex-col items-end gap-1">
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

      {photos > 0 || viewCount > 0 || morePhotos > 0 ? (
        <div
          className={`pointer-events-none absolute inset-x-0 z-10 flex items-center justify-between gap-2 px-2 ${
            compactBottom ? "bottom-5" : "bottom-2"
          }`}
        >
          {photos > 1 ? (
            <span className="media-pill">
              <Camera size={11} aria-hidden />
              {photos}
              <span className="sr-only"> {t("a11y.photoCount")}</span>
            </span>
          ) : viewCount > 0 ? (
            <span className="media-pill">
              <Eye size={11} aria-hidden />
              {formatViewCount(viewCount)}
              <span className="sr-only"> {t("a11y.viewCount")}</span>
            </span>
          ) : (
            <span />
          )}

          {morePhotos > 0 ? (
            <span className="media-pill">+{morePhotos}</span>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
