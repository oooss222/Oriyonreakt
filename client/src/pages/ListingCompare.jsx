import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Scale,
  Trash2,
  X,
  ExternalLink,
  RefreshCw,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";
import EmptyState from "../components/EmptyState";
import CompareExternalForm from "../components/CompareExternalForm";
import CompareSourceBadge from "../components/CompareSourceBadge";
import ComparePriceInsights from "../components/ComparePriceInsights";
import CompareVerdict from "../components/CompareVerdict";
import CompareShareBar from "../components/CompareShareBar";
import CompareGalleryRow from "../components/CompareGalleryRow";
import CompareSimilarPanel from "../components/CompareSimilarPanel";
import CompareMarketContext from "../components/CompareMarketContext";
import { api } from "../lib/api";
import { TOKEN_KEY } from "../lib/auth";
import {
  clearCompare,
  readCompareEntries,
  readCompareCount,
  removeCompareEntry,
  updateExternalCompareEntry,
  replaceCompareEntries,
  mergeCompareEntries,
  COMPARE_MAX,
} from "../lib/compareListings";
import { getCompareConfig } from "../lib/compareConfig";
import {
  resolveCompareEntries,
  getCompareItemKey,
  isExternalCompareItem,
} from "../lib/compareResolve";
import { buildComparePriceInsights } from "../lib/comparePriceInsights";
import {
  buildCompareVerdict,
  getDifferingFieldKeys,
  getRowDiffHighlights,
} from "../lib/compareDiff";
import { buildCompareTrustFields, isExternalStale } from "../lib/compareTrust";
import { decodeCompareShare } from "../lib/compareShare";
import { formatPrice } from "../lib/format";
import { getListingThumb } from "../lib/media";
import { usePageMeta } from "../lib/usePageMeta";
import { getPlatformLabel } from "../lib/comparePlatforms";
import { useI18n, getCategoryLabel } from "../i18n";

function formatFetchedAt(value = "", lang = "ru") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const locale = lang === "en" ? "en-US" : lang === "tg" ? "tg-TJ" : "ru-RU";
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function CompareThumb({ item, className = "h-28" }) {
  const src = getListingThumb(item);
  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-100 ${className}`}>
      <img
        src={src || "/img/placeholder.jpg"}
        alt={item?.title || ""}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = "/img/placeholder.jpg";
        }}
      />
    </div>
  );
}

function CompareRow({ label, values, highlights = [], diffMarks = [], emphasizeDiff }) {
  return (
    <tr className={`border-t ${emphasizeDiff ? "bg-amber-50/40" : ""}`}>
      <td
        className={`p-3 text-sm font-medium align-top ${
          emphasizeDiff ? "bg-amber-50 text-amber-900" : "bg-slate-50 text-slate-500"
        }`}
      >
        <div className="flex items-center gap-1.5">
          {label}
        </div>
      </td>
      {values.map((value, index) => {
        const hint = highlights[index];
        const differs = diffMarks[index]?.differs;
        return (
          <td
            key={index}
            className={`p-3 text-sm text-slate-900 align-top ${
              hint?.cheapest ? "bg-emerald-50 font-semibold text-emerald-900" : ""
            } ${differs && emphasizeDiff && !hint?.cheapest ? "font-semibold" : ""}`}
          >
            <div>{value || "—"}</div>
            {hint?.diffLabel && (
              <div
                className={`text-[11px] mt-1 ${
                  hint.cheapest ? "text-emerald-700" : "text-slate-500"
                }`}
              >
                {hint.diffLabel}
              </div>
            )}
          </td>
        );
      })}
    </tr>
  );
}

function CompareItemTitle({ item, onRemove, onRefresh, refreshing, t, lang, showThumb = false }) {
  const itemKey = getCompareItemKey(item);
  const external = isExternalCompareItem(item);
  const canRefresh = external && item._compareUrl;

  return (
    <div className="space-y-2">
      {showThumb && <CompareThumb item={item} className="h-24" />}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1.5">
          <CompareSourceBadge item={item} />
          {external && item._compareUrl ? (
            <a
              href={item._compareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block font-semibold hover:text-sun transition line-clamp-2"
            >
              {item.title}
            </a>
          ) : external ? (
            <div className="font-semibold line-clamp-2">{item.title}</div>
          ) : (
            <Link
              to={`/ad/${itemKey}`}
              className="block font-semibold hover:text-sun transition line-clamp-2"
            >
              {item.title}
            </Link>
          )}
          {external && item._compareFetchedAt && (
            <div className="text-[11px] text-slate-400">
              {t("compare.dataFrom", {
                date: formatFetchedAt(item._compareFetchedAt, lang),
              })}
            </div>
          )}
          {canRefresh && (
            <button
              type="button"
              onClick={() => onRefresh?.(item)}
              disabled={refreshing}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-sun hover:text-sun-600 disabled:opacity-50"
            >
              {refreshing ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
              {t("compare.refreshData")}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onRemove(itemKey)}
          className="shrink-0 rounded-lg border p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          aria-label={t("compare.removeFromCompare")}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function ComparePreviewCard({
  item,
  onRemove,
  onRefresh,
  refreshing,
  priceHint,
  isRecommended,
  t,
}) {
  const itemKey = getCompareItemKey(item);
  const external = isExternalCompareItem(item);

  return (
    <article
      className={`rounded-2xl border bg-white overflow-hidden space-y-0 ${
        priceHint?.cheapest || isRecommended
          ? "border-emerald-200 ring-1 ring-emerald-100"
          : "border-slate-200"
      }`}
    >
      <div className="relative">
        <CompareThumb item={item} className="h-36 rounded-none" />
        {isRecommended && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-sun px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            <CheckCircle2 size={10} />
            {t("compare.verdictBest")}
          </span>
        )}
        <button
          type="button"
          onClick={() => onRemove(itemKey)}
          className="absolute right-2 top-2 rounded-lg border bg-white/95 p-1 text-slate-400 hover:bg-white shadow-sm"
          aria-label={t("compare.removeFromCompare")}
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-3 space-y-2">
        <CompareSourceBadge item={item} />
        <div className="space-y-1">
          <div className="text-price text-base">{formatPrice(item.price)}</div>
          {priceHint?.diffLabel && (
            <div
              className={`text-[11px] font-semibold ${
                priceHint.cheapest ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              {priceHint.diffLabel}
            </div>
          )}
        </div>
        <div className="text-sm font-semibold text-slate-900 line-clamp-2">{item.title}</div>

        {external && item._compareUrl && (
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={item._compareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-sun hover:text-sun-600"
            >
              {t("compare.openOn", { platform: getPlatformLabel(item._compareSource) })}
              <ExternalLink size={12} />
            </a>
            <button
              type="button"
              onClick={() => onRefresh?.(item)}
              disabled={refreshing}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-50"
            >
              {refreshing ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
              {t("compare.refresh")}
            </button>
          </div>
        )}

        {!external && (
          <Link
            to={`/ad/${itemKey}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-sun hover:text-sun-600"
          >
            {t("compare.openListing")}
          </Link>
        )}
      </div>
    </article>
  );
}

function CompareMobileCard({
  item,
  fields,
  onRemove,
  onRefresh,
  refreshing,
  priceHint,
  isRecommended,
  differingKeys,
  diffsOnly,
  t,
  lang,
}) {
  const itemKey = getCompareItemKey(item);
  const visibleFields = diffsOnly
    ? fields.filter((field) => field.key === "price" || differingKeys.has(field.key))
    : fields;

  return (
    <article
      className={`rounded-2xl border bg-white overflow-hidden ${
        priceHint?.cheapest || isRecommended
          ? "border-emerald-200 ring-1 ring-emerald-100"
          : "border-slate-200"
      }`}
    >
      <div className="relative">
        <CompareThumb item={item} className="h-40 rounded-none" />
        {isRecommended && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-sun px-2 py-0.5 text-[10px] font-bold text-white">
            <CheckCircle2 size={10} />
            {t("compare.verdictBest")}
          </span>
        )}
      </div>
      <div className="p-4 space-y-3">
        <CompareItemTitle
          item={item}
          onRemove={onRemove}
          onRefresh={onRefresh}
          refreshing={refreshing}
          t={t}
          lang={lang}
        />
        <div className="space-y-1">
          <div className="text-price text-lg">{formatPrice(item.price)}</div>
          {priceHint?.diffLabel && (
            <div
              className={`text-[11px] font-semibold ${
                priceHint.cheapest ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              {priceHint.diffLabel}
            </div>
          )}
        </div>
        <dl className="space-y-2">
          {visibleFields
            .filter((field) => field.key !== "price")
            .map((field) => (
              <div
                key={field.key}
                className={`flex items-start justify-between gap-3 text-sm border-t border-slate-100 pt-2 ${
                  differingKeys.has(field.key) ? "bg-amber-50/50 -mx-2 px-2 rounded-lg" : ""
                }`}
              >
                <dt className="text-slate-500 shrink-0">{field.label}</dt>
                <dd className="font-medium text-slate-900 text-right">{field.get(item)}</dd>
              </div>
            ))}
        </dl>
      </div>
    </article>
  );
}

export default function ListingCompare({ cat }) {
  const { t, lang } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const config = getCompareConfig(cat);
  const categoryLabel = config ? getCategoryLabel(cat, t) : "";
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) || "" : "";

  const [entries, setEntries] = React.useState(() => readCompareEntries(cat));
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshingKey, setRefreshingKey] = React.useState("");
  const [refreshingAll, setRefreshingAll] = React.useState(false);
  const [actionError, setActionError] = React.useState("");
  const [diffsOnly, setDiffsOnly] = React.useState(true);
  const [shareNotice, setShareNotice] = React.useState("");
  const [syncState, setSyncState] = React.useState("idle");
  const shareHydrated = React.useRef(false);
  const skipNextSync = React.useRef(false);

  usePageMeta({
    title: config
      ? t("compare.metaTitle", { category: categoryLabel })
      : t("compare.metaTitleGeneric"),
    description: config
      ? t("compare.metaDesc", { category: categoryLabel, max: COMPARE_MAX })
      : t("compare.metaDescGeneric"),
  });

  const syncEntries = React.useCallback(() => {
    setEntries(readCompareEntries(cat));
  }, [cat]);

  React.useEffect(() => {
    syncEntries();
    window.addEventListener("oriyon:compare-change", syncEntries);
    return () => window.removeEventListener("oriyon:compare-change", syncEntries);
  }, [syncEntries]);

  // Hydrate from ?share=
  React.useEffect(() => {
    if (!config || shareHydrated.current) return undefined;
    const tokenShare = searchParams.get("share");
    if (!tokenShare) return undefined;

    shareHydrated.current = true;
    let alive = true;

    async function hydrate() {
      setLoading(true);
      setActionError("");
      const decoded = decodeCompareShare(tokenShare);
      if (!decoded || decoded.cat !== cat) {
        setActionError(t("compare.shareInvalid"));
        setLoading(false);
        return;
      }

      const next = [];
      for (const entry of decoded.entries) {
        if (entry.source === "oriyon") {
          next.push(entry);
          continue;
        }
        if (!entry.url) continue;
        try {
          const result = await api.compareImport({ url: entry.url, cat });
          const snapshot = result?.snapshot || {};
          next.push({
            source: "external",
            key: `share_${Date.now().toString(36)}_${next.length}`,
            cat,
            platform: result?.platform || entry.platform || "other",
            url: result?.url || entry.url,
            fetchedAt: new Date().toISOString(),
            snapshot: {
              title: snapshot.title || "",
              price: snapshot.price || "",
              location: snapshot.location || "",
              image: snapshot.image || "",
              specs: Array.isArray(snapshot.specs) ? snapshot.specs : [],
            },
          });
        } catch {
          /* skip broken external */
        }
      }

      if (!alive) return;
      skipNextSync.current = true;
      replaceCompareEntries(next, cat);
      syncEntries();
      setShareNotice(t("compare.shareLoaded", { count: next.length }));
      setSearchParams({}, { replace: true });
      setLoading(false);
    }

    hydrate();
    return () => {
      alive = false;
    };
  }, [cat, config, searchParams, setSearchParams, syncEntries, t]);

  // Account sync: pull on mount
  React.useEffect(() => {
    if (!token || !config) return undefined;
    let alive = true;

    setSyncState("loading");
    api
      .getCompareList(token, cat)
      .then((data) => {
        if (!alive) return;
        const serverEntries = Array.isArray(data?.entries) ? data.entries : [];
        if (serverEntries.length) {
          skipNextSync.current = true;
          mergeCompareEntries(serverEntries, cat);
          syncEntries();
        }
        setSyncState("saved");
      })
      .catch(() => {
        if (alive) setSyncState("idle");
      });

    return () => {
      alive = false;
    };
  }, [token, cat, config, syncEntries]);

  // Account sync: push on change
  React.useEffect(() => {
    if (!token || !config) return undefined;
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return undefined;
    }

    const timer = setTimeout(() => {
      setSyncState("saving");
      api
        .saveCompareList(token, cat, entries)
        .then(() => setSyncState("saved"))
        .catch(() => setSyncState("error"));
    }, 900);

    return () => clearTimeout(timer);
  }, [entries, token, cat, config]);

  React.useEffect(() => {
    let active = true;

    async function load() {
      if (!entries.length) {
        if (active) {
          setItems([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const rows = await resolveCompareEntries(entries, cat);
        if (active) setItems(rows);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [entries, cat]);

  const fields = config?.fields || [];
  const trustFields = React.useMemo(() => buildCompareTrustFields(t), [t]);
  const differingKeys = React.useMemo(
    () => getDifferingFieldKeys(items, fields),
    [items, fields]
  );
  const verdict = React.useMemo(
    () => (config ? buildCompareVerdict(items, fields, t) : null),
    [items, fields, t, config]
  );

  const handleManualSync = React.useCallback(() => {
    if (!token) return;
    setSyncState("saving");
    api
      .saveCompareList(token, cat, readCompareEntries(cat))
      .then(() => setSyncState("saved"))
      .catch(() => setSyncState("error"));
  }, [token, cat]);

  if (!config) {
    return (
      <div className="container mx-auto px-4 py-10">
        <EmptyState
          icon={Scale}
          title={t("compare.unavailable")}
          description={t("compare.unavailableHint")}
          actionLabel={t("empty.goHome")}
          actionTo="/"
        />
      </div>
    );
  }

  const count = readCompareCount(cat);
  const priceInsights = buildComparePriceInsights(items, t);
  const visibleFields = diffsOnly
    ? fields.filter((field) => field.key === "price" || differingKeys.has(field.key))
    : fields;
  const externalItems = items.filter((item) => isExternalCompareItem(item) && item._compareUrl);
  const staleCount = items.filter((item) => isExternalStale(item)).length;

  const breadcrumbs =
    cat === "realestate"
      ? [
          { label: t("nav.home"), to: "/" },
          { label: categoryLabel, to: "/realestate" },
          { label: t("compare.title") },
        ]
      : [
          { label: t("nav.home"), to: "/" },
          { label: categoryLabel, to: config.catalogPath },
          { label: t("compare.title") },
        ];

  const handleRemove = (itemKey) => {
    setActionError("");
    removeCompareEntry(itemKey, cat);
  };

  const handleRefresh = async (item) => {
    const itemKey = getCompareItemKey(item);
    if (!item._compareUrl) return;

    setRefreshingKey(itemKey);
    setActionError("");

    try {
      const result = await api.compareImport({
        url: item._compareUrl,
        cat,
      });
      const snapshot = result?.snapshot || {};
      updateExternalCompareEntry(itemKey, cat, {
        platform: result?.platform || item._compareSource,
        url: result?.url || item._compareUrl,
        title: snapshot.title,
        price: snapshot.price,
        location: snapshot.location,
        image: snapshot.image,
        specs: snapshot.specs,
      });
      syncEntries();
    } catch (err) {
      setActionError(err?.message || t("compare.refreshFailed"));
    } finally {
      setRefreshingKey("");
    }
  };

  const handleRefreshAll = async () => {
    if (!externalItems.length) return;
    setRefreshingAll(true);
    setActionError("");
    let failed = 0;

    for (const item of externalItems) {
      const itemKey = getCompareItemKey(item);
      if (!item._compareUrl) continue;
      setRefreshingKey(itemKey);
      try {
        const result = await api.compareImport({
          url: item._compareUrl,
          cat,
        });
        const snapshot = result?.snapshot || {};
        updateExternalCompareEntry(itemKey, cat, {
          platform: result?.platform || item._compareSource,
          url: result?.url || item._compareUrl,
          title: snapshot.title,
          price: snapshot.price,
          location: snapshot.location,
          image: snapshot.image,
          specs: snapshot.specs,
        });
      } catch {
        failed += 1;
      }
    }

    syncEntries();
    setRefreshingKey("");
    if (failed) setActionError(t("compare.refreshAllPartial"));
    setRefreshingAll(false);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-5">
      <Breadcrumbs items={breadcrumbs} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scale size={22} className="text-sun" />
            {t("compare.titleFull")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t("compare.subtitle", { category: categoryLabel, max: COMPARE_MAX })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {externalItems.length > 0 && (
            <button
              type="button"
              onClick={handleRefreshAll}
              disabled={refreshingAll || Boolean(refreshingKey)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              {refreshingAll ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              {t("compare.refreshAll")}
            </button>
          )}
          {count > 0 && (
            <button
              type="button"
              onClick={() => clearCompare(cat)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium hover:bg-slate-50"
            >
              <Trash2 size={16} />
              {t("compare.clear")}
            </button>
          )}
        </div>
      </div>

      <CompareExternalForm cat={cat} onAdded={syncEntries} />

      {shareNotice && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
          {shareNotice}
        </p>
      )}

      {staleCount > 0 && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          {t("compare.staleWarning", { count: staleCount })}
        </p>
      )}

      {actionError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {actionError}
        </p>
      )}

      {loading && count > 0 && (
        <div className="text-sm text-slate-500">{t("compare.loading")}</div>
      )}

      {!loading && items.length === 0 && (
        <EmptyState
          icon={Scale}
          title={t("compare.listEmpty")}
          description={t("compare.listEmptyHint")}
          actionLabel={t("compare.goCatalog")}
          actionTo={config.catalogPath}
        />
      )}

      {!loading && items.length > 0 && (
        <>
          <CompareShareBar
            cat={cat}
            entries={entries}
            canSync={Boolean(token)}
            syncState={syncState}
            onSync={handleManualSync}
          />

          <ComparePriceInsights insights={priceInsights} t={t} lang={lang} />
          <CompareVerdict verdict={verdict} catalogPath={config.catalogPath} t={t} />
          <CompareMarketContext cat={cat} items={items} />
          <CompareGalleryRow items={items} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={diffsOnly}
                onChange={(e) => setDiffsOnly(e.target.checked)}
                className="h-4 w-4 accent-sun"
              />
              {t("compare.diffsOnly")}
            </label>
            <Link
              to={config.catalogPath}
              className="text-sm font-semibold text-sun hover:text-sun-600"
            >
              {t("compare.findMoreOriyon")}
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {items.map((item, index) => (
              <ComparePreviewCard
                key={getCompareItemKey(item)}
                item={item}
                onRemove={handleRemove}
                onRefresh={handleRefresh}
                refreshing={refreshingKey === getCompareItemKey(item)}
                priceHint={priceInsights?.priceHighlights?.[index]}
                isRecommended={verdict?.key === getCompareItemKey(item)}
                t={t}
              />
            ))}
          </div>

          <div className="md:hidden space-y-3">
            {items.map((item, index) => (
              <CompareMobileCard
                key={getCompareItemKey(item)}
                item={item}
                fields={[...visibleFields, ...trustFields]}
                onRemove={handleRemove}
                onRefresh={handleRefresh}
                refreshing={refreshingKey === getCompareItemKey(item)}
                priceHint={priceInsights?.priceHighlights?.[index]}
                isRecommended={verdict?.key === getCompareItemKey(item)}
                differingKeys={differingKeys}
                diffsOnly={false}
                t={t}
                lang={lang}
              />
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-2xl border bg-white">
            <table className="min-w-full">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="p-3 text-left text-sm font-semibold text-slate-600">
                    {t("compare.parameter")}
                  </th>
                  {items.map((item) => (
                    <th
                      key={getCompareItemKey(item)}
                      className="p-3 text-left text-sm font-semibold align-top min-w-[200px]"
                    >
                      <CompareItemTitle
                        item={item}
                        onRemove={handleRemove}
                        onRefresh={handleRefresh}
                        refreshing={refreshingKey === getCompareItemKey(item)}
                        t={t}
                        lang={lang}
                        showThumb
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleFields.map((field) => (
                  <CompareRow
                    key={field.key}
                    label={field.label}
                    values={items.map((item) => field.get(item))}
                    highlights={
                      field.key === "price" ? priceInsights?.priceHighlights : []
                    }
                    diffMarks={getRowDiffHighlights(items, field)}
                    emphasizeDiff={differingKeys.has(field.key) && field.key !== "price"}
                  />
                ))}
                <tr>
                  <td
                    colSpan={items.length + 1}
                    className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50/80"
                  >
                    {t("compare.trustSection")}
                  </td>
                </tr>
                {trustFields.map((field) => (
                  <CompareRow
                    key={field.key}
                    label={field.label}
                    values={items.map((item) => field.get(item))}
                    emphasizeDiff={false}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {count < COMPARE_MAX && (
            <CompareSimilarPanel cat={cat} items={items} onAdded={syncEntries} />
          )}
        </>
      )}
    </div>
  );
}
