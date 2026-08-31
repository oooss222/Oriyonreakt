import React from "react";
import { Link } from "react-router-dom";
import {
  User as UserIcon,
  LogOut,
  Wallet,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import EmailBadge from "./EmailBadge";
import { calculateProfileCompletion, getUserInitials, isStaffRole } from "./profileUtils";
import { useI18n } from "../../i18n";
import { formatMoney } from "../../lib/format";

export default function ProfileHeader({
  me,
  role,
  emailStatus,
  walletBalance,
  onOpenWallet,
  onLogout,
}) {
  const { t } = useI18n();
  const completion = calculateProfileCompletion(me, emailStatus);
  const userId = me?.id || me?._id;
  const initials = getUserInitials(me?.name);
  const showRole = isStaffRole(role);
  const sellerLabel =
    me?.sellerType === "company" ? t("profile.sellerCompany") : t("profile.sellerPrivate");

  return (
    <div className="rounded-2xl border border-ink/8 bg-white shadow-soft overflow-hidden">
      <div className="p-4 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div className="relative w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-2xl bg-sun text-white font-bold text-xl grid place-items-center shrink-0 shadow-soft">
              {initials !== "?" ? initials : <UserIcon size={28} />}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md bg-mist text-ink-400">
                  {sellerLabel}
                </span>
                <EmailBadge status={emailStatus} />
                {showRole && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide rounded-md bg-mist text-ink-500 border border-ink/8">
                    {role.replace("_", " ")}
                  </span>
                )}
              </div>

              <h1 className="font-display text-xl sm:text-2xl font-bold leading-tight break-words text-ink tracking-tight">
                {me?.name || t("seller.noName")}
              </h1>

              <p className="text-sm text-ink-400 mt-1 truncate">{me?.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenWallet}
              className="inline-flex items-center gap-2 rounded-xl bg-sun px-4 py-2.5 text-sm font-semibold text-white hover:bg-sun-600 transition shadow-soft"
            >
              <Wallet size={16} />
              {t("nav.wallet")}
              <span className="opacity-90 tabular-nums">
                {formatMoney(walletBalance, { currency: "с.", emptyLabel: "0 с." })}
              </span>
            </button>

            {userId && (
              <Link
                to={`/seller/${userId}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm font-medium text-ink-600 hover:border-sun/40 hover:text-sun transition"
              >
                {t("profile.howOthersSee")}
                <ExternalLink size={14} />
              </Link>
            )}

            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm font-medium text-ink-600 hover:bg-mist transition"
              onClick={onLogout}
            >
              <LogOut size={16} />
              {t("profile.logout")}
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-ink/8 bg-mist/50 p-3 md:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm mb-2">
            <span className="font-medium text-ink-600">
              {t("profile.completionLabel", { percent: completion.percent })}
            </span>
            {completion.percent < 100 && completion.hints[0] && (
              <Link
                to="/profile?tab=profile"
                className="inline-flex items-center gap-1 text-sm font-semibold text-sun hover:text-sun-600 transition"
              >
                {completion.hints[0]}
                <ChevronRight size={14} />
              </Link>
            )}
          </div>

          <div className="h-2.5 rounded-full bg-mist-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-sun transition-all duration-500"
              style={{ width: `${completion.percent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
