import { formatListingDate, formatViewCount } from "./format";
import { isExternalCompareItem } from "./compareResolve";

const STALE_MS = 24 * 60 * 60 * 1000;

export function isExternalStale(item) {
  if (!isExternalCompareItem(item) || !item._compareFetchedAt) return false;
  const ts = new Date(item._compareFetchedAt).getTime();
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts > STALE_MS;
}

export function getExternalAgeHours(item) {
  if (!item?._compareFetchedAt) return null;
  const ts = new Date(item._compareFetchedAt).getTime();
  if (Number.isNaN(ts)) return null;
  return Math.max(0, Math.round((Date.now() - ts) / 3600000));
}

export function buildCompareTrustFields(t) {
  return [
    {
      key: "trustSeller",
      label: t("compare.trustSeller"),
      get: (item) => {
        if (isExternalCompareItem(item)) return t("compare.trustExternal");
        if (item.ownerSellerType === "company") return t("compare.trustCompany");
        return t("compare.trustPrivate");
      },
    },
    {
      key: "trustVerified",
      label: t("compare.trustVerified"),
      get: (item) => {
        if (isExternalCompareItem(item)) return "—";
        return item.ownerBusinessVerified
          ? t("compare.trustVerifiedYes")
          : t("compare.trustVerifiedNo");
      },
    },
    {
      key: "trustViews",
      label: t("compare.trustViews"),
      get: (item) => {
        if (isExternalCompareItem(item)) return "—";
        return formatViewCount(item.views);
      },
    },
    {
      key: "trustPublished",
      label: t("compare.trustPublished"),
      get: (item) => {
        if (isExternalCompareItem(item)) {
          const hours = getExternalAgeHours(item);
          if (hours == null) return t("compare.trustStaleUnknown");
          if (isExternalStale(item)) {
            return t("compare.trustStale", { hours });
          }
          return t("compare.trustFresh", { hours });
        }
        return formatListingDate(item, { emptyLabel: "—" });
      },
    },
  ];
}
