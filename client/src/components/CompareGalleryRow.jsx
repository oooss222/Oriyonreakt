import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { getListingImages } from "../lib/media";
import { getCompareItemKey } from "../lib/compareResolve";
import { useI18n } from "../i18n";

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
    <section className="rounded-2xl border border-slate-200 bg-white p-3 md:p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-900 inline-flex items-center gap-2">
          <Images size={16} className="text-sun" />
          {t("compare.galleryTitle")}
        </h3>
        {maxLen > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              className="rounded-lg border p-1.5 text-slate-500 hover:bg-slate-50"
              aria-label={t("a11y.photoPrev")}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs tabular-nums text-slate-500">
              {index + 1}/{maxLen}
            </span>
            <button
              type="button"
              onClick={() => go(1)}
              className="rounded-lg border p-1.5 text-slate-500 hover:bg-slate-50"
              aria-label={t("a11y.photoNext")}
            >
              <ChevronRight size={16} />
            </button>
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
              <div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
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
              <div className="text-xs font-medium text-slate-600 line-clamp-1">{col.title}</div>
              <div className="text-[11px] text-slate-400">
                {col.images.length
                  ? t("compare.galleryPhotos", { count: col.images.length })
                  : t("compare.galleryNoPhotos")}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
