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
      <div className="rounded-2xl border border-lagoon/15 bg-lagoon/5 px-4 py-3 text-sm text-lagoon-700 flex items-start gap-2">
        <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
        <span>{assessment?.message || "Цена выглядит адекватно для указанных параметров."}</span>
      </div>
    );
  }

  const styles =
    assessment.level === "low"
      ? "border-sun/20 bg-sun-50 text-sun-700"
      : "border-sun/30 bg-sun-50 text-sun-800";

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
