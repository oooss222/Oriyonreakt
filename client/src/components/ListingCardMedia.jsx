import React from "react";
import ListingCardOverlays from "./ListingCardOverlays";
import GalleryPhotoIndicator from "./GalleryPhotoIndicator";
import { getListingImages, buildSrcSet } from "../lib/media";
import { useI18n } from "../i18n";

// Cards are at most a third of the viewport on phones and a fifth on wide
// screens, so the browser never needs the full-width file.
const CARD_SIZES = "(min-width: 1536px) 18vw, (min-width: 1024px) 23vw, (min-width: 640px) 31vw, 46vw";

export default function ListingCardMedia({
  item,
  favoriteId,
  isFavorite = false,
  onFavChange,
  vip = false,
  top = false,
  views = 0,
  className = "listing-card__media",
  photoCount = 0,
  showFavorite = true,
  showCompare = true,
  eager = false,
}) {
  const { t } = useI18n();
  const listingId = item?.id || item?._id;
  const images = React.useMemo(() => getListingImages(item, { width: 400 }), [item]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const touchStartX = React.useRef(null);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [listingId]);

  const hasMultiple = images.length > 1;
  const current = images[activeIndex] || images[0];

  const setIndexFromPointer = (clientX, element) => {
    if (!hasMultiple || !element) return;

    const rect = element.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const index = Math.min(images.length - 1, Math.floor(ratio * images.length));

    // Avoid a state update on every pixel of movement.
    setActiveIndex((prev) => (prev === index ? prev : index));
  };

  const onTouchStart = (event) => {
    touchStartX.current = event.changedTouches?.[0]?.clientX ?? null;
  };

  const onTouchEnd = (event) => {
    const startX = touchStartX.current;
    const endX = event.changedTouches?.[0]?.clientX;

    touchStartX.current = null;

    if (startX == null || endX == null || !hasMultiple) return;

    const delta = endX - startX;
    if (Math.abs(delta) < 40) return;

    event.stopPropagation();

    setActiveIndex((currentIndex) => {
      if (delta < 0) return currentIndex === images.length - 1 ? 0 : currentIndex + 1;
      return currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    });
  };

  return (
    <div
      className={className}
      onMouseMove={hasMultiple ? (event) => setIndexFromPointer(event.clientX, event.currentTarget) : undefined}
      onMouseLeave={hasMultiple ? () => setActiveIndex(0) : undefined}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <img
        src={current}
        srcSet={buildSrcSet(current) || undefined}
        sizes={CARD_SIZES}
        alt={item?.title || t("listing.title")}
        /* The container fixes the ratio; the intrinsic size stops the grid from
           reflowing while photos stream in. */
        width={400}
        height={300}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        fetchpriority={eager ? "high" : undefined}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        onError={(event) => {
          event.currentTarget.srcset = "";
          event.currentTarget.src = "/img/placeholder.jpg";
        }}
      />

      <ListingCardOverlays
        views={views}
        vip={vip}
        top={top}
        photoCount={photoCount || (hasMultiple ? images.length : 0)}
        favoriteId={favoriteId}
        isFavorite={isFavorite}
        onFavChange={onFavChange}
        showFavorite={showFavorite}
        showCompare={showCompare}
        compareCat={item?.cat || ""}
        compactBottom={hasMultiple}
      />

      {hasMultiple && (
        <GalleryPhotoIndicator
          variant="compact"
          interaction="hover"
          total={images.length}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
        />
      )}
    </div>
  );
}
