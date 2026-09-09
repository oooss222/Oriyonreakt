import React from "react";
import { Search } from "lucide-react";
import { api } from "../lib/api";
import { getListingThumb } from "../lib/media";
import { formatPrice } from "../lib/format";
import { useI18n } from "../i18n";

const MIN_QUERY = 2;

/**
 * Debounced suggestion fetch.
 *
 * Kept separate from the popup so the search field can own the active option
 * and expose a real combobox to assistive tech.
 */
export function useSearchSuggestions(query, enabled) {
  const text = String(query || "").trim();
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!enabled || text.length < MIN_QUERY) {
      setItems([]);
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const data = await api.listingSuggest(text, 6);
        if (active) setItems(Array.isArray(data) ? data : []);
      } catch {
        if (active) setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [text, enabled]);

  return { items, loading, ready: text.length >= MIN_QUERY };
}

export default function HeaderSearchSuggestions({
  listboxId,
  optionId,
  items,
  loading,
  activeIndex,
  onSelect,
  onNavigate,
}) {
  const { t } = useI18n();

  if (loading && items.length === 0) {
    return (
      <div
        className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-400 shadow-lg"
        style={{ zIndex: "var(--z-dropdown)" }}
      >
        {t("header.searching")}
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div
      className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-lg"
      style={{ zIndex: "var(--z-dropdown)" }}
    >
      <ul id={listboxId} role="listbox" aria-label={t("a11y.searchSuggestions")}>
        {items.map((ad, index) => {
          const id = ad.id || ad._id;
          const active = index === activeIndex;

          return (
            <li key={id} role="none">
              <button
                type="button"
                role="option"
                id={optionId(index)}
                aria-selected={active}
                tabIndex={-1}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onSelect?.(ad, id);
                }}
                className={`flex w-full items-center gap-3 border-b border-ink-100 px-3.5 py-2.5 text-left last:border-b-0 ${
                  active ? "bg-mist-100" : "hover:bg-mist-50"
                }`}
              >
                <img
                  src={getListingThumb(ad, { width: 96 })}
                  alt=""
                  width={44}
                  height={44}
                  loading="lazy"
                  decoding="async"
                  className="h-11 w-11 shrink-0 rounded-lg bg-mist-200 object-cover"
                />

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink-900">
                    {ad.title || t("listing.noTitle")}
                  </span>
                  <span className="block truncate text-xs text-ink-400">
                    {formatPrice(ad.price)}
                    {ad.location ? ` · ${ad.location}` : ""}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onMouseDown={(event) => {
          event.preventDefault();
          onNavigate?.();
        }}
        className="flex w-full items-center gap-2 border-t border-ink-200 bg-mist-50 px-3.5 py-2.5 text-left text-sm font-semibold text-sun-700 hover:bg-mist-100"
      >
        <Search size={15} aria-hidden="true" />
        {t("header.showAllResults")}
      </button>
    </div>
  );
}
