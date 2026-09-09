import React from "react";
import { Link } from "react-router-dom";
import { BarChart3, Phone, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import {
  Alert,
  Badge,
  EmptyState,
  SectionCard,
  SegmentedControl,
  Skeleton,
  cn,
} from "../../ui";
import { api } from "../../lib/api";
import { getListingThumb } from "../../lib/media";
import { formatViewCount } from "../../lib/format";
import { getId } from "./profileUtils";
import { useI18n } from "../../i18n";

const DAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const SERIES = [
  { key: "views", labelKey: "profile.analyticsViews", bar: "bg-sun-500", swatch: "bg-sun-500" },
  {
    key: "reveals",
    labelKey: "profile.analyticsReveals",
    bar: "bg-lagoon-500",
    swatch: "bg-lagoon-500",
  },
  {
    key: "favorites",
    labelKey: "profile.analyticsFavorites",
    bar: "bg-warning-400",
    swatch: "bg-warning-400",
  },
];

function dayDate(day) {
  return new Date(`${day}T12:00:00`);
}

function ChangeBadge({ value, suffix = "%" }) {
  if (value == null) return null;

  const positive = value >= 0;

  return (
    <Badge
      tone={positive ? "success" : "danger"}
      icon={positive ? TrendingUp : TrendingDown}
      className="tabular-nums"
    >
      {positive ? "+" : ""}
      {value}
      {suffix}
    </Badge>
  );
}

function KpiCard({ label, value, change, changeSuffix, hint }) {
  return (
    <div className="card flex min-h-[7rem] flex-col justify-between p-4">
      <p className="text-xs font-medium text-ink-400 sm:text-sm">{label}</p>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-display text-2xl font-extrabold tabular-nums text-ink-900 sm:text-3xl">
          {Number(value || 0).toLocaleString("ru-RU")}
        </span>
        <ChangeBadge value={change} suffix={changeSuffix} />
      </div>

      {hint && <p className="mt-1 text-2xs text-ink-400 sm:text-xs">{hint}</p>}
    </div>
  );
}

function GroupedBarChart({ series, hidden, t }) {
  const max = Math.max(
    1,
    ...series.flatMap((day) =>
      SERIES.map((metric) => (hidden[metric.key] ? 0 : day[metric.key]))
    )
  );

  return (
    <figure className="m-0">
      <div className="flex h-56 items-end gap-1.5 pt-2 sm:gap-2.5" aria-hidden="true">
        {series.map((day) => {
          const label = DAY_LABELS[dayDate(day.day).getDay()] || "";

          return (
            <div
              key={day.day}
              className="flex h-full min-w-0 flex-1 flex-col items-center gap-1.5"
            >
              <div className="flex w-full flex-1 items-end justify-center gap-0.5 sm:gap-1">
                {SERIES.map((metric) =>
                  hidden[metric.key] ? null : (
                    <div
                      key={metric.key}
                      title={`${label}: ${day[metric.key]}`}
                      className={cn("w-[28%] max-w-[14px] rounded-t-sm", metric.bar)}
                      style={{ height: `${Math.max(4, (day[metric.key] / max) * 100)}%` }}
                    />
                  )
                )}
              </div>
              <span className="text-2xs font-medium text-ink-400 sm:text-xs">{label}</span>
            </div>
          );
        })}
      </div>

      <figcaption className="sr-only">
        <ul>
          {series.map((day) => (
            <li key={day.day}>
              {t("profile.analyticsDaySummary", {
                day: dayDate(day.day).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                }),
                views: day.views,
                reveals: day.reveals,
                favorites: day.favorites,
              })}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}

export default function SellerAnalyticsPanel({ token }) {
  const { t } = useI18n();
  const [period, setPeriod] = React.useState("7d");
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [hidden, setHidden] = React.useState({
    views: false,
    reveals: false,
    favorites: false,
  });

  React.useEffect(() => {
    if (!token) return undefined;
    let alive = true;
    setLoading(true);

    api
      .sellerAnalytics(token, period)
      .then((res) => {
        if (!alive) return;
        setData(res);
        setError("");
      })
      .catch(() => {
        if (!alive) return;
        setData(null);
        setError(t("profile.analyticsFailed"));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [token, period, t]);

  const kpis = data?.kpis || {};
  const series = data?.series || [];
  const phoneReveals = data?.phoneReveals || [];
  const topListings = data?.topListings || [];
  const maxPhone = Math.max(1, ...phoneReveals.map((p) => p.count || 0));

  const periods = [
    { value: "7d", label: t("profile.analyticsPeriod7") },
    { value: "30d", label: t("profile.analyticsPeriod30") },
    { value: "all", label: t("profile.analyticsPeriodAll") },
  ];

  const periodLabel = periods.find((item) => item.value === period)?.label || "";

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="section-title">{t("profile.analytics")}</h2>
          <p className="section-subtitle mt-1">{t("profile.analyticsSubtitle")}</p>
        </div>

        <div className="shrink-0">
          <p className="label-caps mb-1.5">{t("profile.analyticsPeriodLabel")}</p>
          <SegmentedControl
            items={periods}
            value={period}
            onChange={setPeriod}
            label={t("profile.analyticsPeriodLabel")}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" rounded="rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              label={t("profile.analyticsViews")}
              value={kpis.views}
              change={kpis.viewsChange}
              hint={t("profile.analyticsAvgDay", { count: kpis.avgViewsPerDay || 0 })}
            />
            <KpiCard
              label={t("profile.analyticsFavorites")}
              value={kpis.favorites}
              change={kpis.favoritesChange}
              hint={t("profile.analyticsConversion", {
                value: String(kpis.favoriteConversion || 0).replace(".", ","),
              })}
            />
            <KpiCard
              label={t("profile.analyticsReveals")}
              value={kpis.reveals}
              change={kpis.revealsChange}
              hint={t("profile.analyticsConversion", {
                value: String(kpis.revealConversion || 0).replace(".", ","),
              })}
            />
            <KpiCard
              label={t("profile.analyticsActive")}
              value={kpis.activeListings}
              hint={t("profile.analyticsOfTotal", { total: kpis.totalListings || 0 })}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
            <SectionCard
              title={t("profile.analyticsDynamics", { period: periodLabel })}
              icon={BarChart3}
              headingLevel="h3"
            >
              <div
                role="group"
                aria-label={t("profile.analyticsLegend")}
                className="mb-4 flex flex-wrap gap-2"
              >
                {SERIES.map((metric) => {
                  const label = t(metric.labelKey);
                  const shown = !hidden[metric.key];

                  return (
                    <button
                      key={metric.key}
                      type="button"
                      aria-pressed={shown}
                      onClick={() =>
                        setHidden((current) => ({
                          ...current,
                          [metric.key]: !current[metric.key],
                        }))
                      }
                      className={cn(
                        "inline-flex min-h-[2.125rem] items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 text-xs font-semibold transition-colors hover:bg-mist-100",
                        shown ? "text-ink-700" : "text-ink-400"
                      )}
                    >
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-sm",
                          shown ? metric.swatch : "bg-ink-300"
                        )}
                        aria-hidden="true"
                      />
                      {label}
                      <span className="tabular-nums text-ink-400">
                        {Number(kpis[metric.key] || 0).toLocaleString("ru-RU")}
                      </span>
                    </button>
                  );
                })}
              </div>

              {series.length === 0 ? (
                <EmptyState
                  bare
                  icon={BarChart3}
                  title={t("profile.analyticsEmptyChart")}
                  description={t("profile.analyticsEmptyChartHint")}
                />
              ) : (
                <GroupedBarChart series={series} hidden={hidden} t={t} />
              )}

              <p className="mt-3 text-xs text-ink-400">{t("profile.analyticsChartHint")}</p>
            </SectionCard>

            <SectionCard
              title={t("profile.analyticsByPhone")}
              description={t("profile.analyticsByPhoneHint")}
              icon={Phone}
              headingLevel="h3"
            >
              {phoneReveals.length === 0 ? (
                <EmptyState
                  bare
                  icon={Phone}
                  title={t("profile.analyticsNoPhones")}
                  description={t("profile.analyticsNoPhonesHint")}
                />
              ) : (
                <ul className="space-y-4">
                  {phoneReveals.map((row) => (
                    <li key={row.phone}>
                      <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium tabular-nums text-ink-700">
                          {row.phone}
                        </span>
                        <span className="font-bold tabular-nums text-lagoon-700">
                          {row.count}
                        </span>
                      </div>
                      <div
                        className="h-2.5 overflow-hidden rounded-full bg-mist-200"
                        aria-hidden="true"
                      >
                        <div
                          className="h-full rounded-full bg-lagoon-500"
                          style={{ width: `${Math.max(4, (row.count / maxPhone) * 100)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>

          <SectionCard
            title={t("profile.analyticsTop")}
            description={t("profile.analyticsTopHint")}
            icon={Trophy}
            headingLevel="h3"
          >
            {topListings.length === 0 ? (
              <EmptyState
                bare
                icon={Trophy}
                title={t("profile.analyticsEmptyTop")}
                description={t("profile.analyticsEmptyTopHint")}
              />
            ) : (
              <div className="-mx-4 overflow-x-auto sm:-mx-5">
                <table className="w-full min-w-[640px] text-sm">
                  <caption className="sr-only">
                    {t("profile.analyticsTop")} — {periodLabel}
                  </caption>
                  <thead>
                    <tr className="border-b border-ink-200 text-2xs uppercase tracking-wide text-ink-400">
                      <th scope="col" className="px-4 py-3 text-left font-semibold">
                        {t("profile.analyticsColAd")}
                      </th>
                      <th scope="col" className="px-3 py-3 text-right font-semibold">
                        {t("profile.analyticsViews")}
                      </th>
                      <th scope="col" className="px-3 py-3 text-right font-semibold">
                        {t("profile.analyticsFavorites")}
                      </th>
                      <th scope="col" className="px-3 py-3 text-right font-semibold">
                        {t("profile.analyticsColNumber")}
                      </th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">
                        {t("profile.analyticsColConversion")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topListings.map((ad) => {
                      const id = getId(ad);
                      const conv = Number(ad.conversion || 0);

                      return (
                        <tr
                          key={id}
                          className="border-b border-ink-200 transition-colors last:border-0 hover:bg-mist-50"
                        >
                          <td className="px-4 py-3">
                            <Link
                              to={`/ad/${id}`}
                              className="group flex min-w-0 items-center gap-3"
                            >
                              <img
                                src={getListingThumb(ad, { width: 96 })}
                                alt=""
                                className="h-11 w-11 shrink-0 rounded-lg bg-mist-200 object-cover"
                              />
                              <span className="min-w-0">
                                <span className="block truncate font-semibold text-ink-900 group-hover:text-sun-700">
                                  {ad.title}
                                </span>
                                <span className="block truncate text-xs text-ink-400">
                                  {[ad.cat, ad.location].filter(Boolean).join(" · ")}
                                </span>
                              </span>
                            </Link>
                          </td>
                          <td className="px-3 py-3 text-right font-medium tabular-nums text-ink-700">
                            {formatViewCount(ad.views)}
                          </td>
                          <td className="px-3 py-3 text-right font-medium tabular-nums text-ink-700">
                            {ad.favorites}
                          </td>
                          <td className="px-3 py-3 text-right font-medium tabular-nums text-ink-700">
                            {ad.reveals}
                          </td>
                          <td
                            className={cn(
                              "px-4 py-3 text-right font-bold tabular-nums",
                              conv >= 10 ? "text-success-700" : "text-ink-500"
                            )}
                          >
                            {String(conv).replace(".", ",")}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
