import React from "react";
import {
  Users,
  FileText,
  Flag,
  Wallet,
  TrendingUp,
  Clock,
  ClipboardCheck,
  Building2,
  MessageCircle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
} from "lucide-react";
import { roleLabel } from "../../lib/adminUtils";
import { Alert, Badge, Button, Skeleton } from "../../ui";
import { useI18n } from "../../i18n";
import { SectionHeader, StatTile } from "./AdminUI";

const PRIORITY_TONES = {
  warning: "border-warning-200 bg-warning-50 hover:border-warning-300",
  danger: "border-danger-200 bg-danger-50 hover:border-danger-300",
  info: "border-info-200 bg-info-50 hover:border-info-300",
};

function PriorityCard({ icon: Icon, title, count, hint, tone, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition-colors ${
        PRIORITY_TONES[tone] || PRIORITY_TONES.warning
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink-800">
            <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
            {title}
          </span>
          <div className="mt-2 font-display text-3xl font-bold text-ink-900">
            {count}
          </div>
          <div className="mt-1 text-xs text-ink-500">{hint}</div>
        </div>

        <ArrowRight size={18} className="mt-1 shrink-0 text-ink-400" aria-hidden="true" />
      </div>
    </button>
  );
}

function StatGroup({ icon: Icon, title, children }) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-700">
        <Icon size={16} aria-hidden="true" />
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {children}
      </div>
    </section>
  );
}

export default function AdminDashboard({
  stats,
  loading,
  error,
  role = "admin",
  onGoToSection,
}) {
  const { t } = useI18n();
  const isSuperAdmin = role === "super_admin";

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="sr-only" role="status">
          {t("common.loading")}
        </p>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-28 w-full" rounded="rounded-3xl" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28" rounded="rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <Skeleton key={index} className="h-24" rounded="rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <Alert tone="danger">{error}</Alert>;
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
      <SectionHeader
        eyebrow={isSuperAdmin ? "Сводка платформы" : "Рабочий стол администратора"}
        icon={TrendingUp}
        title="Обзор"
        description={
          isSuperAdmin
            ? "Полная статистика пользователей, объявлений и финансов."
            : "Приоритетные задачи, модерация, пользователи и премиум-аккаунты."
        }
        action={
          <Button to="/messages" icon={MessageCircle}>
            Сообщения и заявки
          </Button>
        }
      />

      <div className="hero-dark p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/70">В очереди на обработку</p>
            <p
              className="mt-1 font-display text-3xl font-bold"
              aria-live="polite"
            >
              {queueTotal}
            </p>
            <p className="mt-1 text-xs text-white/60">
              объявления · жалобы · верификация премиум
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {pendingModeration > 0 && (
              <button
                type="button"
                onClick={() => onGoToSection?.("moderation")}
                className="rounded-full bg-white/15 px-3.5 py-2 text-xs font-semibold transition-colors hover:bg-white/25"
              >
                Модерация: {pendingModeration}
              </button>
            )}

            {pendingReports > 0 && (
              <button
                type="button"
                onClick={() => onGoToSection?.("reports")}
                className="rounded-full bg-white/15 px-3.5 py-2 text-xs font-semibold transition-colors hover:bg-white/25"
              >
                Жалобы: {pendingReports}
              </button>
            )}

            {pendingBusiness > 0 && (
              <button
                type="button"
                onClick={() => onGoToSection?.("users", { business: "unverified" })}
                className="rounded-full bg-white/15 px-3.5 py-2 text-xs font-semibold transition-colors hover:bg-white/25"
              >
                Премиум: {pendingBusiness}
              </button>
            )}

            {queueTotal === 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success-500/20 px-3.5 py-2 text-xs font-semibold text-success-100">
                <CheckCircle2 size={14} aria-hidden="true" />
                Все задачи закрыты
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <PriorityCard
          icon={ClipboardCheck}
          title="На модерации"
          count={pendingModeration}
          hint="Новые и изменённые объявления"
          tone="warning"
          onClick={() => onGoToSection?.("moderation")}
        />
        <PriorityCard
          icon={Flag}
          title="Жалобы"
          count={pendingReports}
          hint="Требуют решения модератора"
          tone="danger"
          onClick={() => onGoToSection?.("reports")}
        />
        <PriorityCard
          icon={Building2}
          title="Премиум без верификации"
          count={pendingBusiness}
          hint="Премиум-аккаунты ждут проверки"
          tone="info"
          onClick={() => onGoToSection?.("users", { business: "unverified" })}
        />
      </div>

      <StatGroup icon={Users} title="Пользователи">
        <StatTile label="Всего" value={users.total} />
        <StatTile label="Активные" value={users.active} tone="success" />
        <StatTile label="Заблокированы" value={users.blocked} tone="danger" />
        <StatTile
          label="Новые за 7 дней"
          value={users.newWeek}
          tone="sun"
          hint="Регистрации"
        />
        <StatTile
          label="Премиум"
          value={business?.totalCompanies || 0}
          tone="info"
        />
        <StatTile label="Модераторы" value={users.moderators} />
        {isSuperAdmin && (
          <StatTile label="Супер-админы" value={users.superAdmins} tone="info" />
        )}
      </StatGroup>

      <StatGroup icon={FileText} title="Объявления">
        <StatTile label="Всего" value={listings.total} />
        <StatTile
          label="На модерации"
          value={listings.pending}
          tone="warning"
          hint="Требуют проверки"
        />
        <StatTile label="Опубликованы" value={listings.approved} tone="success" />
        <StatTile label="Отклонены" value={listings.rejected} tone="danger" />
        <StatTile label="Продано" value={listings.sold} />
        <StatTile label="Сняты" value={listings.archived} />
      </StatGroup>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <section className="surface-panel p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-700">
            <BadgeCheck size={16} aria-hidden="true" />
            Премиум-аккаунты
          </h3>

          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-display text-3xl font-bold text-info-700">
                {business?.totalCompanies || 0}
              </p>
              <p className="text-sm text-ink-400">компаний на платформе</p>
            </div>

            {pendingBusiness > 0 && (
              <Button
                size="sm"
                onClick={() => onGoToSection?.("users", { business: "unverified" })}
              >
                Проверить {pendingBusiness}
              </Button>
            )}
          </div>
        </section>

        <section className="surface-panel p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-700">
            <Wallet size={16} aria-hidden="true" />
            Кошельки
          </h3>

          <p className="text-price text-3xl text-sun-700">
            {Number(wallet.totalBalance || 0).toLocaleString("ru-RU")} TJS
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-400">
            <Clock size={14} aria-hidden="true" />
            Суммарный баланс пользователей
          </p>
        </section>
      </div>

      {!isSuperAdmin && (
        <Alert tone="info" live={false}>
          Вы вошли как{" "}
          <Badge tone="sun" className="align-middle">
            {roleLabel(role)}
          </Badge>{" "}
          — доступны пользователи, объявления, модерация, жалобы, реклама,
          экспорт и журнал действий. Финансы и настройки сайта — только для
          супер-админа.
        </Alert>
      )}
    </div>
  );
}
