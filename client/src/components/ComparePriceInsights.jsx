import React from "react";
import { TrendingDown, TrendingUp, Scale } from "lucide-react";

const TONE_STYLES = {
  positive: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  neutral: "border-slate-200 bg-slate-50 text-slate-800",
};

export default function ComparePriceInsights({ insights }) {
  if (!insights?.headline) return null;

  const tone = TONE_STYLES[insights.tone] || TONE_STYLES.neutral;
  const Icon =
    insights.tone === "warning"
      ? TrendingUp
      : insights.tone === "positive"
        ? TrendingDown
        : Scale;

  return (
    <section className={`rounded-2xl border px-4 py-3.5 ${tone}`}>
      <div className="flex items-start gap-3">
        <Icon size={18} className="shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold">{insights.headline}</p>
          {insights.insights?.length > 1 && insights.minPrice !== insights.maxPrice && (
            <p className="text-xs opacity-80">
              Диапазон цен: {insights.minPrice.toLocaleString("ru-RU")} –{" "}
              {insights.maxPrice.toLocaleString("ru-RU")} с.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
