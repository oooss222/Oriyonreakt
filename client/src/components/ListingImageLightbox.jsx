import React from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function ListingImageLightbox({
  open,
  onClose,
  images = [],
  activeIndex = 0,
  onChangeIndex,
  title = "Фото объявления",
}) {
  const touchStartX = React.useRef(null);

  React.useEffect(() => {
    if (!open) return undefined;

    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
        return;
      }

      if (images.length <= 1) return;

      if (event.key === "ArrowLeft") {
        onChangeIndex?.(activeIndex === 0 ? images.length - 1 : activeIndex - 1);
      }

      if (event.key === "ArrowRight") {
        onChangeIndex?.(activeIndex === images.length - 1 ? 0 : activeIndex + 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, images.length, activeIndex, onClose, onChangeIndex]);

  const goPrev = React.useCallback(() => {
    if (images.length <= 1) return;
    onChangeIndex?.(activeIndex === 0 ? images.length - 1 : activeIndex - 1);
  }, [activeIndex, images.length, onChangeIndex]);

  const goNext = React.useCallback(() => {
    if (images.length <= 1) return;
    onChangeIndex?.(activeIndex === images.length - 1 ? 0 : activeIndex + 1);
  }, [activeIndex, images.length, onChangeIndex]);

  const onTouchStart = (event) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event) => {
    if (touchStartX.current == null || images.length <= 1) return;

    const endX = event.changedTouches[0]?.clientX;
    if (endX == null) return;

    const diff = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(diff) < 48) return;
    if (diff > 0) goPrev();
    else goNext();
  };

  if (!open || !images.length) return null;

  const currentSrc = images[activeIndex] || images[0];

  return createPortal(
    <div
      className="fixed inset-0 z-[120] bg-black/95 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр фото"
      onClick={onClose}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white">
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{title}</div>
          {images.length > 1 && (
            <div className="text-xs text-white/70 mt-0.5">
              {activeIndex + 1} из {images.length}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition shrink-0"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div
        className="relative flex-1 min-h-0 flex items-center justify-center px-3 sm:px-16"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={(event) => event.stopPropagation()}
      >
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              aria-label="Следующее фото"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        <img
          src={currentSrc}
          alt={title}
          className="max-w-full max-h-full object-contain select-none"
          draggable={false}
        />
      </div>

      {images.length > 1 && (
        <div
          className="shrink-0 border-t border-white/10 bg-black/40 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory max-w-4xl mx-auto">
            {images.map((src, index) => (
              <button
                key={`${src}-${index}`}
                type="button"
                onClick={() => onChangeIndex?.(index)}
                className={`snap-start shrink-0 rounded-xl overflow-hidden border-2 transition ${
                  activeIndex === index
                    ? "border-sun ring-2 ring-sun/30"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={src}
                  alt=""
                  className="w-16 h-14 sm:w-20 sm:h-16 object-cover bg-slate-800"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
