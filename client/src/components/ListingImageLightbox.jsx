import React from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useBodyScrollLock, useFocusTrap } from "../ui";
import { useI18n } from "../i18n";

export default function ListingImageLightbox({
  open,
  onClose,
  images = [],
  activeIndex = 0,
  onChangeIndex,
  title,
}) {
  const { t } = useI18n();
  const panelRef = React.useRef(null);
  const touchStartX = React.useRef(null);
  const heading = title || t("a11y.photoViewer");

  useBodyScrollLock(open);
  useFocusTrap(panelRef, open);

  React.useEffect(() => {
    if (!open) return undefined;

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
    return () => window.removeEventListener("keydown", onKeyDown);
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
      ref={panelRef}
      className="fixed inset-0 flex flex-col bg-black/95"
      style={{ zIndex: "var(--z-modal)" }}
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      tabIndex={-1}
      onClick={onClose}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{heading}</p>
          {images.length > 1 && (
            <p className="mt-0.5 text-xs text-white/70" aria-live="polite">
              {t("a11y.photoOf", {
                index: activeIndex + 1,
                total: images.length,
              })}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
          aria-label={t("a11y.close")}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-3 sm:px-16"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={(event) => event.stopPropagation()}
      >
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-4"
              aria-label={t("a11y.photoPrev")}
            >
              <ChevronLeft className="h-6 w-6" aria-hidden />
            </button>

            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-4"
              aria-label={t("a11y.photoNext")}
            >
              <ChevronRight className="h-6 w-6" aria-hidden />
            </button>
          </>
        )}

        <img
          src={currentSrc}
          alt={heading}
          className="max-h-full max-w-full select-none object-contain"
          draggable={false}
        />
      </div>

      {images.length > 1 && (
        <div
          className="shrink-0 border-t border-white/10 bg-black/40 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mx-auto flex max-w-4xl snap-x snap-mandatory gap-2 overflow-x-auto scrollbar-none">
            {images.map((src, index) => (
              <button
                key={`${src}-${index}`}
                type="button"
                onClick={() => onChangeIndex?.(index)}
                aria-label={t("a11y.goToPhoto", { index: index + 1 })}
                aria-current={activeIndex === index ? "true" : undefined}
                className={`shrink-0 snap-start overflow-hidden rounded-xl border-2 transition ${
                  activeIndex === index
                    ? "border-sun-500"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-14 w-16 bg-ink-800 object-cover sm:h-16 sm:w-20"
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
