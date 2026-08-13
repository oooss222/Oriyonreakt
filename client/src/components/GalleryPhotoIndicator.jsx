import React from "react";

export default function GalleryPhotoIndicator({
  total,
  activeIndex,
  onSelect,
  variant = "default",
  interaction = "click",
  className = "",
}) {
  if (total <= 1) {
    return null;
  }

  const isCompact = variant === "compact";

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/50 via-black/20 to-transparent ${
        isCompact ? "px-2.5 pb-2 pt-8" : "px-4 pb-3 pt-10 from-black/45 via-black/15"
      } ${className}`}
      aria-hidden={false}
    >
      <div
        className={`pointer-events-auto mx-auto flex items-center ${
          isCompact ? "gap-1" : "max-w-md gap-1.5"
        }`}
        role="tablist"
        aria-label="Фото объявления"
      >
        {Array.from({ length: total }).map((_, index) => {
          const isActive = index === activeIndex;

          const selectPhoto = (event) => {
            event.stopPropagation();
            onSelect?.(index);
          };

          return (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Фото ${index + 1} из ${total}`}
              onClick={interaction === "click" ? selectPhoto : undefined}
              onMouseEnter={interaction === "hover" ? selectPhoto : undefined}
              className={`group relative min-w-0 flex-1 overflow-hidden rounded-full bg-white/35 backdrop-blur-sm transition-all duration-300 hover:bg-white/50 ${
                isCompact ? "h-1" : "h-2"
              }`}
            >
              <span
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out ${
                  isActive
                    ? `w-full bg-sun ${isCompact ? "shadow-[0_0_6px_rgba(255,122,0,0.5)]" : "shadow-[0_0_10px_rgba(255,122,0,0.55)]"}`
                    : "w-0 bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>

      {!isCompact ? (
        <div className="pointer-events-none mt-2 text-center text-[11px] font-semibold tracking-wide text-white/90">
          {activeIndex + 1} / {total}
        </div>
      ) : null}
    </div>
  );
}
