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
import CompareExternalForm from "../components/CompareExternalForm";
import CompareSourceBadge from "../components/CompareSourceBadge";
import ComparePriceInsights from "../components/ComparePriceInsights";
import CompareVerdict from "../components/CompareVerdict";
import CompareShareBar from "../components/CompareShareBar";
import CompareGalleryRow from "../components/CompareGalleryRow";
import CompareSimilarPanel from "../components/CompareSimilarPanel";
import CompareMarketContext from "../components/CompareMarketContext";
import {
  Alert,
  Button,
  Checkbox,
  EmptyState,
  ListingCardSkeleton,
  cn,
  useToast,
} from "../ui";
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
  const src = getListingThumb(item, { width: 400 });
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-mist-200", className)}>
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

function CompareRow({ label, values, highlights = [], diffMarks = [], emphasizeDiff, t }) {
  return (
    <tr className={cn(emphasizeDiff && "bg-sun-50/40")}>
      <th
        scope="row"
        className={cn(
          "sticky left-0 z-10 w-[9.5rem] min-w-[9.5rem] p-3",
          "border-r border-t border-ink-200 text-left align-top text-xs font-semibold",
          emphasizeDiff ? "bg-sun-50 text-sun-800" : "bg-mist-50 text-ink-500"
        )}
      >
        <span className="flex items-start gap-1.5">
          {emphasizeDiff && (
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sun-500"
              aria-hidden="true"
            />
          )}
          <span>
            {label}
            {emphasizeDiff && <span className="sr-only"> — {t("compare.legendDiff")}</span>}
          </span>
        </span>
      </th>

      {values.map((value, index) => {
        const hint = highlights[index];
        const differs = diffMarks[index]?.differs;

        return (
          <td
            key={index}
            className={cn(
              "min-w-[11rem] border-t border-ink-200 p-3 align-top text-sm text-ink-800",
              hint?.cheapest && "font-semibold text-lagoon-700",
              differs && emphasizeDiff && !hint?.cheapest && "font-semibold text-ink-900"
            )}
          >
            <div className="break-anywhere">{value || "—"}</div>
            {hint?.diffLabel && (
              <div
                className={cn(
                  "mt-1 text-2xs font-medium",
                  hint.cheapest ? "text-lagoon-700" : "text-ink-400"
                )}
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
              className="block font-semibold text-ink-900 transition-colors hover:text-sun-700 line-clamp-2"
            >
              {item.title}
            </a>
          ) : external ? (
            <div className="font-semibold text-ink-900 line-clamp-2">{item.title}</div>
          ) : (
            <Link
              to={`/ad/${itemKey}`}
              className="block font-semibold text-ink-900 transition-colors hover:text-sun-700 line-clamp-2"
            >
              {item.title}
            </Link>
          )}

          {external && item._compareFetchedAt && (
            <div className="text-2xs font-medium text-ink-400">
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
              className="inline-flex min-h-[2rem] items-center gap-1 text-2xs font-semibold text-sun-700 hover:text-sun-800 disabled:opacity-50"
            >
              {refreshing ? (
                <Loader2 size={12} className="animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw size={12} aria-hidden="true" />
              )}
              {t("compare.refreshData")}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onRemove(itemKey)}
          className="btn btn-ghost btn-icon-sm shrink-0 text-ink-400"
          aria-label={t("compare.removeFromCompare")}
          title={t("compare.removeFromCompare")}
        >
          <X size={15} aria-hidden="true" />
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
      className={cn(
        "card overflow-hidden",
        (priceHint?.cheapest || isRecommended) && "border-lagoon-200 ring-1 ring-lagoon-100"
      )}
    >
      <div className="relative">
        <CompareThumb item={item} className="h-36 rounded-none" />

        {isRecommended && (
          <span className="badge absolute left-2 top-2 border-transparent bg-sun-500 text-white">
            <CheckCircle2 size={11} aria-hidden="true" />
            {t("compare.verdictBest")}
          </span>
        )}

        <button
          type="button"
          onClick={() => onRemove(itemKey)}
          className="btn btn-icon-sm absolute right-2 top-2 bg-white/95 text-ink-500 shadow-xs"
          aria-label={t("compare.removeFromCompare")}
          title={t("compare.removeFromCompare")}
        >
          <X size={15} aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-2 p-3">
        <CompareSourceBadge item={item} />

        <div className="space-y-1">
          <div className="text-price text-base">{formatPrice(item.price)}</div>
          {priceHint?.diffLabel && (
            <div
              className={cn(
                "text-2xs font-semibold",
                priceHint.cheapest ? "text-lagoon-700" : "text-ink-400"
              )}
            >
              {priceHint.diffLabel}
            </div>
          )}
        </div>

        <div className="text-sm font-semibold text-ink-800 line-clamp-2">{item.title}</div>

        {external && item._compareUrl && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <a
              href={item._compareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[2rem] items-center gap-1 text-xs font-semibold text-sun-700 hover:text-sun-800"
            >
              {t("compare.openOn", { platform: getPlatformLabel(item._compareSource) })}
              <ExternalLink size={12} aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={() => onRefresh?.(item)}
              disabled={refreshing}
              className="inline-flex min-h-[2rem] items-center gap-1 text-xs font-semibold text-ink-500 hover:text-ink-800 disabled:opacity-50"
            >
              {refreshing ? (
                <Loader2 size={12} className="animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw size={12} aria-hidden="true" />
              )}
              {t("compare.refresh")}
            </button>
          </div>
        )}

        {!external && (
          <Link
            to={`/ad/${itemKey}`}
            className="inline-flex min-h-[2rem] items-center gap-1 text-xs font-semibold text-sun-700 hover:text-sun-800"
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
  const visibleFields = diffsOnly
    ? fields.filter((field) => field.key === "price" || differingKeys.has(field.key))
    : fields;

  return (
    <article
      className={cn(
        "card overflow-hidden",
        (priceHint?.cheapest || isRecommended) && "border-lagoon-200 ring-1 ring-lagoon-100"
      )}
    >
      <div className="relative">
        <CompareThumb item={item} className="h-40 rounded-none" />
        {isRecommended && (
          <span className="badge absolute left-2 top-2 border-transparent bg-sun-500 text-white">
            <CheckCircle2 size={11} aria-hidden="true" />
            {t("compare.verdictBest")}
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
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
              className={cn(
                "text-2xs font-semibold",
                priceHint.cheapest ? "text-lagoon-700" : "text-ink-400"
              )}
            >
              {priceHint.diffLabel}
            </div>
          )}
        </div>

        <dl className="divide-y divide-ink-200 border-t border-ink-200">
          {visibleFields
            .filter((field) => field.key !== "price")
            .map((field) => {
              const differs = differingKeys.has(field.key);

              return (
                <div
                  key={field.key}
                  className={cn(
                    "flex items-start justify-between gap-3 py-2 text-sm",
                    differs && "-mx-2 rounded-lg bg-sun-50/60 px-2"
                  )}
                >
                  <dt className="shrink-0 text-ink-500">
                    {field.label}
                    {differs && <span className="sr-only"> — {t("compare.legendDiff")}</span>}
                  </dt>
                  <dd
                    className={cn(
                      "break-anywhere text-right font-medium",
                      differs ? "text-ink-900" : "text-ink-700"
                    )}
                  >
                    {field.get(item)}
                  </dd>
                </div>
              );
            })}
        </dl>
      </div>
    </article>
  );
}

export default function ListingCompare({ cat }) {
  const { t, lang } = useI18n();
  const { showToast } = useToast();
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
      <div className="page-container stack-page">
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

  const handleClear = () => {
    clearCompare(cat);
    showToast(t("compare.cleared"), "info");
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
    <div className="page-container stack-page">
      <Breadcrumbs items={breadcrumbs} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="section-title flex items-center gap-2">
            <Scale size={22} className="shrink-0 text-sun-500" aria-hidden="true" />
            {t("compare.titleFull")}
          </h1>
          <p className="section-subtitle mt-1">
            {t("compare.subtitle", { category: categoryLabel, max: COMPARE_MAX })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {externalItems.length > 0 && (
            <Button
              icon={RefreshCw}
              loading={refreshingAll}
              disabled={Boolean(refreshingKey)}
              onClick={handleRefreshAll}
            >
              {t("compare.refreshAll")}
            </Button>
          )}

          {count > 0 && (
            <Button icon={Trash2} onClick={handleClear}>
              {t("compare.clear")}
            </Button>
          )}
        </div>
      </div>

      <CompareExternalForm cat={cat} onAdded={syncEntries} />

      {shareNotice && <Alert tone="success">{shareNotice}</Alert>}

      {staleCount > 0 && (
        <Alert tone="warning">{t("compare.staleWarning", { count: staleCount })}</Alert>
      )}

      {actionError && <Alert tone="danger">{actionError}</Alert>}

      {loading && count > 0 && (
        <div className="grid-items" aria-busy="true" aria-label={t("compare.loading")}>
          {Array.from({ length: Math.min(count, COMPARE_MAX) }).map((_, index) => (
            <ListingCardSkeleton key={index} />
          ))}
        </div>
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
            <Checkbox
              label={t("compare.diffsOnly")}
              checked={diffsOnly}
              onChange={(e) => setDiffsOnly(e.target.checked)}
              labelClassName="font-medium"
            />
            <Link
              to={config.catalogPath}
              className="text-sm font-semibold text-sun-700 hover:text-sun-800"
            >
              {t("compare.findMoreOriyon")}
            </Link>
          </div>

          <div className="hidden gap-3 md:grid md:grid-cols-2 lg:grid-cols-4">
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

          <div className="space-y-3 md:hidden">
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

          <div className="surface-panel hidden overflow-hidden md:block">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-ink-200 px-4 py-2.5">
              <p className="text-xs text-ink-400">{t("compare.scrollHint")}</p>
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500">
                <span className="h-2 w-2 rounded-full bg-sun-500" aria-hidden="true" />
                {t("compare.legendDiff")}
              </p>
            </div>

            <div
              role="region"
              tabIndex={0}
              aria-label={t("compare.tableLabel")}
              className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sun/50"
            >
              <table className="min-w-full border-separate border-spacing-0">
                <caption className="sr-only">{t("compare.tableLabel")}</caption>
                <thead>
                  <tr className="bg-mist-50">
                    <th
                      scope="col"
                      className="sticky left-0 z-20 w-[9.5rem] min-w-[9.5rem] border-r border-ink-200
                                 bg-mist-50 p-3 text-left text-xs font-semibold text-ink-500"
                    >
                      {t("compare.parameter")}
                    </th>

                    {items.map((item) => (
                      <th
                        key={getCompareItemKey(item)}
                        scope="col"
                        className="min-w-[13rem] bg-mist-50 p-3 text-left align-top text-sm font-semibold"
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
                      t={t}
                    />
                  ))}

                  <tr>
                    <th
                      scope="colgroup"
                      colSpan={items.length + 1}
                      className="border-t border-ink-200 bg-mist-100 px-3 py-2 text-left text-2xs font-bold uppercase tracking-wide text-ink-500"
                    >
                      {t("compare.trustSection")}
                    </th>
                  </tr>

                  {trustFields.map((field) => (
                    <CompareRow
                      key={field.key}
                      label={field.label}
                      values={items.map((item) => field.get(item))}
                      emphasizeDiff={false}
                      t={t}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {count < COMPARE_MAX && (
            <CompareSimilarPanel cat={cat} items={items} onAdded={syncEntries} />
          )}
        </>
      )}
    </div>
  );
}
