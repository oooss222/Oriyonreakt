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
import { useI18n } from "../../i18n";

function StatCard({ label, value, hint, tone = "slate" }) {
  const tones = {
    slate: "",
    emerald: "border-emerald-200/80 bg-emerald-50/90",
    red: "border-red-200/80 bg-red-50/90",
    amber: "border-amber-200/80 bg-amber-50/90",
    purple: "border-purple-200/80 bg-purple-50/90",
    sun: "border-sun-200/80 bg-sun-50/90",
    blue: "border-lagoon-200/80 bg-lagoon-50/90",
  };

  return (
    <div className={`admin-stat ${tones[tone] || ""}`}>
      <div className="admin-stat__label">{label}</div>
      <div className="admin-stat__value">{value}</div>
      {hint && <div className="text-xs text-ink-500">{hint}</div>}
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
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-ink-800">
            <Icon size={16} />
            {title}
          </div>
          <div className="text-3xl font-bold mt-2">{count}</div>
          <div className="text-xs text-ink-600 mt-1">{hint}</div>
        </div>
        <ArrowRight size={18} className="text-ink-400 shrink-0 mt-1" />
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
  const { t } = useI18n();
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
            {isSuperAdmin
              ? t("admin.dashboard.badgeSuperAdmin")
              : t("admin.dashboard.badgeAdmin")}
          </div>
          <h2 className="text-xl font-bold">{t("admin.dashboard.title")}</h2>
          <p className="text-sm text-ink-500 mt-1">
            {isSuperAdmin
              ? t("admin.dashboard.subtitleSuperAdmin")
              : t("admin.dashboard.subtitleAdmin")}
          </p>
        </div>

        <Link
          to="/messages"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border bg-white hover:bg-mist-50 text-sm font-semibold shrink-0"
        >
          <MessageCircle size={16} />
          {t("admin.dashboard.messagesLink")}
        </Link>
      </div>

      <div className="rounded-2xl border bg-gradient-to-r from-ink-800 to-lagoon-800 text-white p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-sm text-white/70">{t("admin.dashboard.queueLabel")}</div>
            <div className="text-3xl font-bold mt-1">{queueTotal}</div>
            <div className="text-xs text-white/60 mt-1">
              {t("admin.dashboard.queueHint")}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingModeration > 0 && (
              <button
                type="button"
                onClick={() => onGoToSection?.("moderation")}
                className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-semibold"
              >
                {t("admin.dashboard.queueModeration", { count: pendingModeration })}
              </button>
            )}
            {pendingReports > 0 && (
              <button
                type="button"
                onClick={() => onGoToSection?.("reports")}
                className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-semibold"
              >
                {t("admin.dashboard.queueReports", { count: pendingReports })}
              </button>
            )}
            {pendingBusiness > 0 && (
              <button
                type="button"
                onClick={() => onGoToSection?.("users", { business: "unverified" })}
                className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-semibold"
              >
                {t("admin.dashboard.queueBusiness", { count: pendingBusiness })}
              </button>
            )}
            {queueTotal === 0 && (
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-100 text-xs font-semibold">
                {t("admin.dashboard.queueEmpty")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <PriorityCard
          icon={ClipboardCheck}
          title={t("admin.dashboard.priorityModerationTitle")}
          count={pendingModeration}
          hint={t("admin.dashboard.priorityModerationHint")}
          tone="amber"
          onClick={() => onGoToSection?.("moderation")}
        />
        <PriorityCard
          icon={Flag}
          title={t("admin.dashboard.priorityReportsTitle")}
          count={pendingReports}
          hint={t("admin.dashboard.priorityReportsHint")}
          tone="red"
          onClick={() => onGoToSection?.("reports")}
        />
        <PriorityCard
          icon={Building2}
          title={t("admin.dashboard.priorityBusinessTitle")}
          count={pendingBusiness}
          hint={t("admin.dashboard.priorityBusinessHint")}
          tone="blue"
          onClick={() => onGoToSection?.("users", { business: "unverified" })}
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
          <Users size={16} />
          {t("admin.dashboard.usersHeading")}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <StatCard label={t("admin.dashboard.usersTotal")} value={users.total} tone="slate" />
          <StatCard label={t("admin.dashboard.usersActive")} value={users.active} tone="emerald" />
          <StatCard label={t("admin.dashboard.usersBlocked")} value={users.blocked} tone="red" />
          <StatCard
            label={t("admin.dashboard.usersNewWeek")}
            value={users.newWeek}
            tone="sun"
            hint={t("admin.dashboard.usersNewWeekHint")}
          />
          <StatCard
            label={t("admin.dashboard.usersBusiness")}
            value={business?.totalCompanies || 0}
            tone="blue"
          />
          <StatCard
            label={t("admin.dashboard.usersModerators")}
            value={users.moderators}
            tone="slate"
          />
          {isSuperAdmin && (
            <StatCard
              label={t("admin.dashboard.usersSuperAdmins")}
              value={users.superAdmins}
              tone="purple"
            />
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
          <FileText size={16} />
          {t("admin.sections.listings")}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <StatCard label={t("admin.dashboard.listingsTotal")} value={listings.total} tone="slate" />
          <StatCard
            label={t("admin.dashboard.listingsPending")}
            value={listings.pending}
            tone="amber"
            hint={t("admin.dashboard.listingsPendingHint")}
          />
          <StatCard label={t("admin.dashboard.listingsApproved")} value={listings.approved} tone="emerald" />
          <StatCard label={t("admin.dashboard.listingsRejected")} value={listings.rejected} tone="red" />
          <StatCard label={t("admin.dashboard.listingsSold")} value={listings.sold} tone="slate" />
          <StatCard label={t("admin.dashboard.listingsArchived")} value={listings.archived} tone="slate" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="admin-panel p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-700 mb-3">
            <BadgeCheck size={16} />
            {t("admin.dashboard.businessAccountsHeading")}
          </div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-3xl font-bold text-blue-700">
                {business?.totalCompanies || 0}
              </div>
              <div className="text-sm text-ink-500">{t("admin.dashboard.businessCompaniesHint")}</div>
            </div>
            {pendingBusiness > 0 && (
              <button
                type="button"
                onClick={() =>
                  onGoToSection?.("users", { business: "unverified" })
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs border border-blue-200 font-semibold hover:bg-blue-100 transition"
              >
                {t("admin.dashboard.businessCheck", { count: pendingBusiness })}
              </button>
            )}
          </div>
        </div>

        <div className="admin-panel p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-700 mb-3">
            <Wallet size={16} />
            {t("admin.dashboard.walletsHeading")}
          </div>
          <div>
            <div className="text-3xl font-bold text-sun-700">
              {Number(wallet.totalBalance || 0).toLocaleString("ru-RU")} TJS
            </div>
            <div className="text-sm text-ink-500 flex items-center gap-1 mt-1">
              <Clock size={14} />
              {t("admin.dashboard.walletsHint")}
            </div>
          </div>
        </div>
      </div>

      {!isSuperAdmin && (
        <div className="rounded-2xl border border-dashed border-mist-200 bg-mist-50 p-4 text-sm text-ink-600">
          {t("admin.dashboard.roleNoticePrefix")}{" "}
          <strong>{roleLabel(role)}</strong>. {t("admin.dashboard.roleNoticeBody")}
        </div>
      )}
    </div>
  );
}
