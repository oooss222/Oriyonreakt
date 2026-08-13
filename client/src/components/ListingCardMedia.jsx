import React from "react";
import ListingCardOverlays from "./ListingCardOverlays";
import GalleryPhotoIndicator from "./GalleryPhotoIndicator";
import { getListingImages } from "../lib/media";
import { getPromotionMediaClass } from "../lib/promotionStyles";

export default function ListingCardMedia({
  item,
  favoriteId,
  isFavorite = false,
  onFavChange,
  vip = false,
  top = false,
  views = 0,
  className = "listing-card__media",
}) {
  const listingId = item?.id || item?._id;
  const images = React.useMemo(() => getListingImages(item), [item]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const touchStartX = React.useRef(null);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [listingId]);

  const hasMultiple = images.length > 1;

  const setIndexFromPointer = (clientX, element) => {
    if (!hasMultiple || !element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const ratio = Math.min(
      1,
      Math.max(0, (clientX - rect.left) / rect.width)
    );
    const index = Math.min(
      images.length - 1,
      Math.floor(ratio * images.length)
    );

    setActiveIndex(index);
  };

  const onMouseMove = (event) => {
    setIndexFromPointer(event.clientX, event.currentTarget);
  };

  const onMouseLeave = () => {
    setActiveIndex(0);
  };

  const onTouchStart = (event) => {
    touchStartX.current = event.changedTouches?.[0]?.clientX ?? null;
  };

  const onTouchEnd = (event) => {
    const startX = touchStartX.current;
    const endX = event.changedTouches?.[0]?.clientX;

    touchStartX.current = null;

    if (startX == null || endX == null || !hasMultiple) {
      return;
    }

    const delta = endX - startX;

    if (Math.abs(delta) < 40) {
      return;
    }

    event.stopPropagation();

    setActiveIndex((current) => {
      if (delta < 0) {
        return current === images.length - 1 ? 0 : current + 1;
      }

      return current === 0 ? images.length - 1 : current - 1;
    });
  };

  return (
    <div
      className={className}
      onMouseMove={hasMultiple ? onMouseMove : undefined}
      onMouseLeave={hasMultiple ? onMouseLeave : undefined}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <img
        src={images[activeIndex] || images[0]}
        alt={item?.title || "Объявление"}
        loading="lazy"
        className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${getPromotionMediaClass(
          { vip }
        )}`}
        onError={(e) => {
          e.currentTarget.src = "/img/placeholder.jpg";
        }}
      />

      <ListingCardOverlays
        views={views}
        vip={vip}
        top={top}
        morePhotos={hasMultiple ? 0 : Math.max(0, images.length - 1)}
        favoriteId={favoriteId}
        isFavorite={isFavorite}
        onFavChange={onFavChange}
        compactBottom={hasMultiple}
      />

      {hasMultiple ? (
        <GalleryPhotoIndicator
          variant="compact"
          interaction="hover"
          total={images.length}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
        />
      ) : null}
    </div>
  );
}
