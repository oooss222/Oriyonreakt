import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "../lib/api";
import ListingCard from "./ListingCard";
import ListingGridSkeleton from "./ListingGridSkeleton";
import { useI18n, getCategoryLabel } from "../i18n";

export default function SimilarListingsSection({
  cat,
  subcategory = "",
  excludeIds = [],
  title,
  limit = 8,
}) {
  const { t } = useI18n();
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const sectionTitle = title || t("listing.similarTitle");
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

  const listingUrl = `/c/${encodeURIComponent(cat)}${
    subcategory
      ? `?subcategory=${encodeURIComponent(subcategory)}`
      : ""
  }`;

  const catLabel = getCategoryLabel(cat, t);

  if (!loading && items.length === 0) return null;

  return (
    <section className="space-y-4 pt-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{sectionTitle}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {subcategory
              ? `${catLabel} · ${subcategory}`
              : t("listing.categoryLabel", { name: catLabel })}
          </p>
        </div>

        <Link
          to={listingUrl}
          className="inline-flex items-center gap-1 text-sm font-medium text-sun hover:text-sun-600 shrink-0"
        >
          {t("category.all")}
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
