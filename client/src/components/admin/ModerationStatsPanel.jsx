import React from "react";
import { AlertTriangle, Clock3, Flag, Layers3 } from "lucide-react";
import { api } from "../../lib/api";

export default function ModerationStatsPanel({ token }) {
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const data = await api.moderationStats(token);
      setStats(data || null);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">
        Загрузка метрик модерации...
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-4">
      <div>
        <h3 className="font-bold text-slate-900">SLA и очередь</h3>
        <p className="text-sm text-slate-500 mt-1">
          Среднее время модерации за 30 дней: {stats.avgModerationHours} ч
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-slate-50 p-3">
          <div className="text-xs text-slate-500">В очереди</div>
          <div className="text-2xl font-bold">{stats.pending}</div>
        </div>

        <div className="rounded-xl border bg-amber-50 p-3">
          <div className="text-xs text-amber-700 flex items-center gap-1">
            <Clock3 size={14} />
            Старше 24 ч
          </div>
          <div className="text-2xl font-bold text-amber-800">
            {stats.pendingOver24h}
          </div>
        </div>

        <div className="rounded-xl border bg-red-50 p-3">
          <div className="text-xs text-red-700 flex items-center gap-1">
            <Flag size={14} />
            Жалобы
          </div>
          <div className="text-2xl font-bold text-red-800">
            {stats.pendingReports}
          </div>
        </div>

        <div className="rounded-xl border bg-indigo-50 p-3">
          <div className="text-xs text-indigo-700 flex items-center gap-1">
            <Layers3 size={14} />
            Апелляции
          </div>
          <div className="text-2xl font-bold text-indigo-800">
            {stats.appealsPending}
          </div>
        </div>
      </div>

      {stats.flagged > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 flex items-center gap-2">
          <AlertTriangle size={16} />
          {stats.flagged} объявлений с автоматическими флагами
        </div>
      )}

      {stats.byCategory?.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2 pr-3">Категория</th>
                <th className="py-2 pr-3">Одобрено</th>
                <th className="py-2">Отклонено</th>
              </tr>
            </thead>
            <tbody>
              {stats.byCategory.map((row) => (
                <tr key={row.cat} className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-medium">{row.cat}</td>
                  <td className="py-2 pr-3 text-emerald-700">{row.approved}</td>
                  <td className="py-2 text-red-700">{row.rejected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
