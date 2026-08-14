import React from "react";
import { api } from "../lib/api";
import { getListingThumb } from "../lib/media";
import { formatPrice } from "../lib/format";
import { useI18n } from "../i18n";

export default function HeaderSearchSuggestions({
  query,
  visible,
  onSelect,
  onNavigate,
}) {
  const { t } = useI18n();
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

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
      <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-ink/10 bg-white shadow-lift overflow-hidden text-ink px-4 py-3 text-sm text-ink-400">
        {t("header.searching")}
      </div>
    );
  }

  if (!items.length) {
    return null;
  }

  return (
    <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-ink/10 bg-white shadow-lift overflow-hidden text-ink">
      {items.map((ad) => {
        const id = ad.id || ad._id;

        return (
          <button
            key={id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect?.(ad, id);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-sun-50 text-left border-b border-ink/5 last:border-b-0"
          >
            <img
              src={getListingThumb(ad)}
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
