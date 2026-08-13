import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

  const goPrev = (event) => {
    event?.stopPropagation();
    setActiveIndex((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  };

  const goNext = (event) => {
    event?.stopPropagation();
    setActiveIndex((current) =>
      current === images.length - 1 ? 0 : current + 1
    );
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

    if (delta < 0) {
      goNext();
    } else {
      goPrev();
    }
  };

  return (
    <div
      className={className}
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
        <>
          <button
            type="button"
            aria-label="Предыдущее фото"
            onClick={goPrev}
            className="absolute left-1.5 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm opacity-0 transition hover:bg-white group-hover:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            aria-label="Следующее фото"
            onClick={goNext}
            className="absolute right-1.5 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm opacity-0 transition hover:bg-white group-hover:opacity-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <GalleryPhotoIndicator
            variant="compact"
            total={images.length}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
          />
        </>
      ) : null}
    </div>
  );
}
