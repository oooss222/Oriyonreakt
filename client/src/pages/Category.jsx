import React from "react";
import { useParams, Link, useNavigate, Navigate } from "react-router-dom";
import { DEFAULT_REAL_ESTATE_BROWSE_PATH } from "../lib/realestateSeo";
import EmptyState from "../components/EmptyState";
import Breadcrumbs from "../components/Breadcrumbs";
import CategoryHero from "../components/CategoryHero";
import TransportQuickFilters from "../components/transport/TransportQuickFilters";
import ListingGridSkeleton from "../components/ListingGridSkeleton";
import ListingCard from "../components/ListingCard";
import AdSlot from "../components/AdSlot";
import { usePageMeta } from "../lib/usePageMeta";
import { api } from "../lib/api";
import { CATS } from "../data/listingCategories";
import {
  readCompareIds,
  COMPARE_MAX,
  isCompareSupported,
} from "../lib/compareListings";
import { getComparePath } from "../lib/compareConfig";
import SectionHeader from "../components/SectionHeader";
import { useI18n, getCategoryLabel } from "../i18n";
import { Search, FolderOpen, Scale, ArrowRight, Sparkles } from "lucide-react";

const PREVIEW_LIMIT = 6;

export default function Category() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { t } = useI18n();

  if (slug === "realestate") {
    return <Navigate to={DEFAULT_REAL_ESTATE_BROWSE_PATH} replace />;
  }

  if (slug === "repair") {
    return <Navigate to="/c/services" replace />;
  }

  const cat = CATS[slug];

  const [q, setQ] = React.useState("");
  const [stats, setStats] = React.useState({ total: 0, bySubcategory: {} });
  const [preview, setPreview] = React.useState([]);
  const [loadingPreview, setLoadingPreview] = React.useState(true);
  const [compareCount, setCompareCount] = React.useState(() =>
    isCompareSupported(slug) ? readCompareIds(slug).length : 0
  );

  React.useEffect(() => {
    if (!isCompareSupported(slug)) return undefined;

    const sync = () => setCompareCount(readCompareIds(slug).length);
    window.addEventListener("oriyon:compare-change", sync);
    return () => window.removeEventListener("oriyon:compare-change", sync);
  }, [slug]);

  const subs = React.useMemo(() => {
    if (!cat) return [];

    const t = q.trim().toLowerCase();

    if (!t) return cat.subs;

    return cat.subs.filter((s) => s.toLowerCase().includes(t));
  }, [q, cat]);

  React.useEffect(() => {
    if (!slug) return undefined;

    let active = true;

    async function loadData() {
      try {
        setLoadingPreview(true);

        const [statsData, listings] = await Promise.all([
          api.listingStats(slug),
          api.listings({ cat: slug, limit: PREVIEW_LIMIT, sort: "new" }),
        ]);

        if (!active) return;

        setStats(statsData || { total: 0, bySubcategory: {} });
        setPreview(Array.isArray(listings) ? listings.filter(Boolean) : []);
      } catch {
        if (active) {
          setStats({ total: 0, bySubcategory: {} });
          setPreview([]);
        }
      } finally {
        if (active) {
          setLoadingPreview(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [slug]);

  const catTitle = cat ? getCategoryLabel(slug, t) : "";

  usePageMeta({
    title: cat ? catTitle : t("empty.categoryNotFound"),
    description: cat
      ? t("category.metaDescription", {
          title: catTitle,
          count: stats.total || cat.subs.length,
        })
      : t("empty.categoryNotFoundMeta"),
    url: typeof window !== "undefined" ? window.location.href : undefined,
  });

  if (!cat) {
    return (
      <div className="page-container py-6">
        <EmptyState
          icon={FolderOpen}
          title={t("empty.categoryNotFound")}
          description={t("empty.categoryNotFoundDesc")}
          actionLabel={t("empty.goHome")}
          actionTo="/"
        />
      </div>
    );
  }

  function subCount(sub) {
    return stats.bySubcategory?.[sub] || 0;
  }

  return (
    <div className="page-container stack-page">
      <Breadcrumbs
        items={[
          { label: t("nav.home"), to: "/" },
          { label: catTitle },
        ]}
      />

      <CategoryHero cat={cat} slug={slug} total={stats.total} />

      {isCompareSupported(slug) && compareCount > 0 && (
        <Link
          to={getComparePath(slug)}
          className="flex items-center justify-between gap-3 rounded-2xl border border-ink-800 bg-ink-900 px-4 py-3.5 text-white shadow-xs transition-colors hover:bg-ink-800"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <Scale size={18} className="text-sun-400" aria-hidden />
            {t("compare.open", { count: compareCount, max: COMPARE_MAX })}
          </span>
          <ArrowRight size={18} className="text-white/70" aria-hidden />
        </Link>
      )}

      {slug === "transport" && (
        <AdSlot
          placement="category_feed"
          cat={slug}
          variant="banner"
          className="overflow-hidden rounded-2xl [&_img]:max-h-40 [&_img]:w-full [&_img]:object-cover"
        />
      )}

      {slug === "transport" && <TransportQuickFilters />}

      <section className="space-y-4" aria-labelledby="category-subcats">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 id="category-subcats" className="section-title text-lg">
            {t("category.subcategories")}
          </h2>

          <div className="flex items-center gap-3 md:w-96">
            <label htmlFor="subcat-search" className="sr-only">
              {t("category.searchSubcats")}
            </label>
            <div className="relative min-w-0 flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                aria-hidden
              />
              <input
                id="subcat-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("empty.searchSubcats")}
                className="input w-full pl-9"
              />
            </div>

            <p className="shrink-0 text-xs text-ink-400" aria-live="polite">
              {t("category.subcatsFound")}{" "}
              <span className="font-semibold text-ink-700">{subs.length}</span>
            </p>
          </div>
        </div>

        {subs.length === 0 ? (
          <EmptyState
            icon={Search}
            title={t("empty.searchQueryTitle", { query: q })}
            description={t("empty.searchNoMatch")}
            actionLabel={t("empty.resetSearch")}
            onAction={() => setQ("")}
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/listing?cat=${slug}`}
              className="subcategory-chip subcategory-chip-active"
            >
              {t("category.all")}
              {stats.total > 0 && (
                <span className="ml-1.5 opacity-80">({stats.total})</span>
              )}
            </Link>

            {subs.map((sub) => {
              const count = subCount(sub);
              const empty = count === 0;

              return (
                <Link
                  key={sub}
                  to={`/listing?cat=${slug}&subcategory=${encodeURIComponent(sub)}`}
                  className={`subcategory-chip ${
                    empty
                      ? "border-ink-200 bg-mist-100 text-ink-400"
                      : "subcategory-chip-idle"
                  }`}
                >
                  {sub}
                  {count > 0 && (
                    <span className="ml-1.5 opacity-70">({count})</span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="category-fresh">
        <SectionHeader
          id="category-fresh"
          title={t("category.freshListings")}
          icon={Sparkles}
          linkTo={`/listing?cat=${slug}`}
          linkLabel={t("home.viewAll")}
        />

        {loadingPreview && <ListingGridSkeleton count={6} />}

        {!loadingPreview && preview.length === 0 && (
          <EmptyState
            icon={Search}
            title={t("empty.noListings")}
            description={t("empty.noListingsHint")}
            actionLabel={t("empty.postListing")}
            actionTo={`/add?cat=${slug}`}
          />
        )}

        {!loadingPreview && preview.length > 0 && (
          <>
            <AdSlot
              placement="category_feed"
              cat={slug}
              variant="native"
              className="mb-4"
            />

          <div className="grid-items">
            {preview.map((ad) => (
              <ListingCard key={ad._id || ad.id} item={ad} trackSource="category" />
            ))}
          </div>
          </>
        )}
      </section>

      <Link
        to={`/listing?cat=${slug}`}
        className="btn btn-primary btn-lg btn-block sm:hidden"
      >
        {t("footer.allListings")} ({stats.total})
      </Link>
    </div>
  );
}
