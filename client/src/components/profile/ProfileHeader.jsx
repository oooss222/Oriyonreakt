import React from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Heart,
  LogOut,
  Plus,
  Wallet,
} from "lucide-react";
import EmailBadge from "./EmailBadge";
import { calculateProfileCompletion, getUserInitials, isStaffRole } from "./profileUtils";
import { Avatar, Badge, Button, cn } from "../../ui";
import { useI18n } from "../../i18n";
import { formatMoney, formatRegistrationDate } from "../../lib/format";

function CounterTile({ icon: Icon, label, value, tone, active, onClick }) {
  const tones = {
    success: "text-success-600",
    warning: "text-warning-600",
    danger: "text-danger-600",
    neutral: "text-ink-400",
    sun: "text-sun-600",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex min-h-[4.25rem] flex-col justify-between rounded-xl border px-3 py-2.5 text-left transition-colors",
        active
          ? "border-ink-900 bg-mist-50"
          : "border-ink-200 bg-white hover:border-ink-300 hover:bg-mist-50"
      )}
    >
      <span className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
        <Icon size={14} className={cn("shrink-0", tones[tone])} aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>

      <span className="font-display text-xl font-extrabold tabular-nums text-ink-900">
        {value}
      </span>
    </button>
  );
}

export default function ProfileHeader({
  me,
  role,
  emailStatus,
  walletBalance,
  stats = { approved: 0, pending: 0, rejected: 0, archived: 0 },
  favCount = 0,
  activeStatus,
  onSelectStatus,
  onOpenFavorites,
  onOpenWallet,
  onLogout,
}) {
  const { t } = useI18n();
  const completion = calculateProfileCompletion(me, emailStatus);
  const userId = me?.id || me?._id;
  const memberSince = formatRegistrationDate(me?.createdAt);
  const sellerLabel =
    me?.sellerType === "company" ? t("profile.sellerCompany") : t("profile.sellerPrivate");

  const counters = [
    {
      key: "approved",
      icon: CheckCircle2,
      tone: "success",
      label: t("profile.statsApproved"),
      value: stats.approved,
      onClick: () => onSelectStatus("approved"),
    },
    {
      key: "pending",
      icon: Clock3,
      tone: "warning",
      label: t("profile.statsPending"),
      value: stats.pending,
      onClick: () => onSelectStatus("pending"),
    },
    {
      key: "rejected",
      icon: AlertTriangle,
      tone: "danger",
      label: t("profile.statsRejected"),
      value: stats.rejected,
      onClick: () => onSelectStatus("rejected"),
    },
    {
      key: "archived",
      icon: Archive,
      tone: "neutral",
      label: t("profile.statsArchived"),
      value: stats.archived,
      onClick: () => onSelectStatus("archived"),
    },
    {
      key: "favorites",
      icon: Heart,
      tone: "sun",
      label: t("profile.favorites"),
      value: favCount == null ? "—" : favCount,
      onClick: onOpenFavorites,
    },
  ];

  return (
    <section className="surface-panel p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <Avatar name={getUserInitials(me?.name)} size="xl" rounded="rounded-2xl" />

          <div className="min-w-0">
            <h1 className="font-display text-xl font-extrabold leading-tight tracking-tight text-ink-900 break-anywhere sm:text-2xl">
              {me?.name || t("seller.noName")}
            </h1>

            {me?.email && (
              <p className="mt-0.5 truncate text-sm text-ink-400">{me.email}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge tone="neutral">{sellerLabel}</Badge>
              <EmailBadge status={emailStatus} />
              {isStaffRole(role) && <Badge tone="info">{role.replace("_", " ")}</Badge>}
            </div>

            {memberSince && (
              <p className="mt-2 text-xs text-ink-400">
                {t("profile.memberSince", { date: memberSince })}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
          <Button variant="primary" to="/add" icon={Plus} className="sm:order-2">
            {t("profile.postListing")}
          </Button>

          <Button onClick={onOpenWallet} icon={Wallet} className="sm:order-1">
            {t("nav.wallet")}
            <span className="tabular-nums text-ink-500">
              {formatMoney(walletBalance, { currency: t("price.currency") })}
            </span>
          </Button>

          <div className="flex gap-2 sm:order-3">
            {userId && (
              <Button
                to={`/seller/${userId}`}
                iconRight={ExternalLink}
                className="flex-1 sm:flex-none"
              >
                {t("profile.howOthersSee")}
              </Button>
            )}

            <Button onClick={onLogout} icon={LogOut} aria-label={t("profile.logout")}>
              <span className="sm:sr-only">{t("profile.logout")}</span>
            </Button>
          </div>
        </div>
      </div>

      <h2 className="sr-only">{t("profile.overviewTitle")}</h2>

      <ul
        aria-live="polite"
        className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
      >
        {counters.map((counter) => (
          <li key={counter.key} className="min-w-0">
            <CounterTile
              icon={counter.icon}
              tone={counter.tone}
              label={counter.label}
              value={counter.value}
              active={counter.key === activeStatus}
              onClick={counter.onClick}
            />
          </li>
        ))}
      </ul>

      {completion.percent < 100 && (
        <div className="mt-4 rounded-xl border border-ink-200 bg-mist-50 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-ink-600">
              {t("profile.completionLabel", { percent: completion.percent })}
            </span>

            {completion.hintKeys[0] && (
              <Link
                to="/profile?tab=profile"
                className="text-sm font-semibold text-sun-700 hover:text-sun-800"
              >
                {t(completion.hintKeys[0])}
              </Link>
            )}
          </div>

          <div
            className="h-2 overflow-hidden rounded-full bg-mist-200"
            role="progressbar"
            aria-valuenow={completion.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("profile.completionLabel", { percent: completion.percent })}
          >
            <div
              className="h-full rounded-full bg-sun-500 transition-all duration-500"
              style={{ width: `${completion.percent}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
