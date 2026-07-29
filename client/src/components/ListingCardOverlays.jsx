import React from "react";
import { Eye } from "lucide-react";
import { formatViewCount } from "../lib/format";
import { useListingViewed } from "../lib/viewedListings";
import { PromotionBadgeGroup } from "./PromotionBadge";

export default function ListingCardOverlays({
  listingId,
  views = 0,
  vip = false,
  top = false,
  morePhotos = 0,
}) {
  const viewed = useListingViewed(listingId);
  const viewCount = Number(views || 0);

  return (
    <>
      <PromotionBadgeGroup
        vip={vip}
        top={top}
        size="sm"
        className="absolute left-2 top-2 z-10"
      />

      {viewed && (
        <span className="absolute top-2 right-2 z-10 px-2 py-0.5 text-[11px] font-medium rounded-md bg-black/55 text-white backdrop-blur-sm">
          Просмотрено
        </span>
      )}

      {viewCount > 0 && (
        <span className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] rounded-md bg-black/55 text-white backdrop-blur-sm">
          <Eye className="w-3 h-3" />
          {formatViewCount(viewCount)}
        </span>
      )}

      {morePhotos > 0 && (
        <span className="absolute bottom-2 right-2 z-10 text-[11px] bg-black/70 text-white rounded px-1.5 py-0.5">
          +{morePhotos}
        </span>
      )}
    </>
  );
}
