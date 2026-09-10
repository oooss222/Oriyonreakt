import React from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { getListingThumb } from "../../lib/media";
import { formatViewCount } from "../../lib/format";
import { getId } from "./profileUtils";
import { useI18n } from "../../i18n";

const DAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

function ChangeBadge({ value, suffix = "%" }) {
  if (value == null) return null;
  const positive = value >= 0;
  return (
    <span
      className={`text-xs font-semibold tabular-nums ${
        positive ? "text-emerald-600" : "text-red-500"
      }`}
    >
      {positive ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

function KpiCard({ label, value, change, changeSuffix, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="text-sm text-slate-500 mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl sm:text-3xl font-extrabold tabular-nums text-slate-900">
          {Number(value || 0).toLocaleString("ru-RU")}
        </div>
        <ChangeBadge value={change} suffix={changeSuffix} />
      </div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

function GroupedBarChart({ series, hidden }) {
  const max = Math.max(
    1,
    ...series.flatMap((d) => [
      hidden.views ? 0 : d.views,
      hidden.reveals ? 0 : d.reveals,
      hidden.favorites ? 0 : d.favorites,
    ])
  );

  return (
    <div className="h-56 flex items-end gap-1.5 sm:gap-2.5 pt-2">
      {series.map((day) => {
        const label = DAY_LABELS[new Date(`${day.day}T12:00:00`).getDay()] || "";
        const bars = [
          { key: "views", value: day.views, color: "bg-sun", hidden: hidden.views },
          { key: "reveals", value: day.reveals, color: "bg-teal-500", hidden: hidden.reveals },
          {
            key: "favorites",
            value: day.favorites,
            color: "bg-amber-300",
            hidden: hidden.favorites,
          },
        ];

        return (
          <div key={day.day} className="flex-1 min-w-0 flex flex-col items-center gap-1.5 h-full">
            <div className="flex-1 w-full flex items-end justify-center gap-0.5 sm:gap-1">
              {bars.map((bar) =>
                bar.hidden ? null : (
                  <div
                    key={bar.key}
                    title={`${label}: ${bar.value}`}
                    className={`w-[28%] max-w-[14px] rounded-t-sm ${bar.color} transition-all`}
                    style={{ height: `${Math.max(4, (bar.value / max) * 100)}%` }}
                  />
                )
              )}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 font-medium">{label}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function SellerAnalyticsPanel({ token }) {
  const { t } = useI18n();
  const [period, setPeriod] = React.useState("7d");
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
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
        if (alive) setData(res);
      })
      .catch(() => {
        if (alive) setData(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [token, period]);

  const kpis = data?.kpis || {};
  const series = data?.series || [];
  const phoneReveals = data?.phoneReveals || [];
  const topListings = data?.topListings || [];
  const maxPhone = Math.max(1, ...phoneReveals.map((p) => p.count || 0));

  const periodLabel =
    period === "7d"
      ? t("profile.analyticsPeriod7")
      : period === "30d"
        ? t("profile.analyticsPeriod30")
        : t("profile.analyticsPeriodAll");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t("profile.analytics")}</h2>
          <p className="text-sm text-slate-500 mt-1">{t("profile.analyticsSubtitle")}</p>
        </div>

        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {[
            ["7d", t("profile.analyticsPeriod7")],
            ["30d", t("profile.analyticsPeriod30")],
            ["all", t("profile.analyticsPeriodAll")],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                period === key ? "bg-sun text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border bg-white animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)] gap-4">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 md:p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  {t("profile.analyticsDynamics", { period: periodLabel })}
                </h3>
                <div className="flex flex-wrap gap-3 text-xs font-medium">
                  {[
                    ["views", t("profile.analyticsViews"), "bg-sun", kpis.views],
                    ["reveals", t("profile.analyticsReveals"), "bg-teal-500", kpis.reveals],
                    [
                      "favorites",
                      t("profile.analyticsFavorites"),
                      "bg-amber-300",
                      kpis.favorites,
                    ],
                  ].map(([key, label, color, count]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setHidden((h) => ({ ...h, [key]: !h[key] }))
                      }
                      className={`inline-flex items-center gap-1.5 ${
                        hidden[key] ? "opacity-40" : ""
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                      {label}
                      <span className="text-slate-400 tabular-nums">
                        {Number(count || 0).toLocaleString("ru-RU")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <GroupedBarChart series={series} hidden={hidden} />
              <p className="mt-3 text-xs text-slate-400">{t("profile.analyticsChartHint")}</p>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 md:p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">
                {t("profile.analyticsByPhone")}
              </h3>
              <p className="text-sm text-slate-500 mt-1 mb-4">
                {t("profile.analyticsByPhoneHint")}
              </p>

              {phoneReveals.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">
                  {t("profile.analyticsNoPhones")}
                </p>
              ) : (
                <div className="space-y-4">
                  {phoneReveals.map((row) => (
                    <div key={row.phone}>
                      <div className="flex items-center justify-between gap-2 text-sm mb-1.5">
                        <span className="font-medium text-slate-700 tabular-nums">
                          {row.phone}
                        </span>
                        <span className="font-bold text-teal-700 tabular-nums">
                          {row.count}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-teal-500"
                          style={{
                            width: `${Math.max(4, (row.count / maxPhone) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <div className="px-4 md:px-5 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">{t("profile.analyticsTop")}</h3>
              <p className="text-sm text-slate-500">{t("profile.analyticsTopHint")}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
                    <th className="text-left font-semibold px-4 py-3">
                      {t("profile.analyticsColAd")}
                    </th>
                    <th className="text-right font-semibold px-3 py-3">
                      {t("profile.analyticsViews")}
                    </th>
                    <th className="text-right font-semibold px-3 py-3">
                      {t("profile.analyticsFavorites")}
                    </th>
                    <th className="text-right font-semibold px-3 py-3">
                      {t("profile.analyticsColNumber")}
                    </th>
                    <th className="text-right font-semibold px-4 py-3">
                      {t("profile.analyticsColConversion")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topListings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                        {t("profile.analyticsEmptyTop")}
                      </td>
                    </tr>
                  ) : (
                    topListings.map((ad) => {
                      const id = getId(ad);
                      const thumb = getListingThumb(ad, { width: 96 });
                      const conv = Number(ad.conversion || 0);
                      return (
                        <tr
                          key={id}
                          className="border-b border-slate-50 hover:bg-slate-50/70 transition"
                        >
                          <td className="px-4 py-3">
                            <Link
                              to={`/ad/${id}`}
                              className="flex items-center gap-3 min-w-0 group"
                            >
                              <img
                                src={thumb}
                                alt=""
                                className="w-11 h-11 rounded-lg object-cover bg-slate-100 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 truncate group-hover:text-sun">
                                  {ad.title}
                                </div>
                                <div className="text-xs text-slate-400 truncate">
                                  {[ad.cat, ad.location].filter(Boolean).join(" · ")}
                                </div>
                              </div>
                            </Link>
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums font-medium">
                            {formatViewCount(ad.views)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums font-medium">
                            {ad.favorites}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums font-medium">
                            {ad.reveals}
                          </td>
                          <td
                            className={`px-4 py-3 text-right tabular-nums font-bold ${
                              conv >= 10 ? "text-emerald-600" : "text-red-500"
                            }`}
                          >
                            {String(conv).replace(".", ",")}%
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
