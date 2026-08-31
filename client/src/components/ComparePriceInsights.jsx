import React from "react";
import { TrendingDown, TrendingUp, Scale } from "lucide-react";

const TONE_STYLES = {
  positive: "border-lagoon/20 bg-lagoon/5 text-lagoon-700",
  warning: "border-sun/20 bg-sun-50 text-sun-800",
  neutral: "border-ink/10 bg-mist/70 text-ink",
};

export default function ComparePriceInsights({ insights, t, lang = "ru" }) {
  if (!insights?.headline) return null;

  const tone = TONE_STYLES[insights.tone] || TONE_STYLES.neutral;
  const Icon =
    insights.tone === "warning"
      ? TrendingUp
      : insights.tone === "positive"
        ? TrendingDown
        : Scale;

  const locale = lang === "en" ? "en-US" : lang === "tg" ? "tg-TJ" : "ru-RU";

  return (
    <section className={`rounded-2xl border px-4 py-3.5 ${tone}`}>
      <div className="flex items-start gap-3">
        <Icon size={18} className="shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold">{insights.headline}</p>
          {insights.insights?.length > 1 && insights.minPrice !== insights.maxPrice && t && (
            <p className="text-xs opacity-80">
              {t("compare.priceRange", {
                min: insights.minPrice.toLocaleString(locale),
                max: insights.maxPrice.toLocaleString(locale),
                currency: t("price.currency"),
              })}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
