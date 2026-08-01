import React from "react";
import { Eye } from "lucide-react";
import { formatViewCount } from "../lib/format";
import { useListingViewed } from "../lib/viewedListings";
import { PromotionBadgeGroup } from "./PromotionBadge";
import { getPromotionTier } from "../lib/promotionStyles";

export default function ListingCardOverlays({
  listingId,
  views = 0,
  vip = false,
  top = false,
  morePhotos = 0,
}) {
  const viewed = useListingViewed(listingId);
  const viewCount = Number(views || 0);
  const tier = getPromotionTier({ vip, top });
  const isPromoted = Boolean(tier);

  return (
    <>
      {isPromoted && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-16 bg-gradient-to-b from-black/45 via-black/15 to-transparent"
          aria-hidden="true"
        />
      )}

      <PromotionBadgeGroup
        vip={vip}
        top={top}
        size="sm"
        layout="row"
        className="absolute left-2 top-2 z-10 max-w-[calc(100%-4.5rem)]"
      />

      {viewed && (
        <span className="absolute top-2 right-2 z-10 max-w-[calc(100%-5rem)] truncate rounded-full border border-white/15 bg-slate-900/70 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
          Просмотрено
        </span>
      )}

      {viewCount > 0 && (
        <span className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 rounded-full border border-white/15 bg-slate-900/70 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-md">
          <Eye className="h-3 w-3 shrink-0" />
          {formatViewCount(viewCount)}
        </span>
      )}

      {morePhotos > 0 && (
        <span className="absolute bottom-2 right-2 z-10 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-semibold text-white">
          +{morePhotos}
        </span>
      )}
    </>
  );
}
