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
import { getCompareConfig, localizeCompareFields, groupCompareFields } from "../lib/compareConfig";
import { getSpecValue } from "../lib/realEstate";
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
import { formatListingDate, formatPrice } from "../lib/format";
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
  const src = getListingThumb(item, { width: 400 });
  return (
    <div className={`relative overflow-hidden rounded-xl bg-mist ${className}`}>
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

function listingSeller(item) {
  return item?.ownerName || item?.sellerName || item?.userName || "";
}

function listingCondition(item) {
  return getSpecValue(item?.specs, "Состояние") || getSpecValue(item?.specs, "Ремонт") || "";
}

function CompareGroupRow({ label, colSpan }) {
  return (
    <tr>
      <th className="compare-sticky px-3 pt-4 pb-1 text-left text-[11px] font-bold uppercase tracking-wide text-ink-300 bg-mist/80">
        {label}
      </th>
      <td colSpan={Math.max(1, colSpan - 1)} className="bg-mist/80" />
    </tr>
  );
}

function CompareRow({ label, values, highlights = [], diffMarks = [], emphasizeDiff, sameMuted }) {
  return (
    <tr className={`border-t border-ink/8 ${emphasizeDiff ? "bg-sun-50/40" : ""}`}>
      <th
        className={`compare-sticky p-3 text-sm font-medium align-top text-left ${
          emphasizeDiff ? "bg-sun-50 text-sun-800" : "bg-mist/80 text-ink-400"
        }`}
      >
        {label}
      </th>
      {values.map((value, index) => {
        const hint = highlights[index];
        const differs = diffMarks[index]?.differs;
        const muted = sameMuted && !differs && !hint?.cheapest;
        return (
          <td
            key={index}
            className={`compare-item p-3 text-sm align-top break-words ${
              hint?.cheapest ? "bg-lagoon/5 font-semibold text-lagoon-700" : muted ? "text-ink-300" : "text-ink"
            } ${differs && emphasizeDiff && !hint?.cheapest ? "font-semibold" : ""}`}
          >
            <div>{value || "—"}</div>
            {hint?.diffLabel && (
              <div
                className={`text-[11px] mt-1 ${
                  hint.cheapest ? "text-lagoon-700" : "text-ink-400"
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
            <div className="text-[11px] text-ink-300">
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
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink/10 text-ink-300 hover:bg-mist/70 hover:text-ink-500"
          aria-label={t("compare.removeFromCompare")}
          title={t("compare.removeFromCompare")}
        >
          <X size={16} />
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
          ? "border-lagoon/20 ring-1 ring-lagoon/15"
          : "border-ink/10"
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
          className="absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-white/95 text-ink-300 hover:bg-white shadow-sm"
          aria-label={t("compare.removeFromCompare")}
          title={t("compare.removeFromCompare")}
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-3 space-y-2">
        <CompareSourceBadge item={item} />
        <div className="space-y-1">
          <div className="text-price text-base">{formatPrice(item.price)}</div>
          {priceHint?.diffLabel && (
            <div
              className={`text-[11px] font-semibold ${
                priceHint.cheapest ? "text-lagoon-700" : "text-ink-400"
              }`}
            >
              {priceHint.diffLabel}
            </div>
          )}
        </div>
        <div className="text-sm font-semibold text-ink line-clamp-2 break-words">{item.title}</div>
        <div className="space-y-0.5 text-xs text-ink-400">
          <div className="truncate">
            {[item.location, item.realEstateSummary?.district].filter(Boolean).join(" · ") || "—"}
          </div>
          <div>{formatListingDate(item, { emptyLabel: "—" })}</div>
          {listingCondition(item) ? <div>{listingCondition(item)}</div> : null}
          {listingSeller(item) ? <div className="truncate">{listingSeller(item)}</div> : null}
        </div>

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
              className="inline-flex items-center gap-1 text-xs font-semibold text-ink-400 hover:text-ink-600 disabled:opacity-50"
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
            className="inline-flex h-11 items-center justify-center rounded-xl border border-ink/10 px-3 text-sm font-semibold text-sun hover:bg-mist/60 hover:text-sun-600"
          >
            {t("compare.openListing")}
          </Link>
        )}
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
  const [diffsOnly, setDiffsOnly] = React.useState(false);
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
          const result = await api.compareImport({ url: entry.url, cat }, token);
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

  const fields = React.useMemo(
    () => localizeCompareFields(config?.fields || [], t),
    [config, t]
  );
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
      <div className="container-x py-10">
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
  const fieldGroups = groupCompareFields(visibleFields);
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
      }, token);
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
        }, token);
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
    <div className="container-x overflow-x-hidden py-6 space-y-4">
      <Breadcrumbs items={breadcrumbs} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
            <Scale size={22} className="text-sun" />
            {t("compare.title")}
          </h1>
          <p className="text-sm text-ink-400 mt-1">
            {t("compare.countSelected", { count })}
            {categoryLabel ? ` · ${categoryLabel}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={config.catalogPath}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-ink/10 px-4 text-sm font-medium hover:bg-mist/70"
          >
            {t("compare.backToListings")}
          </Link>
          {externalItems.length > 0 && (
            <button
              type="button"
              onClick={handleRefreshAll}
              disabled={refreshingAll || Boolean(refreshingKey)}
              className="inline-flex h-11 items-center gap-2 px-4 rounded-xl border text-sm font-medium hover:bg-mist/70 disabled:opacity-50"
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
              className="inline-flex h-11 items-center gap-2 px-4 rounded-xl border text-sm font-medium hover:bg-mist/70"
            >
              <Trash2 size={16} />
              {t("compare.clearAll")}
            </button>
          )}
        </div>
      </div>

      <CompareExternalForm cat={cat} onAdded={syncEntries} />

      {shareNotice && (
        <p className="text-sm text-lagoon-700 bg-lagoon/5 border border-lagoon/15 rounded-xl px-3 py-2">
          {shareNotice}
        </p>
      )}

      {staleCount > 0 && (
        <p className="text-sm text-sun-700 bg-sun-50 border border-sun/15 rounded-xl px-3 py-2">
          {t("compare.staleWarning", { count: staleCount })}
        </p>
      )}

      {actionError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {actionError}
        </p>
      )}

      {loading && count > 0 && (
        <div className="text-sm text-ink-400">{t("compare.loading")}</div>
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

          <CompareVerdict verdict={verdict} catalogPath={config.catalogPath} t={t} />
          <ComparePriceInsights insights={priceInsights} t={t} lang={lang} />
          <CompareMarketContext cat={cat} items={items} />
          <CompareGalleryRow items={items} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={diffsOnly}
              onClick={() => setDiffsOnly((value) => !value)}
              className={`inline-flex h-11 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition active:scale-[0.98] ${
                diffsOnly
                  ? "border-sun/30 bg-sun/10 text-sun-700"
                  : "border-ink/10 bg-white text-ink-600 hover:bg-mist/70"
              }`}
            >
              <span
                className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 transition ${
                  diffsOnly ? "bg-sun" : "bg-ink/15"
                }`}
                aria-hidden
              >
                <span
                  className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${
                    diffsOnly ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </span>
              {t("compare.diffsOnly")}
            </button>
            <Link
              to={config.catalogPath}
              className="inline-flex h-11 items-center text-sm font-semibold text-sun hover:text-sun-600"
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

          <div className="compare-table-wrap rounded-2xl border border-ink/8 bg-white shadow-soft">
            <table className="compare-table w-full">
              <thead>
                <tr className="border-b bg-mist/70">
                  <th className="compare-sticky p-3 text-left text-sm font-semibold text-ink-500 bg-mist/90">
                    {t("compare.parameter")}
                  </th>
                  {items.map((item) => (
                    <th
                      key={getCompareItemKey(item)}
                      className="compare-item p-3 text-left text-sm font-semibold align-top"
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
                {fieldGroups.basics.length > 0 && (
                  <CompareGroupRow
                    label={t("compare.groupBasics")}
                    colSpan={items.length + 1}
                  />
                )}
                {fieldGroups.basics.map((field) => (
                  <CompareRow
                    key={field.key}
                    label={field.label}
                    values={items.map((item) => field.get(item))}
                    highlights={
                      field.key === "price" ? priceInsights?.priceHighlights : []
                    }
                    diffMarks={getRowDiffHighlights(items, field)}
                    emphasizeDiff={differingKeys.has(field.key) && field.key !== "price"}
                    sameMuted={!diffsOnly && items.length > 1 && !differingKeys.has(field.key)}
                  />
                ))}
                {fieldGroups.specs.length > 0 && (
                  <CompareGroupRow
                    label={t("compare.groupSpecs")}
                    colSpan={items.length + 1}
                  />
                )}
                {fieldGroups.specs.map((field) => (
                  <CompareRow
                    key={field.key}
                    label={field.label}
                    values={items.map((item) => field.get(item))}
                    highlights={
                      field.key === "price" ? priceInsights?.priceHighlights : []
                    }
                    diffMarks={getRowDiffHighlights(items, field)}
                    emphasizeDiff={differingKeys.has(field.key)}
                    sameMuted={!diffsOnly && items.length > 1 && !differingKeys.has(field.key)}
                  />
                ))}
                <CompareGroupRow
                  label={t("compare.trustSection")}
                  colSpan={items.length + 1}
                />
                {trustFields.map((field) => (
                  <CompareRow
                    key={field.key}
                    label={field.label}
                    values={items.map((item) => field.get(item))}
                    emphasizeDiff={false}
                    sameMuted={items.length > 1}
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
