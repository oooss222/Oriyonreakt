import React from "react";
import { TrendingDown, TrendingUp, Minus, BarChart3 } from "lucide-react";
import { api } from "../lib/api";
import { parsePriceNumber, formatPrice } from "../lib/format";
import { isExternalCompareItem } from "../lib/compareResolve";
import { useI18n } from "../i18n";

function pickLocation(items = []) {
  const counts = new Map();
  for (const item of items) {
    const loc = String(item.location || item.city || "").trim();
    if (!loc) continue;
    counts.set(loc, (counts.get(loc) || 0) + 1);
  }
  let best = "";
  let bestCount = 0;
  for (const [loc, count] of counts) {
    if (count > bestCount) {
      best = loc;
      bestCount = count;
    }
  }
  return best;
}

function pickSubcategory(items = []) {
  const values = items
    .map((item) => String(item.subcategory || "").trim())
    .filter(Boolean);
  if (!values.length) return "";
  const first = values[0];
  return values.every((v) => v === first) ? first : "";
}

export default function CompareMarketContext({ cat, items = [] }) {
  const { t } = useI18n();
  const [stats, setStats] = React.useState(null);

  const location = React.useMemo(() => pickLocation(items), [items]);
  const subcategory = React.useMemo(() => pickSubcategory(items), [items]);

  React.useEffect(() => {
    if (!cat || items.length < 1) {
      setStats(null);
      return undefined;
    }

    let alive = true;
    api
      .listingMarketStats({ cat, location, subcategory })
      .then((data) => {
        if (alive) setStats(data);
      })
      .catch(() => {
        if (alive) setStats(null);
      });

    return () => {
      alive = false;
    };
  }, [cat, location, subcategory, items.length]);

  if (!stats?.medianPrice || !stats.sample) return null;

  const median = stats.medianPrice;
  const medianPpsqm = stats.medianPricePerSqm;

  const rows = items.map((item) => {
    const price = parsePriceNumber(item.price);
    const ppsqm = parsePriceNumber(item?.realEstateSummary?.pricePerSqm);
    const vsMedian =
      price != null && median
        ? Math.round(((price - median) / median) * 100)
        : null;
    const vsPpsqm =
      ppsqm != null && medianPpsqm
        ? Math.round(((ppsqm - medianPpsqm) / medianPpsqm) * 100)
        : null;

    return {
      title: item.title,
      external: isExternalCompareItem(item),
      price,
      ppsqm,
      vsMedian,
      vsPpsqm,
    };
  });

  return (
    <section className="rounded-2xl border border-ink/8 bg-white p-4 md:p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-mist grid place-items-center shrink-0">
          <BarChart3 size={18} className="text-ink-500" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-ink tracking-tight">{t("compare.marketTitle")}</h3>
          <p className="text-sm text-ink-400 mt-0.5">
            {t("compare.marketHint", {
              median: formatPrice(median, { emptyLabel: "—" }),
              sample: stats.sample,
              place: location || t("compare.marketAllLocations"),
            })}
          </p>
          {medianPpsqm != null && (
            <p className="text-xs text-ink-300 mt-1">
              {t("compare.marketPpsqm", {
                value: formatPrice(medianPpsqm, { emptyLabel: "—" }),
              })}
            </p>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {rows.map((row) => {
          const delta = row.vsPpsqm ?? row.vsMedian;
          const Icon =
            delta == null ? Minus : delta < 0 ? TrendingDown : delta > 0 ? TrendingUp : Minus;
          const tone =
            delta == null
              ? "text-ink-400 bg-mist/70 border-ink/8"
              : delta < 0
                ? "text-lagoon-700 bg-lagoon/5 border-lagoon/15"
                : delta > 0
                  ? "text-sun-700 bg-sun-50 border-sun/15"
                  : "text-ink-500 bg-mist/70 border-ink/8";

          return (
            <div
              key={row.title}
              className={`rounded-xl border px-3 py-2.5 ${tone}`}
            >
              <div className="text-xs font-medium line-clamp-1 opacity-80">{row.title}</div>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-bold">
                <Icon size={14} />
                {delta == null
                  ? "—"
                  : delta === 0
                    ? t("compare.marketEqual")
                    : t("compare.marketDelta", {
                        value: `${delta > 0 ? "+" : ""}${delta}%`,
                      })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
