import React from "react";
import { AlertTriangle, CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";
import { assessListingPrice } from "../lib/priceBenchmarks";
import { enrichRealEstateListing, getSpecValue } from "../lib/realEstate";

export default function PriceAdequacyBadge({ item, compact = false }) {
  const listing = enrichRealEstateListing(item);
  const summary = listing.realEstateSummary || {};
  const specs = Array.isArray(item?.specs) ? item.specs : [];

  const assessment = assessListingPrice({
    price: item?.price,
    areaRaw: summary.area,
    city: item?.location || "Душанбе",
    district: summary.district || getSpecValue(specs, "Район"),
    dealType: summary.deal,
    rePricePerSqm: item?.rePricePerSqm,
  });

  if (!assessment || assessment.level === "ok") {
    if (compact) return null;

    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-start gap-2">
        <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
        <span>{assessment?.message || "Цена выглядит адекватно для указанных параметров."}</span>
      </div>
    );
  }

  const styles =
    assessment.level === "low"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-orange-200 bg-orange-50 text-orange-900";

  const Icon = assessment.level === "low" ? TrendingDown : TrendingUp;

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm flex items-start gap-2 ${styles}`}>
      {compact ? (
        <AlertTriangle size={15} className="shrink-0 mt-0.5" />
      ) : (
        <Icon size={16} className="shrink-0 mt-0.5" />
      )}
      <span>{assessment.message}</span>
    </div>
  );
}
