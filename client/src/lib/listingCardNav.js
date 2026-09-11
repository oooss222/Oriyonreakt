import { trackListingClick } from "./track";

/**
 * Props for the <Link> a listing card wraps itself in. Using a real <Link>
 * (instead of a div with role="link"/onClick/onKeyDown, which every card
 * variant used to hand-roll) gets keyboard nav, focus styling, and
 * ctrl/cmd/middle-click "open in new tab" for free from react-router.
 */
export function getListingCardLinkProps(item, { listings, trackSource } = {}) {
  const listingId = item?.id || item?._id;

  if (!listingId) {
    return { to: "#", onClick: (e) => e.preventDefault() };
  }

  return {
    to: `/ad/${listingId}`,
    onClick: () => {
      if (trackSource) {
        trackListingClick(item, { source: trackSource });
      }

      sessionStorage.setItem("ad_preview", JSON.stringify(item));

      if (listings?.length) {
        sessionStorage.setItem("ad_list", JSON.stringify(listings));
      }
    },
  };
}
