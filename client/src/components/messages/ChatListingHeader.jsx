import React from "react";
import { ChevronRight, Image as ImageIcon } from "lucide-react";
import { Button, Skeleton, StatusBadge } from "../../ui";
import {
  listingImageUrl,
  listingStatusLabel,
  listingStatusTone,
} from "../../lib/messagesUtils";
import { formatPrice } from "../../lib/format";

export default function ChatListingHeader({ listing, selected, t }) {
  if (!selected?.listingId) return null;

  const thumb = listingImageUrl(
    listing?.images?.[0]?.url || listing?.images?.[0] || selected.listingImage
  );

  const title = listing?.title || selected.listingTitle || t("chat.listing");

  const price = formatPrice(listing?.price ?? selected.listingPrice, {
    emptyLabel: t("price.negotiable"),
    currency: t("price.currency"),
  });

  const status = listing?.status || selected.listingStatus || "approved";

  // Deep links carry only a title, so price and status wait for the listing
  // rather than showing a default that may be wrong.
  const contextKnown = Boolean(listing) || selected.listingPrice != null;

  return (
    <div className="chat-thread__context">
      {thumb ? (
        <img
          src={thumb}
          alt=""
          loading="lazy"
          className="h-10 w-10 shrink-0 rounded-lg bg-mist-200 object-cover"
        />
      ) : (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-mist-100 text-ink-300">
          <ImageIcon size={16} aria-hidden="true" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-900">{title}</p>

        {contextKnown ? (
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-price text-sm">{price}</span>
            <StatusBadge
              tone={listingStatusTone(status)}
              label={listingStatusLabel(status, t)}
            />
          </div>
        ) : (
          <Skeleton className="mt-1 h-3.5 w-36" />
        )}
      </div>

      <Button
        to={`/ad/${selected.listingId}`}
        size="sm"
        iconRight={ChevronRight}
        aria-label={t("chat.toListing")}
        title={t("chat.toListing")}
        className="shrink-0"
      >
        <span className="hidden sm:inline">{t("chat.toListing")}</span>
      </Button>
    </div>
  );
}
