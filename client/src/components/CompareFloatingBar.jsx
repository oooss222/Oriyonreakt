import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ImageOff, Scale, X } from "lucide-react";
import {
  readCompareEntries,
  COMPARE_MAX,
  getActiveCompareCat,
  findCompareCatWithItems,
  getEntryKey,
  clearCompare,
  removeCompareEntry,
} from "../lib/compareListings";
import { getCompareConfig, getComparePath, isComparePagePath } from "../lib/compareConfig";
import { resolveMediaUrl } from "../lib/media";
import { useI18n } from "../i18n";

function isUsableImageSrc(src) {
  const value = String(src || "").trim();
  if (!value) return false;
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("/img/") ||
    value.includes("res.cloudinary.com") ||
    value.includes("/upload/") ||
    value.includes("/uploads/")
  );
}

function barThumb(entry) {
  if (entry?.source === "external") {
    return {
      key: getEntryKey(entry),
      title: entry.snapshot?.title || "",
      image: entry.snapshot?.image || "",
    };
  }

  return {
    key: getEntryKey(entry),
    title: entry?.preview?.title || "",
    image: entry?.preview?.image || "",
  };
}

function CompareBarThumb({ item, onRemove, removeLabel }) {
  const resolved = item.image
    ? resolveMediaUrl(item.image, { width: 80, allowEmpty: true })
    : "";
  const initialSrc = isUsableImageSrc(resolved) ? resolved : "";
  const [src, setSrc] = React.useState(initialSrc);

  React.useEffect(() => {
    setSrc(initialSrc);
  }, [initialSrc]);

  return (
    <div className="relative shrink-0">
      <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/15">
        {src ? (
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setSrc("")}
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-white/35" aria-hidden>
            <ImageOff size={16} />
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => onRemove(item.key)}
        className="absolute -right-1 -top-1 z-[1] inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-ink-500 shadow-sm hover:bg-mist"
        aria-label={removeLabel}
        title={removeLabel}
      >
        <X size={10} />
      </button>
      <span className="sr-only">{item.title}</span>
    </div>
  );
}

export default function CompareFloatingBar() {
  const location = useLocation();
  const { t } = useI18n();
  const pathCat = getActiveCompareCat(location.pathname);
  const [activeCat, setActiveCat] = React.useState(
    () => findCompareCatWithItems(pathCat) || pathCat
  );
  const [entries, setEntries] = React.useState(() =>
    activeCat ? readCompareEntries(activeCat) : []
  );

  const count = entries.length;
  const config = activeCat ? getCompareConfig(activeCat) : null;
  const comparePath = activeCat ? getComparePath(activeCat) : "";

  const hidden =
    count === 0 ||
    !config ||
    isComparePagePath(location.pathname);

  React.useEffect(() => {
    const sync = () => {
      const nextCat = findCompareCatWithItems(getActiveCompareCat(location.pathname));
      setActiveCat(nextCat);
      setEntries(nextCat ? readCompareEntries(nextCat) : []);
    };

    sync();
    window.addEventListener("oriyon:compare-change", sync);
    return () => window.removeEventListener("oriyon:compare-change", sync);
  }, [location.pathname]);

  if (hidden) return null;

  const thumbs = entries.map(barThumb);

  return (
    <div className="compare-bar pointer-events-none fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] inset-x-0 z-[45] px-3 lg:bottom-6">
      <div className="pointer-events-auto mx-auto flex max-w-3xl items-center gap-2 overflow-hidden rounded-2xl border border-ink/10 bg-ink px-2.5 py-2 text-white shadow-lift sm:gap-3 sm:px-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-0.5 scrollbar-hide">
          {thumbs.map((item) => (
            <CompareBarThumb
              key={item.key}
              item={item}
              onRemove={(key) => removeCompareEntry(key, activeCat)}
              removeLabel={t("compare.removeFromCompare")}
            />
          ))}
        </div>

        <Link
          to={comparePath}
          className="inline-flex h-11 min-w-[7.5rem] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-sun px-3 text-sm font-semibold text-white transition hover:bg-sun-600 active:scale-[0.98]"
        >
          <Scale size={16} className="hidden sm:block" />
          <span className="tabular-nums">
            {t("compare.compareAction")} ({count})
          </span>
        </Link>

        <button
          type="button"
          onClick={() => clearCompare(activeCat)}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl px-2.5 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
          aria-label={t("compare.clear")}
        >
          {t("compare.clear")}
        </button>
      </div>
      <span className="sr-only">
        {t("compare.open", { count, max: COMPARE_MAX })}
      </span>
    </div>
  );
}
