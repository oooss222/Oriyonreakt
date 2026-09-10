import React from "react";
import { AlertTriangle, CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";
import { assessListingPrice } from "../lib/priceBenchmarks";
import { enrichRealEstateListing, getSpecValue } from "../lib/realEstate";
import { useI18n } from "../i18n";

const formatNumber = (value) => Number(value || 0).toLocaleString("ru-RU");

export default function PriceAdequacyBadge({ item, compact = false }) {
  const { t } = useI18n();
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
      <p className="flex items-start gap-2 rounded-2xl border border-lagoon-200 bg-lagoon-50 px-4 py-3 text-sm text-lagoon-700">
        <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          {assessment
            ? t("realestate.priceNearAverage", {
                benchmark: formatNumber(assessment.benchmark),
              })
            : t("realestate.priceLooksFair")}
        </span>
      </p>
    );
  }

  const low = assessment.level === "low";
  const Icon = low ? TrendingDown : TrendingUp;

  const message = low
    ? t("realestate.priceBelowMarket", {
        perSqm: formatNumber(assessment.perSqm),
        benchmark: formatNumber(assessment.benchmark),
      })
    : t("realestate.priceAboveMarket", {
        perSqm: formatNumber(assessment.perSqm),
        benchmark: formatNumber(assessment.benchmark),
        diff: `${assessment.diffPct > 0 ? "+" : ""}${assessment.diffPct}`,
      });

  return (
    <p
      className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${
        low
          ? "border-warning-200 bg-warning-50 text-warning-800"
          : "border-sun-200 bg-sun-50 text-sun-800"
      }`}
    >
      {compact ? (
        <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
      ) : (
        <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      )}
      <span>{message}</span>
    </p>
  );
}
