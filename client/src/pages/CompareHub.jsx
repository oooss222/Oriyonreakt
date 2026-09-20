import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Heart, Scale } from "lucide-react";
import EmptyState from "../components/EmptyState";
import ListingCompare from "./ListingCompare";
import { usePageMeta } from "../lib/usePageMeta";
import { decodeCompareShare } from "../lib/compareShare";
import {
  COMPARE_SUPPORTED_CATS,
  isCompareSupported,
  readCompareBucketCounts,
} from "../lib/compareListings";
import { getCompareConfig } from "../lib/compareConfig";
import { useI18n, getCategoryLabel } from "../i18n";

function pickCompareCat(requested, buckets) {
  const filled = buckets.filter((row) => row.count > 0).map((row) => row.cat);
  if (requested && isCompareSupported(requested)) {
    if (filled.includes(requested) || filled.length === 0) return requested;
  }
  return filled[0] || "realestate";
}

export default function CompareHub() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [buckets, setBuckets] = React.useState(() => readCompareBucketCounts());

  const shareToken = searchParams.get("share") || "";
  const shareCat = React.useMemo(
    () => (shareToken ? decodeCompareShare(shareToken)?.cat || "" : ""),
    [shareToken]
  );

  React.useEffect(() => {
    const sync = () => setBuckets(readCompareBucketCounts());
    sync();
    window.addEventListener("oriyon:compare-change", sync);
    return () => window.removeEventListener("oriyon:compare-change", sync);
  }, []);

  const requested = searchParams.get("cat") || shareCat || "";
  const selected = pickCompareCat(requested, buckets);
  const filled = buckets.filter((row) => row.count > 0);
  const showBoard = filled.length > 0 || Boolean(shareToken);

  usePageMeta({
    title: t("compare.metaTitleGeneric"),
    description: t("compare.metaDescGeneric"),
  });

  const selectCat = React.useCallback(
    (cat) => {
      const next = new URLSearchParams(searchParams);
      next.set("cat", cat);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  React.useEffect(() => {
    if (!filled.length) return;
    if (filled.some((row) => row.cat === selected)) return;
    selectCat(filled[0].cat);
  }, [filled, selected, selectCat]);

  const emptyCatalog =
    getCompareConfig(selected)?.catalogPath ||
    getCompareConfig("phones")?.catalogPath ||
    "/";

  return (
    <div className="compare-page compare-hub container-x py-5 sm:py-6 space-y-5">
      <header className="compare-hub__head">
        <h1>{t("compare.title")}</h1>
        <Link to="/profile?tab=fav" className="compare-hub__fav">
          <Heart size={16} />
          {t("compare.openFavorites")}
        </Link>
      </header>

      {filled.length > 0 && (
        <div className="compare-cats" role="tablist" aria-label={t("compare.title")}>
          {COMPARE_SUPPORTED_CATS.filter((cat) =>
            filled.some((row) => row.cat === cat)
          ).map((cat) => {
            const count = filled.find((row) => row.cat === cat)?.count || 0;
            const active = cat === selected;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={active}
                className={`compare-cat ${active ? "is-on" : ""}`}
                onClick={() => selectCat(cat)}
              >
                <span>{getCategoryLabel(cat, t)}</span>
                <span className="compare-cat__count">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {showBoard ? (
        <ListingCompare cat={selected} embed />
      ) : (
        <div className="compare-hub__empty py-6 sm:py-10">
          <EmptyState
            icon={Scale}
            title={t("compare.listEmpty")}
            description={t("compare.listEmptyHint")}
            actionLabel={t("compare.findListings")}
            actionTo={emptyCatalog}
          />
        </div>
      )}
    </div>
  );
}
