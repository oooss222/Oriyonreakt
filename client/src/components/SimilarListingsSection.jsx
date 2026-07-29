import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "../lib/api";
import ListingCard from "./ListingCard";
import ListingGridSkeleton from "./ListingGridSkeleton";
import { CAT_LABELS } from "../data/listingCategories";

export default function SimilarListingsSection({
  cat,
  subcategory = "",
  excludeIds = [],
  title = "Ещё в этой категории",
  limit = 8,
}) {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const excludeKey = excludeIds.map(String).join(",");

  React.useEffect(() => {
    if (!cat) {
      setItems([]);
      setLoading(false);
      return undefined;
    }

    let active = true;

    async function loadSimilar() {
      try {
        setLoading(true);

        const data = await api.listings({
          cat,
          subcategory: subcategory || undefined,
          limit: Math.max(limit + excludeIds.length, limit),
          sort: "new",
        });

        const excluded = new Set(excludeIds.map(String));
        const list = (Array.isArray(data) ? data : [])
          .filter((item) => !excluded.has(String(item._id || item.id)))
          .slice(0, limit);

        if (active) {
          setItems(list);
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
    }

    loadSimilar();

    return () => {
      active = false;
    };
  }, [cat, subcategory, limit, excludeKey, excludeIds.length]);

  if (!cat) return null;

  const listingUrl = `/listing?cat=${encodeURIComponent(cat)}${
    subcategory
      ? `&subcategory=${encodeURIComponent(subcategory)}`
      : ""
  }`;

  const catLabel = CAT_LABELS[cat] || cat;

  if (!loading && items.length === 0) return null;

  return (
    <section className="space-y-4 pt-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {subcategory
              ? `${catLabel} · ${subcategory}`
              : `Категория «${catLabel}»`}
          </p>
        </div>

        <Link
          to={listingUrl}
          className="inline-flex items-center gap-1 text-sm font-medium text-sun hover:text-sun-600 shrink-0"
        >
          Все
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading && <ListingGridSkeleton count={4} columns="grid-cols-2 sm:grid-cols-4" />}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((item) => (
            <ListingCard key={item._id || item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
