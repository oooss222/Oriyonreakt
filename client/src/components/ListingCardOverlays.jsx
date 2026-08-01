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
        className="absolute left-2 top-2 z-10 max-w-[calc(100%-4.5rem)]"
      />

      {viewed && (
        <span className="absolute top-2.5 right-2.5 z-10 rounded-full border border-white/10 bg-slate-900/65 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
          Просмотрено
        </span>
      )}

      {viewCount > 0 && (
        <span className="absolute bottom-2.5 left-2.5 z-10 inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-900/65 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-md">
          <Eye className="h-3 w-3" />
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
