import React from "react";
import { Link } from "react-router-dom";
import { Plus, Scale } from "lucide-react";
import { api } from "../lib/api";
import { loadRelatedListings } from "../lib/listingQuickFacts";
import { getListingThumb } from "../lib/media";
import { formatPrice } from "../lib/format";
import {
  toggleCompareId,
  isInCompare,
  readCompareCount,
  COMPARE_MAX,
  isCompareSupported,
} from "../lib/compareListings";
import { getCompareItemKey, isExternalCompareItem } from "../lib/compareResolve";
import { useI18n } from "../i18n";

function pickSeedItem(items = []) {
  const oriyon = items.find((item) => !isExternalCompareItem(item));
  return oriyon || items[0] || null;
}

export default function CompareSimilarPanel({ cat, items = [], onAdded }) {
  const { t } = useI18n();
  const [suggestions, setSuggestions] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const seed = React.useMemo(() => pickSeedItem(items), [items]);
  const excludeIds = React.useMemo(() => {
    return new Set(
      items
        .filter((item) => !isExternalCompareItem(item))
        .map((item) => String(getCompareItemKey(item)))
    );
  }, [items]);

  React.useEffect(() => {
    let alive = true;
    if (!seed?.cat || !isCompareSupported(cat)) {
      setSuggestions([]);
      return undefined;
    }

    setLoading(true);
    loadRelatedListings(api, seed, 8)
      .then((rows) => {
        if (!alive) return;
        setSuggestions(
          (rows || []).filter((row) => !excludeIds.has(String(row.id || row._id)))
        );
      })
      .catch(() => {
        if (alive) setSuggestions([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [seed, cat, excludeIds]);

  if (!seed) return null;

  const full = readCompareCount(cat) >= COMPARE_MAX;

  const addItem = (listing) => {
    const id = listing.id || listing._id;
    if (!id || full || isInCompare(id, cat)) return;
    const result = toggleCompareId(id, cat);
    if (result?.ok) onAdded?.();
  };

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-4 md:p-5 space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-bold text-ink tracking-tight inline-flex items-center gap-2">
            <Scale size={18} className="text-sun" />
            {t("compare.similarTitle")}
          </h3>
          <p className="text-sm text-ink-400 mt-0.5">{t("compare.similarHint")}</p>
        </div>
      </div>

      {loading && <div className="text-sm text-ink-300">{t("compare.loading")}</div>}

      {!loading && suggestions.length === 0 && (
        <p className="text-sm text-ink-300">{t("compare.similarEmpty")}</p>
      )}

      {!loading && suggestions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {suggestions.slice(0, 4).map((ad) => {
            const id = ad.id || ad._id;
            const active = isInCompare(id, cat);
            return (
              <article
                key={id}
                className="rounded-xl border border-ink/10 overflow-hidden bg-mist/50"
              >
                <Link to={`/ad/${id}`} className="block">
                  <img
                    src={getListingThumb(ad)}
                    alt={ad.title || ""}
                    className="h-28 w-full object-cover bg-mist"
                    loading="lazy"
                  />
                </Link>
                <div className="p-2.5 space-y-1.5">
                  <div className="text-sm font-semibold text-sun">
                    {formatPrice(ad.price, { emptyLabel: "—" })}
                  </div>
                  <Link
                    to={`/ad/${id}`}
                    className="block text-xs font-medium text-ink line-clamp-2 hover:text-sun"
                  >
                    {ad.title}
                  </Link>
                  <button
                    type="button"
                    disabled={full && !active}
                    onClick={() => addItem(ad)}
                    className={`w-full inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "bg-mist-200 text-ink-500"
                        : "bg-sun text-white hover:bg-sun-600 disabled:opacity-50"
                    }`}
                  >
                    <Plus size={12} />
                    {active ? t("compare.inCompare") : t("compare.addToCompare")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
