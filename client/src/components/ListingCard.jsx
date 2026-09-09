import React from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import ListingCardMedia from "./ListingCardMedia";
import ListingCardPrice from "./ListingCardFooter";
import { formatListingTimeAgo } from "../i18n/helpers";
import { trackListingClick } from "../lib/track";
import { useListingViewed } from "../lib/viewedListings";
import { getPromotionCardClass } from "../lib/promotionStyles";
import { cn } from "../ui";
import { useI18n } from "../i18n";

function ListingCard({
  item,
  onFav,
  listings,
  trackSource,
  className = "",
  style,
  eager = false,
}) {
  const { t } = useI18n();

  const listingId = item?.id || item?._id;
  const viewed = useListingViewed(listingId);
  const title = item?.title || t("listing.noTitle");
  const location = item?.location || item?.city || t("listing.noLocation");

  // The card already holds the listing the detail page needs, so hand it over
  // and let that page paint while its own request is still in flight.
  const primeDetailView = () => {
    if (!listingId) return;

    if (trackSource) {
      trackListingClick(item, { source: trackSource });
    }

    try {
      sessionStorage.setItem("ad_preview", JSON.stringify(item));

      if (listings?.length) {
        sessionStorage.setItem("ad_list", JSON.stringify(listings));
      }
    } catch {
      // Private browsing and full quotas only cost us the warm start.
    }
  };

  // The title is the real link so the card keeps working with a keyboard, a
  // screen reader and middle-click; this only extends the mouse target to the
  // rest of the card without swallowing the controls layered on the photo.
  const onCardClick = (event) => {
    if (!listingId) return;
    if (event.target.closest("a, button, input, [role='button']")) return;

    primeDetailView();
    event.currentTarget.querySelector(".listing-card__link")?.click();
  };

  return (
    <article
      onClick={onCardClick}
      className={cn(
        "listing-card group",
        listingId && "cursor-pointer",
        viewed && "listing-card--viewed",
        getPromotionCardClass({ vip: item?.vip, top: item?.top }),
        className
      )}
      style={style}
    >
      <ListingCardMedia
        item={item}
        views={item?.views}
        vip={item?.vip}
        top={item?.top}
        favoriteId={listingId}
        isFavorite={item?.isFavorite}
        onFavChange={(active) => onFav?.(listingId, active)}
        eager={eager}
      />

      <div className="listing-card__body">
        <ListingCardPrice item={item} listingId={listingId} />

        <h3 className="listing-card__title">
          <Link
            to={listingId ? `/ad/${listingId}` : "#"}
            className="listing-card__link"
            onClick={primeDetailView}
          >
            {title}
          </Link>
        </h3>

        <div className="listing-card__footer">
          <span className="listing-card__location">
            <MapPin size={12} className="shrink-0" aria-hidden />
            <span className="truncate">{location}</span>
          </span>
          <time className="listing-card__time">
            {formatListingTimeAgo(item, t)}
          </time>
        </div>
      </div>
    </article>
  );
}

// Grids render dozens of these; without memo a filter or sort change re-renders
// every card even though its listing has not changed.
export default React.memo(ListingCard);
