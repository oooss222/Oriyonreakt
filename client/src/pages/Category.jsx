import React from "react";
import { useParams, Link, useNavigate, Navigate } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import Breadcrumbs from "../components/Breadcrumbs";
import CategoryHero from "../components/CategoryHero";
import TransportQuickFilters from "../components/transport/TransportQuickFilters";
import ListingGridSkeleton from "../components/ListingGridSkeleton";
import FavoriteButton from "../components/FavoriteButton";
import CompareListingButton from "../components/CompareListingButton";
import ListingCardOverlays from "../components/ListingCardOverlays";
import AdSlot from "../components/AdSlot";
import { usePageMeta } from "../lib/usePageMeta";
import { api } from "../lib/api";
import { CATS } from "../data/listingCategories";
import { getListingThumb } from "../lib/media";
import { formatPrice } from "../lib/format";
import {
  getPromotionCardClass,
  getPromotionMediaClass,
} from "../lib/promotionStyles";
import { Search, FolderOpen, MapPin, Scale, ArrowRight } from "lucide-react";
import {
  readCompareIds,
  COMPARE_MAX,
  isCompareSupported,
} from "../lib/compareListings";
import { getComparePath } from "../lib/compareConfig";

const PREVIEW_LIMIT = 6;

export default function Category() {
  const { slug } = useParams();
  const nav = useNavigate();

  if (slug === "realestate") {
    return <Navigate to="/realestate" replace />;
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

  usePageMeta({
    title: cat ? cat.title : "Категория не найдена",
    description: cat
      ? `Объявления в категории «${cat.title}» на Oriyon.store. ${stats.total || cat.subs.length} объявлений.`
      : "Запрошенная категория не существует на Oriyon.store.",
    url: typeof window !== "undefined" ? window.location.href : undefined,
  });

  if (!cat) {
    return (
      <div className="page-container py-6">
        <EmptyState
          icon={FolderOpen}
          title="Категория не найдена"
          description="Проверьте адрес или выберите категорию на главной."
          actionLabel="На главную"
          actionTo="/"
        />
      </div>
    );
  }

  function subCount(sub) {
    return stats.bySubcategory?.[sub] || 0;
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Главная", to: "/" },
          { label: cat.title },
        ]}
      />

      <CategoryHero cat={cat} slug={slug} total={stats.total} />

      {isCompareSupported(slug) && compareCount > 0 && (
        <Link
          to={getComparePath(slug)}
          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-900/10 bg-slate-900 px-4 py-3.5 text-white hover:bg-slate-800 transition shadow-sm"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <Scale size={18} className="text-sun" />
            Сравнение · {compareCount}/{COMPARE_MAX}
          </span>
          <ArrowRight size={18} className="text-white/70" />
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

      <div className="surface-panel p-3 md:p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Быстрый поиск по подкатегориям…"
            className="input w-full"
          />

          <div className="text-xs text-ink-400 md:w-56">
            Найдено подкатегорий:{" "}
            <span className="font-medium text-ink">{subs.length}</span>
          </div>
        </div>
      </div>

      {slug === "transport" && <TransportQuickFilters />}

      <section>
        {subs.length === 0 ? (
          <EmptyState
            icon={Search}
            title={`Ничего не найдено по запросу «${q}»`}
            description="Попробуйте другой запрос или посмотрите все объявления категории."
            actionLabel="Сбросить поиск"
            onAction={() => setQ("")}
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/listing?cat=${slug}`}
              className="subcategory-chip subcategory-chip-active"
            >
              Все
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
                      ? "border-ink/10 bg-mist text-ink-300"
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

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-title text-lg">Свежие объявления</h2>

          <Link
            to={`/listing?cat=${slug}`}
            className="text-sm text-sun hover:text-sun-600 font-medium"
          >
            Смотреть все
          </Link>
        </div>

        {loadingPreview && <ListingGridSkeleton count={6} />}

        {!loadingPreview && preview.length === 0 && (
          <EmptyState
            icon={Search}
            title="Пока нет объявлений"
            description="Станьте первым — разместите объявление в этой категории."
            actionLabel="Подать объявление"
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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {preview.map((ad, idx) => {
              const id = ad._id || ad.id;
              const imgUrl = getListingThumb(ad);

              return (
                <div
                  key={id || idx}
                  role="link"
                  tabIndex={0}
                  onClick={() => {
                    if (!id) return;
                    sessionStorage.setItem("ad_preview", JSON.stringify(ad));
                    nav(`/ad/${id}`);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (!id) return;
                      sessionStorage.setItem("ad_preview", JSON.stringify(ad));
                      nav(`/ad/${id}`);
                    }
                  }}
                  className={`group relative flex flex-col rounded-2xl border bg-white p-1.5 transition hover:shadow-lg cursor-pointer ${getPromotionCardClass(
                    { vip: ad.vip, top: ad.top }
                  )}`}
                >
                  <div className="relative">
                    <img
                      src={imgUrl}
                      alt={ad.title || "Фото"}
                      loading="lazy"
                      className={`w-full h-28 object-cover rounded-xl bg-slate-100 ${getPromotionMediaClass({ vip: ad.vip })}`}
                    />

                    <ListingCardOverlays
                      listingId={id}
                      views={ad.views}
                      vip={ad.vip}
                      top={ad.top}
                      morePhotos={Math.max(0, (ad.images?.length || 0) - 1)}
                    />
                  </div>

                  <div className="mt-2 flex-1 flex flex-col gap-1">
                    <div className="font-semibold text-sm text-ink line-clamp-2 group-hover:text-sun transition">
                      {ad.title || "Без названия"}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="text-price text-sm">
                        {formatPrice(ad.price)}
                      </div>

                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isCompareSupported(slug) && (
                          <CompareListingButton listingId={id} cat={slug} compact />
                        )}
                        <FavoriteButton
                          id={id}
                          defaultActive={ad.isFavorite}
                          compact
                        />
                      </div>
                    </div>

                    <div className="text-xs text-ink-400 line-clamp-1 flex items-center gap-1">
                      <MapPin size={13} />
                      {ad.location || ad.city || "Душанбе"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}
      </section>

      <div className="sm:hidden">
        <Link
          to={`/listing?cat=${slug}`}
          className="flex w-full justify-center px-4 py-3 rounded-xl bg-sun text-white hover:bg-sun-600 transition shadow-sm font-medium"
        >
          Все объявления ({stats.total})
        </Link>
      </div>
    </div>
  );
}
