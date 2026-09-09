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
import { Button, Skeleton } from "../ui";

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
    <section className="surface-panel space-y-3 p-4 md:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight text-ink-900">
            <Scale size={18} className="text-sun-500" aria-hidden="true" />
            {t("compare.similarTitle")}
          </h2>
          <p className="mt-0.5 text-sm text-ink-400">{t("compare.similarHint")}</p>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-44 w-full" rounded="rounded-xl" />
          ))}
        </div>
      )}

      {!loading && suggestions.length === 0 && (
        <p className="text-sm text-ink-400">{t("compare.similarEmpty")}</p>
      )}

      {!loading && suggestions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {suggestions.slice(0, 4).map((ad) => {
            const id = ad.id || ad._id;
            const active = isInCompare(id, cat);
            return (
              <article key={id} className="card overflow-hidden">
                <Link to={`/ad/${id}`} className="block" tabIndex={-1}>
                  <img
                    src={getListingThumb(ad, { width: 320 })}
                    alt=""
                    className="h-28 w-full bg-mist-200 object-cover"
                    loading="lazy"
                  />
                </Link>

                <div className="space-y-1.5 p-2.5">
                  <p className="text-price text-sm">
                    {formatPrice(ad.price, { emptyLabel: "—" })}
                  </p>
                  <Link
                    to={`/ad/${id}`}
                    className="block text-xs font-medium text-ink-700 line-clamp-2 hover:text-sun-700"
                  >
                    {ad.title}
                  </Link>
                  <Button
                    size="sm"
                    block
                    variant={active ? "secondary" : "primary"}
                    icon={Plus}
                    disabled={full && !active}
                    onClick={() => addItem(ad)}
                  >
                    {active ? t("compare.inCompare") : t("compare.addToCompare")}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
