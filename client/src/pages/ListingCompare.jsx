import React from "react";
import { useSearchParams } from "react-router-dom";
import { Scale, RefreshCw, Loader2 } from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";
import EmptyState from "../components/EmptyState";
import CompareExternalForm from "../components/CompareExternalForm";
import ComparePriceInsights from "../components/ComparePriceInsights";
import CompareVerdict from "../components/CompareVerdict";
import CompareShareBar from "../components/CompareShareBar";
import CompareGalleryRow from "../components/CompareGalleryRow";
import CompareSimilarPanel from "../components/CompareSimilarPanel";
import CompareMarketContext from "../components/CompareMarketContext";
import CompareStage, { CompareStageSkeleton } from "../components/CompareStage";
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
import {
  resolveCompareEntries,
  getCompareItemKey,
  isExternalCompareItem,
} from "../lib/compareResolve";
import { buildComparePriceInsights } from "../lib/comparePriceInsights";
import { buildCompareVerdict, getDifferingFieldKeys } from "../lib/compareDiff";
import { buildCompareTrustFields, isExternalStale } from "../lib/compareTrust";
import { decodeCompareShare } from "../lib/compareShare";
import { usePageMeta } from "../lib/usePageMeta";
import { useI18n, getCategoryLabel } from "../i18n";

export default function ListingCompare({ cat, embed = false }) {
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
      setSearchParams(
        (prev) => {
          const nextParams = new URLSearchParams();
          const keepCat = prev.get("cat");
          if (keepCat) nextParams.set("cat", keepCat);
          return nextParams;
        },
        { replace: true }
      );
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

  const page = (
    <>
      {!embed && <Breadcrumbs items={breadcrumbs} />}

      {!embed && (
        <header className="compare-head">
          <div>
            <h1>{t("compare.title")}</h1>
            <p className="compare-head__lead">{t("compare.pageLead")}</p>
          </div>
          <div className="compare-head__aside">
            <span className="compare-head__count">
              {t("compare.countSelected", { count })}
            </span>
            {externalItems.length > 0 && (
              <button
                type="button"
                onClick={handleRefreshAll}
                disabled={refreshingAll || Boolean(refreshingKey)}
                className="btn btn-secondary"
              >
                {refreshingAll ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                {t("compare.refreshAll")}
              </button>
            )}
          </div>
        </header>
      )}

      {embed && externalItems.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={refreshingAll || Boolean(refreshingKey)}
            className="btn btn-secondary"
          >
            {refreshingAll ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {t("compare.refreshAll")}
          </button>
        </div>
      )}

      {!embed && <CompareExternalForm cat={cat} onAdded={syncEntries} />}

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
        <CompareStageSkeleton count={count} />
      )}

      {!loading && items.length === 0 && (
        <div className="py-8 sm:py-12">
          <EmptyState
            icon={Scale}
            title={t("compare.listEmpty")}
            description={t("compare.listEmptyHint")}
            actionLabel={t("compare.findListings")}
            actionTo={config.catalogPath}
          />
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          <CompareStage
            items={items}
            fieldGroups={fieldGroups}
            trustFields={trustFields}
            diffsOnly={diffsOnly}
            differingKeys={differingKeys}
            onToggleDiffs={() => setDiffsOnly((value) => !value)}
            onReset={() => clearCompare(cat)}
            onRemove={handleRemove}
            onRefresh={handleRefresh}
            refreshingKey={refreshingKey}
            catalogPath={config.catalogPath}
            t={t}
          />

          <div className="compare-extras">
            <CompareShareBar
              cat={cat}
              entries={entries}
              canSync={Boolean(token)}
              syncState={syncState}
              onSync={handleManualSync}
            />
            <CompareGalleryRow items={items} />
            <ComparePriceInsights insights={priceInsights} t={t} lang={lang} />
            <CompareMarketContext cat={cat} items={items} />
            <CompareVerdict verdict={verdict} catalogPath={config.catalogPath} t={t} />
          </div>

          {count < COMPARE_MAX && (
            <CompareSimilarPanel cat={cat} items={items} onAdded={syncEntries} />
          )}
        </>
      )}

      {embed && <CompareExternalForm cat={cat} onAdded={syncEntries} />}
    </>
  );

  if (embed) return <div className="space-y-4">{page}</div>;

  return (
    <div className="compare-page container-x py-5 sm:py-6 space-y-4">
      {page}
    </div>
  );
}
