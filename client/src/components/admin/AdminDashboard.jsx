import React from "react";
import {
  Users,
  FileText,
  Flag,
  Wallet,
  TrendingUp,
  ShieldAlert,
  Clock,
} from "lucide-react";

function StatCard({ label, value, hint, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-50",
    emerald: "bg-emerald-50",
    red: "bg-red-50",
    amber: "bg-amber-50",
    purple: "bg-purple-50",
    sun: "bg-sun-50",
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone] || tones.slate}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}

export default function AdminDashboard({ stats, loading, error }) {
  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-4 animate-pulse">
        <div className="h-7 bg-mist-200 rounded w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-mist-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4">
        {error}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const { users, listings, reports, wallet } = stats;

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 text-sm text-sun-700 bg-sun-50 border border-sun-100 rounded-full px-3 py-1 mb-2">
          <TrendingUp className="w-4 h-4" />
          Сводка сайта
        </div>
        <h2 className="text-xl font-bold">Dashboard</h2>
        <p className="text-sm text-slate-500 mt-1">
          Общая статистика пользователей, объявлений и финансов.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Users size={16} />
          Пользователи
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <StatCard label="Всего" value={users.total} tone="slate" />
          <StatCard label="Активные" value={users.active} tone="emerald" />
          <StatCard label="Заблокированы" value={users.blocked} tone="red" />
          <StatCard
            label="Новые за 7 дней"
            value={users.newWeek}
            tone="sun"
            hint="Регистрации"
          />
          <StatCard label="Супер-админы" value={users.superAdmins} tone="purple" />
          <StatCard label="Модераторы" value={users.moderators} tone="slate" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <FileText size={16} />
          Объявления
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <StatCard label="Всего" value={listings.total} tone="slate" />
          <StatCard
            label="На модерации"
            value={listings.pending}
            tone="amber"
            hint="Требуют проверки"
          />
          <StatCard label="Опубликованы" value={listings.approved} tone="emerald" />
          <StatCard label="Отклонены" value={listings.rejected} tone="red" />
          <StatCard label="Продано" value={listings.sold} tone="slate" />
          <StatCard label="Сняты" value={listings.archived} tone="slate" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
            <Flag size={16} />
            Жалобы
          </div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-3xl font-bold text-red-700">{reports.pending}</div>
              <div className="text-sm text-slate-500">ожидают рассмотрения</div>
            </div>
            {reports.pending > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-700 text-xs border border-red-200">
                <ShieldAlert size={14} />
                Требует внимания
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
            <Wallet size={16} />
            Кошельки
          </div>
          <div>
            <div className="text-3xl font-bold text-sun-700">
              {Number(wallet.totalBalance || 0).toLocaleString("ru-RU")} TJS
            </div>
            <div className="text-sm text-slate-500 flex items-center gap-1 mt-1">
              <Clock size={14} />
              Суммарный баланс всех пользователей
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
