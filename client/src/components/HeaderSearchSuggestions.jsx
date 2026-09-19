import React from "react";
import { api } from "../lib/api";
import { getListingThumb } from "../lib/media";
import { formatPrice } from "../lib/format";
import { useI18n } from "../i18n";
import Skeleton from "./ui/Skeleton";

export default function HeaderSearchSuggestions({
  query,
  visible,
  onSelect,
  onNavigate,
  idSuffix = "default",
}) {
  const { t } = useI18n();
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const domId = `header-search-suggestions-${idSuffix}`;

  React.useEffect(() => {
    const text = String(query || "").trim();

    if (text.length < 2) {
      setItems([]);
      setLoading(false);
      return undefined;
    }

    let active = true;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await api.listingSuggest(text, 6);

        if (active) {
          setItems(Array.isArray(data) ? data : []);
        }
      } catch {
        if (active) {
          setItems([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  if (!visible || String(query || "").trim().length < 2) {
    return null;
  }

  if (loading && items.length === 0) {
    return (
      <div
        id={domId}
        role="status"
        className="absolute left-0 right-0 top-full z-50 mt-2 max-w-[calc(100vw-1.5rem)] space-y-2 overflow-hidden rounded-2xl border border-ink/10 bg-white px-4 py-3 shadow-lift animate-fade-in-scale"
      >
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!items.length) {
    return null;
  }

  return (
    <div
      id={domId}
      role="listbox"
      aria-label={t("header.searchPlaceholder")}
      className="absolute left-0 right-0 top-full z-50 mt-2 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-ink/10 bg-white text-ink shadow-lift animate-fade-in-scale"
    >
      {items.map((ad) => {
        const id = ad.id || ad._id;

        return (
          <button
            key={id}
            type="button"
            role="option"
            aria-selected="false"
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect?.(ad, id);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-sun-50 text-left border-b border-ink/5 last:border-b-0"
          >
            <img
              src={getListingThumb(ad, { width: 96 })}
              alt={ad.title || t("listing.title")}
              className="w-12 h-12 rounded-xl object-cover bg-mist"
            />
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">
                {ad.title || t("listing.noTitle")}
              </div>
              <div className="text-xs text-ink-400">
                {formatPrice(ad.price)}
                {ad.location ? ` · ${ad.location}` : ""}
              </div>
            </div>
          </button>
        );
      })}

      <button
        type="button"
        role="option"
        aria-selected="false"
        onMouseDown={(e) => {
          e.preventDefault();
          onNavigate?.();
        }}
        className="w-full px-4 py-2.5 text-sm font-medium text-sun hover:bg-sun-50 text-left"
      >
        {t("header.showAllResults")}
      </button>
    </div>
  );
}
