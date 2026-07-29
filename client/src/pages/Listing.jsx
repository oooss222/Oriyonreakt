import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import FavoriteButton from "../components/FavoriteButton";
import ListingGridSkeleton from "../components/ListingGridSkeleton";
import EmptyState from "../components/EmptyState";
import Breadcrumbs from "../components/Breadcrumbs";
import ListingFiltersPanel from "../components/ListingFiltersPanel";
import SavedSearchesPanel from "../components/SavedSearchesPanel";
import ListingCardOverlays from "../components/ListingCardOverlays";
import SubcategoryChips from "../components/SubcategoryChips";
import SimilarListingsSection from "../components/SimilarListingsSection";
import AdSlot, { AdFeedCard, useAdPlacement } from "../components/AdSlot";
import { buildFeedWithAds } from "../lib/adFeed";
import { FEED_AD_INTERVAL } from "../lib/adPlacements";
import { usePageMeta } from "../lib/usePageMeta";
import { getListingThumb } from "../lib/media";
import { formatPrice, formatListingDate } from "../lib/format";
import { sortListingsByMode } from "../lib/listingSort";
import {
  getPromotionCardAccent,
  getPromotionCardClass,
} from "../lib/promotionStyles";
import { CATS, parseSpecsParam } from "../data/listingCategories";
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  PackageSearch,
} from "lucide-react";

function buildListingParams(draft, urlCat = "") {
  const next = {};
  const normalizedSearch = String(draft?.search || "").trim();
  const effectiveCat = draft.cat || urlCat;

  if (normalizedSearch) {
    next.search = normalizedSearch;
    next.q = normalizedSearch;
  }

  if (effectiveCat) next.cat = effectiveCat;
  if (draft.subcategory) next.subcategory = draft.subcategory;
  if (draft.priceFrom) next.priceFrom = draft.priceFrom;
  if (draft.priceTo) next.priceTo = draft.priceTo;
  if (draft.location) next.location = draft.location;
  if (draft.region && !draft.location) next.region = draft.region;
  if (draft.sort) next.sort = draft.sort;

  const specEntries = Object.entries(draft.specs || {}).filter(
    ([name, value]) => String(name).trim() && String(value).trim()
  );

  if (specEntries.length) {
    next.specs = JSON.stringify(Object.fromEntries(specEntries));
  }

  return next;
}

function searchParamsToDraft(params) {
  return {
    search: params.get("search") || params.get("q") || "",
    cat: params.get("cat") || "",
    subcategory: params.get("subcategory") || "",
    priceFrom: params.get("priceFrom") || "",
    priceTo: params.get("priceTo") || "",
    location: params.get("location") || "",
    region: params.get("region") || "",
    sort: params.get("sort") || "new",
    specs: parseSpecsParam(params.get("specs")),
  };
}

function buildListingQueryFromSearchParams(params) {
  const draft = searchParamsToDraft(params);
  return {
    ...buildListingParams(draft, draft.cat),
    limit: 100,
  };
}

function buildListingQueryFromDraft(draft, urlCat = "") {
  return {
    ...buildListingParams(draft, urlCat),
    limit: 100,
  };
}

function draftsMatch(appliedDraft, nextDraft, urlCat = "") {
  return (
    JSON.stringify(buildListingParams(appliedDraft, urlCat)) ===
    JSON.stringify(buildListingParams(nextDraft, urlCat))
  );
}

export default function Listing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const nav = useNavigate();

  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [previewTotal, setPreviewTotal] = React.useState(0);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  const cat = searchParams.get("cat") || "";
  const subcategory = searchParams.get("subcategory") || "";
  const search =
    searchParams.get("search") || searchParams.get("q") || "";
  const paramsKey = searchParams.toString();

  const appliedDraft = React.useMemo(
    () => searchParamsToDraft(searchParams),
    [paramsKey, searchParams]
  );

  const activeSpecs = appliedDraft.specs;
  const priceFrom = appliedDraft.priceFrom;
  const priceTo = appliedDraft.priceTo;
  const location = appliedDraft.location;
  const region = appliedDraft.region;
  const sort = appliedDraft.sort;

  const [draft, setDraft] = React.useState(appliedDraft);

  React.useEffect(() => {
    setDraft(appliedDraft);
  }, [paramsKey, appliedDraft]);

  React.useEffect(() => {
    if (!mobileFiltersOpen) return undefined;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileFiltersOpen]);

  const listingQuery = React.useMemo(
    () => buildListingQueryFromSearchParams(searchParams),
    [paramsKey, searchParams]
  );

  const draftIsDirty = React.useMemo(
    () => !draftsMatch(appliedDraft, draft, cat),
    [appliedDraft, draft, cat]
  );

  React.useEffect(() => {
    let active = true;

    async function loadListings() {
      try {
        setLoading(true);
        setError("");

        const data = await api.listings(listingQuery);
        let count = Array.isArray(data) ? data.length : 0;

        try {
          const countData = await api.listingCount(listingQuery);
          count = Number(countData?.total ?? count);
        } catch {
          // Count endpoint may be unavailable on older API builds.
        }

        if (active) {
          const list = Array.isArray(data) ? data.filter(Boolean) : [];
          setItems(sortListingsByMode(list, sort || "new"));
          setTotal(count);
          setPreviewTotal(count);
        }
      } catch (e) {
        if (active) {
          setError(e.message || "Не удалось загрузить объявления");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadListings();

    return () => {
      active = false;
    };
  }, [listingQuery, sort]);

  React.useEffect(() => {
    if (!draftIsDirty) {
      setPreviewTotal(total);
      return undefined;
    }

    let active = true;
    const timer = setTimeout(async () => {
      try {
        setPreviewLoading(true);
        const countData = await api.listingCount(
          buildListingQueryFromDraft(draft, cat)
        );

        if (active) {
          setPreviewTotal(Number(countData?.total || 0));
        }
      } catch {
        if (active) {
          setPreviewTotal(total);
        }
      } finally {
        if (active) {
          setPreviewLoading(false);
        }
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [draft, total, cat, draftIsDirty]);

  const activeCat = draft.cat || cat;
  const feedAd = useAdPlacement("listing_feed", activeCat);
  const feedRows = React.useMemo(
    () => buildFeedWithAds(items, feedAd, FEED_AD_INTERVAL),
    [items, feedAd]
  );
  const catConfig = cat ? CATS[cat] : null;
  const availableSubcategories = React.useMemo(() => {
    return activeCat ? CATS[activeCat]?.subs || [] : [];
  }, [activeCat]);

  const pageTitle = React.useMemo(() => {
    if (subcategory && catConfig) {
      return `${catConfig.title} · ${subcategory}`;
    }

    if (catConfig) {
      return catConfig.title;
    }

    if (search) {
      return `Поиск: ${search}`;
    }

    return "Объявления в Душанбе";
  }, [subcategory, catConfig, search]);

  const breadcrumbItems = React.useMemo(() => {
    const crumbs = [{ label: "Главная", to: "/" }];

    if (catConfig) {
      crumbs.push({ label: catConfig.title, to: `/c/${cat}` });
    }

    if (subcategory) {
      crumbs.push({ label: subcategory });
    } else if (!catConfig && search) {
      crumbs.push({ label: "Поиск" });
    } else if (!catConfig) {
      crumbs.push({ label: "Объявления" });
    }

    return crumbs;
  }, [catConfig, cat, subcategory, search]);

  usePageMeta({
    title: pageTitle,
    description: catConfig
      ? `Объявления в категории «${pageTitle}» на Oriyon.store.`
      : "Объявления на Oriyon.store — покупка и продажа в Таджикистане.",
    url: typeof window !== "undefined" ? window.location.href : undefined,
  });

  const applyFilters = React.useCallback(
    (nextDraft) => {
      const payload =
        nextDraft &&
        typeof nextDraft === "object" &&
        typeof nextDraft.search === "string"
          ? nextDraft
          : draft;

      setDraft(payload);
      setSearchParams(buildListingParams(payload, payload.cat || cat));
      setMobileFiltersOpen(false);
    },
    [draft, cat, setSearchParams]
  );

  const resetFilters = () => {
    setDraft({
      search: "",
      cat: cat || "",
      subcategory: "",
      priceFrom: "",
      priceTo: "",
      location: "",
      region: "",
      sort: "new",
      specs: {},
    });

    if (cat) {
      setSearchParams({ cat });
    } else {
      setSearchParams({});
    }

    setMobileFiltersOpen(false);
  };

  const hasActiveFilters =
    search ||
    subcategory ||
    priceFrom ||
    priceTo ||
    location ||
    region ||
    sort !== "new" ||
    Object.keys(activeSpecs).length > 0;

  const activeFilterCount =
    Number(Boolean(search)) +
    Number(Boolean(subcategory)) +
    Number(Boolean(priceFrom || priceTo)) +
    Number(Boolean(location || region)) +
    Number(sort !== "new") +
    Object.keys(activeSpecs).length;

  const showSubcategoryChips =
    Boolean(cat) && availableSubcategories.length > 0;

  const selectSubcategory = React.useCallback(
    (value) => {
      applyFilters({ ...appliedDraft, subcategory: value });
    },
    [appliedDraft, applyFilters]
  );

  const visibleListingIds = React.useMemo(
    () => items.map((ad) => ad._id || ad.id).filter(Boolean),
    [items]
  );

  return (
    <div className="container mx-auto px-4 py-6 space-y-5">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 px-1">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-sm text-sun-700 bg-sun-50 border border-sun-100 rounded-full px-3 py-1 mb-2">
              <SlidersHorizontal size={16} />
              {catConfig ? catConfig.title : "Каталог"}
            </div>

            <h1 className="text-2xl font-bold">{pageTitle}</h1>

            <p className="text-sm text-slate-500 mt-1">
              Найдено: {loading ? "…" : total.toLocaleString("ru-RU")}
            </p>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-slate-50"
            >
              <SlidersHorizontal size={18} />
              Фильтры
              {activeFilterCount > 0 && (
                <span className="min-w-[1.25rem] h-5 px-1 rounded-full bg-sun text-white text-xs grid place-items-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {showSubcategoryChips && (
          <div className="md:hidden sticky top-0 z-20 -mx-4 px-4 py-2 bg-mist/95 backdrop-blur border-b border-slate-200/80">
            <SubcategoryChips
              subcategories={availableSubcategories}
              activeSubcategory={subcategory}
              onSelect={selectSubcategory}
            />
          </div>
        )}

        <div className="hidden md:block">
          <ListingFiltersPanel
            draft={draft}
            setDraft={setDraft}
            activeCat={activeCat}
            availableSubcategories={availableSubcategories}
            showCategorySelect={!cat}
            onApply={applyFilters}
            onReset={resetFilters}
            previewTotal={draftIsDirty ? previewTotal : total}
            previewLoading={previewLoading}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        <div className="hidden md:block mt-4">
          <SavedSearchesPanel
            draft={draft}
            activeCat={activeCat}
            onApply={(filters) =>
              applyFilters({
                ...draft,
                ...filters,
                cat: filters.cat || activeCat || draft.cat,
              })
            }
          />
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="md:hidden fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Закрыть фильтры"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />

          <div className="absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col rounded-t-3xl bg-mist shadow-2xl">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 px-4 py-3">
              <h2 className="text-lg font-semibold">Фильтры</h2>

              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 rounded-xl border bg-white hover:bg-slate-50"
                aria-label="Закрыть"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <ListingFiltersPanel
                draft={draft}
                setDraft={setDraft}
                activeCat={activeCat}
                availableSubcategories={availableSubcategories}
                showCategorySelect={!cat}
                onApply={applyFilters}
                onReset={resetFilters}
                previewTotal={draftIsDirty ? previewTotal : total}
                previewLoading={previewLoading}
                hasActiveFilters={hasActiveFilters}
                hideSubcategoryField={showSubcategoryChips}
                compact
              />
            </div>
          </div>
        </div>
      )}

      {loading && <ListingGridSkeleton />}

      {!loading && error && (
        <EmptyState
          icon={PackageSearch}
          title="Не удалось загрузить объявления"
          description={error}
          actionLabel="Попробовать снова"
          onAction={() => window.location.reload()}
        />
      )}

      {!loading && !error && items.length === 0 && total === 0 && (
        <EmptyState
          icon={Search}
          title="По выбранным фильтрам ничего не найдено"
          description="Попробуйте изменить цену, категорию или характеристики."
          actionLabel="Сбросить фильтры"
          onAction={resetFilters}
        />
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <AdSlot
            placement="listing_top"
            cat={activeCat}
            className="overflow-hidden rounded-2xl"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {feedRows.map((row, idx) => {
            if (row.type === "ad") {
              return <AdFeedCard key={`ad-${idx}`} ad={row.item} />;
            }

            const ad = row.item;
            const id = ad._id || ad.id;
            const imgUrl = getListingThumb(ad);
            const more = Math.max(0, (ad.images?.length || 0) - 1);

            return (
              <div
                key={id}
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
                className={`group relative flex flex-col rounded-2xl border bg-white p-2 transition hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-sun/40 animate-fade-in-up ${getPromotionCardClass(
                  { vip: ad.vip, top: ad.top }
                )}`}
                style={{ animationDelay: `${idx * 40}ms` }}
                aria-label={`Объявление: ${ad.title || "Без названия"}`}
              >
                <span
                  className={getPromotionCardAccent({ vip: ad.vip, top: ad.top })}
                  aria-hidden="true"
                />
                <div className="relative">
                  <img
                    src={imgUrl}
                    alt={ad.title || "Фото"}
                    loading="lazy"
                    className="w-full h-40 object-cover rounded-xl bg-slate-100"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />

                  <ListingCardOverlays
                    listingId={id}
                    views={ad.views}
                    vip={ad.vip}
                    top={ad.top}
                    morePhotos={more}
                  />
                </div>

                <div className="mt-2 flex-1 flex flex-col gap-1">
                  <div className="font-semibold text-sm text-slate-900 line-clamp-2 group-hover:text-sun transition">
                    {ad.title || "Без названия"}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="text-price text-sm">
                      {formatPrice(ad.price)}
                    </div>

                    <FavoriteButton
                      id={id}
                      defaultActive={ad.isFavorite}
                      compact
                    />
                  </div>

                  <div className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1">
                    <MapPin size={13} />
                    {ad.location || ad.city || "Душанбе"}
                  </div>

                  <div className="text-xs text-slate-400">
                    {formatListingDate(ad)}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </>
      )}

      {cat && !loading && !error && (
        <SimilarListingsSection
          cat={cat}
          subcategory={subcategory}
          excludeIds={visibleListingIds}
        />
      )}
    </div>
  );
}
