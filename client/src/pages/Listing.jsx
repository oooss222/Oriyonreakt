import React from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import FavoriteButton from "../components/FavoriteButton";
import ListingGridSkeleton from "../components/ListingGridSkeleton";
import EmptyState from "../components/EmptyState";
import Breadcrumbs from "../components/Breadcrumbs";
import { usePageMeta } from "../lib/usePageMeta";
import { getListingThumb } from "../lib/media";
import { formatPrice } from "../lib/format";
import {
  CATS,
  CATEGORY_SELECT_OPTIONS,
  getListSpecFilters,
  parseSpecsParam,
} from "../data/listingCategories";
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  PackageSearch,
} from "lucide-react";

function buildListingParams(draft) {
  const next = {};
  const normalizedSearch = draft.search.trim();

  if (normalizedSearch) {
    next.search = normalizedSearch;
    next.q = normalizedSearch;
  }

  if (draft.cat) next.cat = draft.cat;
  if (draft.subcategory) next.subcategory = draft.subcategory;
  if (draft.priceFrom) next.priceFrom = draft.priceFrom;
  if (draft.priceTo) next.priceTo = draft.priceTo;
  if (draft.sort && draft.sort !== "new") next.sort = draft.sort;

  const specEntries = Object.entries(draft.specs || {}).filter(
    ([name, value]) => String(name).trim() && String(value).trim()
  );

  if (specEntries.length) {
    next.specs = JSON.stringify(Object.fromEntries(specEntries));
  }

  return next;
}

function SpecFilterGroup({ filters, values, onChange }) {
  if (!filters.length) return null;

  return (
    <div className="space-y-3">
      {filters.map((filter) => (
        <div key={filter.name}>
          <div className="text-xs font-medium text-slate-500 mb-2">
            {filter.name}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                onChange((current) => {
                  const next = { ...current };
                  delete next[filter.name];
                  return next;
                })
              }
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                !values[filter.name]
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              Все
            </button>

            {filter.options.map((option) => {
              const active = values[filter.name] === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    onChange((current) => ({
                      ...current,
                      [filter.name]: option,
                    }))
                  }
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    active
                      ? "bg-sun text-white border-sun"
                      : "bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ListingFiltersForm({
  draft,
  setDraft,
  activeCat,
  availableSubcategories,
  specFilters,
  showCategorySelect,
  showSuggestions,
  setShowSuggestions,
  suggestions,
  onApply,
  onReset,
  hasActiveFilters,
  idPrefix = "",
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-4 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            id={`${idPrefix}listing-search`}
            value={draft.search}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => {
              setDraft((v) => ({
                ...v,
                search: e.target.value,
              }));
              setShowSuggestions(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setShowSuggestions(false);
                onApply();
              }

              if (e.key === "Escape") {
                setShowSuggestions(false);
              }
            }}
            placeholder="Поиск по названию или описанию"
            className="h-11 w-full rounded-xl border pl-10 pr-3 outline-none focus:ring-2 focus:ring-sun/40"
          />

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-12 z-50 rounded-2xl border bg-white shadow-xl overflow-hidden">
              {suggestions.map((item, index) => (
                <button
                  key={`${item.type}-${item.label}-${index}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();

                    if (item.cat) {
                      setDraft((v) => ({
                        ...v,
                        cat: item.cat,
                        subcategory: "",
                        search: "",
                        specs: {},
                      }));
                    } else {
                      setDraft((v) => ({
                        ...v,
                        search: item.value,
                      }));
                    }

                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b last:border-b-0"
                >
                  <div className="text-sm font-medium text-slate-900">
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-500">{item.type}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {showCategorySelect && (
          <select
            value={draft.cat}
            onChange={(e) =>
              setDraft((v) => ({
                ...v,
                cat: e.target.value,
                subcategory: "",
                specs: {},
              }))
            }
            className="md:col-span-2 h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
          >
            {CATEGORY_SELECT_OPTIONS.map((item) => (
              <option key={item.value || "all"} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        )}

        {!activeCat && (
          <select
            value={draft.subcategory}
            onChange={(e) =>
              setDraft((v) => ({
                ...v,
                subcategory: e.target.value,
              }))
            }
            disabled={!draft.cat}
            className="md:col-span-2 h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40 disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">Все подкатегории</option>
            {availableSubcategories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        )}

        <input
          value={draft.priceFrom}
          onChange={(e) =>
            setDraft((v) => ({
              ...v,
              priceFrom: e.target.value.replace(/[^\d.,]/g, ""),
            }))
          }
          placeholder="Цена от"
          className="md:col-span-1 h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
        />

        <input
          value={draft.priceTo}
          onChange={(e) =>
            setDraft((v) => ({
              ...v,
              priceTo: e.target.value.replace(/[^\d.,]/g, ""),
            }))
          }
          placeholder="Цена до"
          className="md:col-span-1 h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
        />

        <select
          value={draft.sort}
          onChange={(e) =>
            setDraft((v) => ({
              ...v,
              sort: e.target.value,
            }))
          }
          className="md:col-span-2 h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
        >
          <option value="new">Сначала новые</option>
          <option value="price_asc">Цена по возрастанию</option>
          <option value="price_desc">Цена по убыванию</option>
        </select>
      </div>

      {activeCat && availableSubcategories.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-500">Подкатегория</div>
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() =>
                setDraft((v) => ({
                  ...v,
                  subcategory: "",
                }))
              }
              className={`shrink-0 px-4 py-2 rounded-full text-sm border transition ${
                !draft.subcategory
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700"
              }`}
            >
              Все
            </button>

            {availableSubcategories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() =>
                  setDraft((v) => ({
                    ...v,
                    subcategory: item,
                    specs: {},
                  }))
                }
                className={`shrink-0 px-4 py-2 rounded-full text-sm border transition ${
                  draft.subcategory === item
                    ? "bg-sun text-white border-sun"
                    : "bg-white text-slate-700"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      <SpecFilterGroup
        filters={specFilters}
        values={draft.specs}
        onChange={(updater) =>
          setDraft((v) => ({
            ...v,
            specs: typeof updater === "function" ? updater(v.specs) : updater,
          }))
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          type="button"
          onClick={onApply}
          className="inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-sun text-white hover:bg-sun-600 transition"
        >
          <Search size={18} />
          Применить фильтры
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-slate-50"
          >
            <X size={18} />
            Сбросить
          </button>
        )}
      </div>
    </div>
  );
}

export default function Listing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const nav = useNavigate();

  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  const cat = searchParams.get("cat") || "";
  const subcategory = searchParams.get("subcategory") || "";
  const search =
    searchParams.get("search") || searchParams.get("q") || "";
  const priceFrom = searchParams.get("priceFrom") || "";
  const priceTo = searchParams.get("priceTo") || "";
  const sort = searchParams.get("sort") || "new";
  const activeSpecs = React.useMemo(
    () => parseSpecsParam(searchParams.get("specs")),
    [searchParams]
  );

  const [draft, setDraft] = React.useState({
    search,
    cat,
    subcategory,
    priceFrom,
    priceTo,
    sort,
    specs: activeSpecs,
  });

  React.useEffect(() => {
    setDraft({
      search,
      cat,
      subcategory,
      priceFrom,
      priceTo,
      sort,
      specs: activeSpecs,
    });
  }, [search, cat, subcategory, priceFrom, priceTo, sort, activeSpecs]);

  React.useEffect(() => {
    if (!mobileFiltersOpen) return undefined;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileFiltersOpen]);

  const listingQuery = React.useMemo(() => {
    const params = {
      cat: cat || undefined,
      subcategory: subcategory || undefined,
      search: search || undefined,
      priceFrom: priceFrom || undefined,
      priceTo: priceTo || undefined,
      sort: sort || "new",
      limit: 100,
    };

    if (Object.keys(activeSpecs).length) {
      params.specs = JSON.stringify(activeSpecs);
    }

    return params;
  }, [cat, subcategory, search, priceFrom, priceTo, sort, activeSpecs]);

  React.useEffect(() => {
    let active = true;

    async function loadListings() {
      try {
        setLoading(true);
        setError("");

        const [data, countData] = await Promise.all([
          api.listings(listingQuery),
          api.listingCount(listingQuery),
        ]);

        if (active) {
          setItems(Array.isArray(data) ? data.filter(Boolean) : []);
          setTotal(Number(countData?.total || 0));
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
  }, [listingQuery]);

  const activeCat = draft.cat || cat;
  const catConfig = cat ? CATS[cat] : null;
  const availableSubcategories = React.useMemo(() => {
    return activeCat ? CATS[activeCat]?.subs || [] : [];
  }, [activeCat]);

  const specFilters = React.useMemo(() => {
    return getListSpecFilters(activeCat, draft.subcategory || subcategory);
  }, [activeCat, draft.subcategory, subcategory]);

  const suggestions = React.useMemo(() => {
    const q = draft.search.trim().toLowerCase();

    if (q.length < 2) return [];

    const fromListings = items
      .filter((item) =>
        String(item.title || "").toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((item) => ({
        type: "Объявление",
        label: item.title,
        value: item.title,
      }));

    const fromCategories = CATEGORY_SELECT_OPTIONS.filter(
      (item) => item.value && item.label.toLowerCase().includes(q)
    )
      .slice(0, 3)
      .map((item) => ({
        type: "Категория",
        label: item.label,
        value: item.label,
        cat: item.value,
      }));

    return [...fromListings, ...fromCategories].slice(0, 8);
  }, [draft.search, items]);

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
    const items = [{ label: "Главная", to: "/" }];

    if (catConfig) {
      items.push({ label: catConfig.title, to: `/c/${cat}` });
    }

    if (subcategory) {
      items.push({ label: subcategory });
    } else if (!catConfig && search) {
      items.push({ label: "Поиск" });
    } else if (!catConfig) {
      items.push({ label: "Объявления" });
    }

    return items;
  }, [catConfig, cat, subcategory, search]);

  usePageMeta({
    title: pageTitle,
    description: catConfig
      ? `Объявления в категории «${pageTitle}» на Oriyon.store.`
      : "Объявления на Oriyon.store — покупка и продажа в Таджикистане.",
    url: typeof window !== "undefined" ? window.location.href : undefined,
  });

  const applyFilters = () => {
    setSearchParams(buildListingParams(draft));
    setShowSuggestions(false);
    setMobileFiltersOpen(false);
  };

  const resetFilters = () => {
    setDraft({
      search: "",
      cat: "",
      subcategory: "",
      priceFrom: "",
      priceTo: "",
      sort: "new",
      specs: {},
    });
    setSearchParams({});
    setMobileFiltersOpen(false);
  };

  const hasActiveFilters =
    search ||
    cat ||
    subcategory ||
    priceFrom ||
    priceTo ||
    sort !== "new" ||
    Object.keys(activeSpecs).length > 0;

  const activeFilterCount =
    Number(Boolean(search)) +
    Number(Boolean(cat)) +
    Number(Boolean(subcategory)) +
    Number(Boolean(priceFrom)) +
    Number(Boolean(priceTo)) +
    Number(sort !== "new") +
    Object.keys(activeSpecs).length;

  return (
    <div className="container mx-auto px-4 py-6 space-y-5">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="rounded-3xl border bg-white p-4 md:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-sm text-sun-700 bg-sun-50 border border-sun-100 rounded-full px-3 py-1 mb-2">
              <SlidersHorizontal size={16} />
              {catConfig ? catConfig.title : "Каталог"}
            </div>

            <h1 className="text-2xl font-bold">{pageTitle}</h1>

            <p className="text-sm text-slate-500 mt-1">
              Найдено: {loading ? "…" : total}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="md:hidden inline-flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-slate-50"
            >
              <SlidersHorizontal size={18} />
              Фильтры
              {activeFilterCount > 0 && (
                <span className="min-w-[1.25rem] h-5 px-1 rounded-full bg-sun text-white text-xs grid place-items-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-slate-50"
              >
                <X size={18} />
                <span className="hidden sm:inline">Сбросить фильтры</span>
                <span className="sm:hidden">Сброс</span>
              </button>
            )}
          </div>
        </div>

        {cat && availableSubcategories.length > 0 && (
          <div className="md:hidden flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              to={`/listing?cat=${cat}`}
              className={`shrink-0 px-4 py-2 rounded-full text-sm border transition ${
                !subcategory
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700"
              }`}
            >
              Все
            </Link>

            {availableSubcategories.map((item) => (
              <Link
                key={item}
                to={`/listing?cat=${cat}&subcategory=${encodeURIComponent(item)}`}
                className={`shrink-0 px-4 py-2 rounded-full text-sm border transition ${
                  subcategory === item
                    ? "bg-sun text-white border-sun"
                    : "bg-white text-slate-700"
                }`}
              >
                {item}
              </Link>
            ))}
          </div>
        )}

        <div className="hidden md:block">
          <ListingFiltersForm
            draft={draft}
            setDraft={setDraft}
            activeCat={activeCat}
            availableSubcategories={availableSubcategories}
            specFilters={specFilters}
            showCategorySelect={!cat}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
            suggestions={suggestions}
            onApply={applyFilters}
            onReset={resetFilters}
            hasActiveFilters={hasActiveFilters}
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

          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold">Фильтры</h2>

              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 rounded-xl border hover:bg-slate-50"
                aria-label="Закрыть"
              >
                <X size={18} />
              </button>
            </div>

            <ListingFiltersForm
              draft={draft}
              setDraft={setDraft}
              activeCat={activeCat}
              availableSubcategories={availableSubcategories}
              specFilters={specFilters}
              showCategorySelect={!cat}
              showSuggestions={showSuggestions}
              setShowSuggestions={setShowSuggestions}
              suggestions={suggestions}
              onApply={applyFilters}
              onReset={resetFilters}
              hasActiveFilters={hasActiveFilters}
              idPrefix="mobile-"
            />
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

      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon={Search}
          title="По выбранным фильтрам ничего не найдено"
          description="Попробуйте изменить цену, категорию или характеристики."
          actionLabel="Сбросить фильтры"
          onAction={resetFilters}
        />
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((ad, idx) => {
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
                className="group relative flex flex-col rounded-2xl border bg-white p-2 transition hover:shadow-lg hover:-translate-y-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sun/40 animate-fade-in-up"
                style={{ animationDelay: `${idx * 40}ms` }}
                aria-label={`Объявление: ${ad.title || "Без названия"}`}
              >
                <div className="relative">
                  <img
                    src={imgUrl}
                    alt={ad.title || "Фото"}
                    loading="lazy"
                    className="w-full h-40 object-cover rounded-xl bg-slate-100"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />

                  {(ad.vip || ad.top) && (
                    <div className="absolute left-2 top-2 flex gap-2">
                      {ad.vip && (
                        <span className="px-2 py-0.5 text-[11px] rounded-full bg-amber-500 text-white shadow">
                          VIP
                        </span>
                      )}

                      {ad.top && (
                        <span className="px-2 py-0.5 text-[11px] rounded-full bg-lagoon text-white shadow">
                          TOP
                        </span>
                      )}
                    </div>
                  )}

                  {more > 0 && (
                    <span className="absolute right-2 bottom-2 text-[11px] bg-black/70 text-white rounded px-1">
                      +{more}
                    </span>
                  )}
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
                    {ad.createdAt && !Number.isNaN(Date.parse(ad.createdAt))
                      ? new Date(ad.createdAt).toLocaleDateString("ru-RU")
                      : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
