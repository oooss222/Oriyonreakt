import React from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { getListingImages } from "../lib/media";
import { getCompareItemKey } from "../lib/compareResolve";
import { useI18n } from "../i18n";
import { IconButton } from "../ui";

export default function CompareGalleryRow({ items = [] }) {
  const { t } = useI18n();
  const [index, setIndex] = React.useState(0);

  const columns = React.useMemo(
    () =>
      items.map((item) => ({
        key: getCompareItemKey(item),
        title: item.title || "",
        images: getListingImages(item, { width: 480 }),
      })),
    [items]
  );

  const maxLen = Math.max(1, ...columns.map((col) => col.images.length || 1));

  React.useEffect(() => {
    setIndex(0);
  }, [items]);

  if (!items.length) return null;

  const go = (delta) => {
    setIndex((prev) => {
      const next = prev + delta;
      if (next < 0) return maxLen - 1;
      if (next >= maxLen) return 0;
      return next;
    });
  };

  return (
    <section className="surface-panel space-y-3 p-3 md:p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-bold text-ink-900">
          <Images size={16} className="text-sun-500" aria-hidden="true" />
          {t("compare.galleryTitle")}
        </h2>

        {maxLen > 1 && (
          <div className="flex items-center gap-2">
            <IconButton
              icon={ChevronLeft}
              label={t("a11y.photoPrev")}
              size="sm"
              onClick={() => go(-1)}
            />
            <span className="text-xs font-medium tabular-nums text-ink-500">
              {index + 1}/{maxLen}
            </span>
            <IconButton
              icon={ChevronRight}
              label={t("a11y.photoNext")}
              size="sm"
              onClick={() => go(1)}
            />
          </div>
        )}
      </div>

      <div
        className={`grid gap-3 ${
          columns.length === 1
            ? "grid-cols-1"
            : columns.length === 2
              ? "grid-cols-2"
              : columns.length === 3
                ? "grid-cols-3"
                : "grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {columns.map((col) => {
          const src = col.images[Math.min(index, Math.max(col.images.length - 1, 0))] ||
            col.images[0] ||
            "/img/placeholder.jpg";
          return (
            <div key={col.key} className="space-y-1.5">
              <div className="aspect-[4/3] overflow-hidden rounded-xl bg-mist-200">
                <img
                  src={src}
                  alt={col.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = "/img/placeholder.jpg";
                  }}
                />
              </div>
              <p className="text-xs font-medium text-ink-600 line-clamp-1">{col.title}</p>
              <p className="text-2xs font-medium text-ink-400">
                {col.images.length
                  ? t("compare.galleryPhotos", { count: col.images.length })
                  : t("compare.galleryNoPhotos")}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
