import React from "react";
import { Link } from "react-router-dom";
import {
  Users,
  FileText,
  Flag,
  Wallet,
  TrendingUp,
  ShieldAlert,
  Clock,
  ClipboardCheck,
  Building2,
  MessageCircle,
  ArrowRight,
  BadgeCheck,
} from "lucide-react";
import { roleLabel } from "../../lib/adminUtils";

function StatCard({ label, value, hint, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-50",
    emerald: "bg-emerald-50",
    red: "bg-red-50",
    amber: "bg-amber-50",
    purple: "bg-purple-50",
    sun: "bg-sun-50",
    blue: "bg-blue-50",
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone] || tones.slate}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}

function PriorityCard({ icon: Icon, title, count, hint, tone, onClick }) {
  const tones = {
    amber: "border-amber-200 bg-amber-50 hover:bg-amber-100/80",
    red: "border-red-200 bg-red-50 hover:bg-red-100/80",
    blue: "border-blue-200 bg-blue-50 hover:bg-blue-100/80",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition w-full ${
        tones[tone] || tones.amber
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Icon size={16} />
            {title}
          </div>
          <div className="text-3xl font-bold mt-2">{count}</div>
          <div className="text-xs text-slate-600 mt-1">{hint}</div>
        </div>
        <ArrowRight size={18} className="text-slate-400 shrink-0 mt-1" />
      </div>
    </button>
  );
}

export default function AdminDashboard({
  stats,
  loading,
  error,
  role = "admin",
  onGoToSection,
}) {
  const isSuperAdmin = role === "super_admin";

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-7 bg-mist-200 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-mist-200 rounded-2xl" />
          ))}
        </div>
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

  const { users, listings, reports, wallet, business } = stats;
  const pendingModeration = Number(listings.pending || 0);
  const pendingReports = Number(reports.pending || 0);
  const pendingBusiness = Number(business?.pendingVerification || 0);
  const queueTotal = pendingModeration + pendingReports + pendingBusiness;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-sm text-sun-700 bg-sun-50 border border-sun-100 rounded-full px-3 py-1 mb-2">
            <TrendingUp className="w-4 h-4" />
            {isSuperAdmin ? "Сводка платформы" : "Рабочий стол администратора"}
          </div>
          <h2 className="text-xl font-bold">Обзор</h2>
          <p className="text-sm text-slate-500 mt-1">
            {isSuperAdmin
              ? "Полная статистика пользователей, объявлений и финансов."
              : "Приоритетные задачи, модерация, пользователи и премиум-аккаунты."}
          </p>
        </div>

        <Link
          to="/messages"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border bg-white hover:bg-slate-50 text-sm font-semibold shrink-0"
        >
          <MessageCircle size={16} />
          Сообщения и заявки
        </Link>
      </div>

      <div className="rounded-2xl border bg-gradient-to-r from-ink-800 to-lagoon-800 text-white p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-sm text-white/70">В очереди на обработку</div>
            <div className="text-3xl font-bold mt-1">{queueTotal}</div>
            <div className="text-xs text-white/60 mt-1">
              объявления · жалобы · верификация премиум
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingModeration > 0 && (
              <button
                type="button"
                onClick={() => onGoToSection?.("moderation")}
                className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-semibold"
              >
                Модерация: {pendingModeration}
              </button>
            )}
            {pendingReports > 0 && (
              <button
                type="button"
                onClick={() => onGoToSection?.("reports")}
                className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-semibold"
              >
                Жалобы: {pendingReports}
              </button>
            )}
            {pendingBusiness > 0 && (
              <button
                type="button"
                onClick={() => onGoToSection?.("users", { business: "unverified" })}
                className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-semibold"
              >
                Премиум: {pendingBusiness}
              </button>
            )}
            {queueTotal === 0 && (
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-100 text-xs font-semibold">
                Все задачи закрыты
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <PriorityCard
          icon={ClipboardCheck}
          title="На модерации"
          count={pendingModeration}
          hint="Новые и изменённые объявления"
          tone="amber"
          onClick={() => onGoToSection?.("moderation")}
        />
        <PriorityCard
          icon={Flag}
          title="Жалобы"
          count={pendingReports}
          hint="Требуют решения модератора"
          tone="red"
          onClick={() => onGoToSection?.("reports")}
        />
        <PriorityCard
          icon={Building2}
          title="Премиум без верификации"
          count={pendingBusiness}
          hint="Премиум-аккаунты ждут проверки"
          tone="blue"
          onClick={() => onGoToSection?.("users", { business: "unverified" })}
        />
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
          <StatCard
            label="Премиум"
            value={business?.totalCompanies || 0}
            tone="blue"
          />
          <StatCard
            label="Модераторы"
            value={users.moderators}
            tone="slate"
          />
          {isSuperAdmin && (
            <StatCard
              label="Супер-админы"
              value={users.superAdmins}
              tone="purple"
            />
          )}
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
            <BadgeCheck size={16} />
            Премиум-аккаунты
          </div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-3xl font-bold text-blue-700">
                {business?.totalCompanies || 0}
              </div>
              <div className="text-sm text-slate-500">компаний на платформе</div>
            </div>
            {pendingBusiness > 0 && (
              <button
                type="button"
                onClick={() =>
                  onGoToSection?.("users", { business: "unverified" })
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs border border-blue-200 font-semibold hover:bg-blue-100 transition"
              >
                Проверить {pendingBusiness}
              </button>
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
              Суммарный баланс пользователей
            </div>
          </div>
        </div>
      </div>

      {!isSuperAdmin && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Вы вошли как <strong>{roleLabel(role)}</strong>. Доступны пользователи,
          объявления, модерация, жалобы, реклама, экспорт и журнал действий.
          Финансы и настройки сайта — только для супер-админа.
        </div>
      )}
    </div>
  );
}
