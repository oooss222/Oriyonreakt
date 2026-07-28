import React from "react";
import { BarChart3 } from "lucide-react";
import { api } from "../../lib/api";
import { CAT_LABELS } from "../../data/categories";

function BarChart({ items, labelKey, valueKey, emptyLabel = "Нет данных" }) {
  if (!items?.length) {
    return <div className="text-sm text-slate-500">{emptyLabel}</div>;
  }

  const max = Math.max(...items.map((item) => Number(item[valueKey] || 0)), 1);

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const value = Number(item[valueKey] || 0);
        const width = Math.max((value / max) * 100, value > 0 ? 4 : 0);

        return (
          <div key={String(item[labelKey])} className="flex items-center gap-3 text-sm">
            <div className="w-28 truncate text-slate-600" title={item[labelKey]}>
              {item[labelKey]}
            </div>
            <div className="flex-1 h-7 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sun to-sun-600 transition-all"
                style={{ width: `${width}%` }}
              />
            </div>
            <div className="w-10 text-right font-semibold text-slate-700">{value}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminAnalyticsSection({ token }) {
  const [days, setDays] = React.useState(30);
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let alive = true;

    setLoading(true);
    setError("");

    api
      .adminAnalytics(token, days)
      .then((result) => {
        if (alive) setData(result);
      })
      .catch((e) => {
        if (alive) setError(e.message || "Не удалось загрузить аналитику");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [token, days]);

  const categoryItems = React.useMemo(() => {
    return (data?.listingsByCategory || []).map((item) => ({
      label: CAT_LABELS[item.cat] || item.cat,
      count: item.count,
    }));
  }, [data]);

  const registrationItems = React.useMemo(() => {
    return (data?.registrationsByDay || []).map((item) => ({
      label: item.day.slice(5),
      count: item.count,
    }));
  }, [data]);

  if (loading) {
    return <div className="rounded-2xl border bg-white p-5 animate-pulse h-56" />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 mb-2">
            <BarChart3 className="w-4 h-4" />
            Аналитика
          </div>
          <h2 className="text-xl font-bold">Графики и активность</h2>
          <p className="text-sm text-slate-500 mt-1">
            Регистрации, категории объявлений и работа модераторов.
          </p>
        </div>

        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
        >
          <option value={7}>7 дней</option>
          <option value={14}>14 дней</option>
          <option value={30}>30 дней</option>
          <option value={90}>90 дней</option>
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="rounded-2xl border p-4 space-y-4">
          <h3 className="font-semibold">Регистрации по дням</h3>
          <BarChart
            items={registrationItems}
            labelKey="label"
            valueKey="count"
            emptyLabel="За период регистраций нет"
          />
        </div>

        <div className="rounded-2xl border p-4 space-y-4">
          <h3 className="font-semibold">Опубликованные объявления по категориям</h3>
          <BarChart
            items={categoryItems}
            labelKey="label"
            valueKey="count"
            emptyLabel="Опубликованных объявлений нет"
          />
        </div>
      </div>

      <div className="rounded-2xl border p-4 space-y-4">
        <h3 className="font-semibold">Активность модераторов и админов</h3>

        {(data?.moderatorActivity || []).length === 0 ? (
          <div className="text-sm text-slate-500">Действий за период нет.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2 px-2">Сотрудник</th>
                  <th className="py-2 px-2">Одобрено</th>
                  <th className="py-2 px-2">Отклонено</th>
                  <th className="py-2 px-2">Жалобы</th>
                  <th className="py-2 px-2">Всего</th>
                </tr>
              </thead>
              <tbody>
                {data.moderatorActivity.map((row) => (
                  <tr key={row.actorId || row.email} className="border-b last:border-b-0">
                    <td className="py-2 px-2">
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-slate-500">{row.email}</div>
                    </td>
                    <td className="py-2 px-2">{row.approvals}</td>
                    <td className="py-2 px-2">{row.rejections}</td>
                    <td className="py-2 px-2">{row.reportActions}</td>
                    <td className="py-2 px-2 font-semibold">{row.totalActions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
