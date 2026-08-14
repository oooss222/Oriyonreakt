import React from "react";
import { Link } from "react-router-dom";
import {
  User as UserIcon,
  LogOut,
  PlusCircle,
  Wallet,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import EmailBadge from "./EmailBadge";
import { calculateProfileCompletion, getUserInitials, isStaffRole } from "./profileUtils";
import { useI18n } from "../../i18n";

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

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-white via-white to-slate-50">
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="relative w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-2xl bg-gradient-to-br from-sun to-sun-600 text-white font-bold text-xl grid place-items-center shrink-0 shadow-sm">
              {initials !== "?" ? initials : <UserIcon size={28} />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <EmailBadge status={emailStatus} />
                {showRole && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide rounded-full bg-slate-100 text-slate-600 border">
                    {role.replace("_", " ")}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold leading-tight break-words text-slate-900">
                {me?.name || t("seller.noName")}
              </h1>

              <p className="text-sm text-slate-500 mt-1 truncate">{me?.email}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenWallet}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-sun/40 hover:text-sun transition"
                >
                  <Wallet size={14} className="text-sun" />
                  {walletBalance.toLocaleString("ru-RU")} TJS
                </button>

                {userId && (
                  <Link
                    to={`/seller/${userId}`}
                    className="inline-flex items-center gap-1 rounded-full border bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-sun/40 hover:text-sun transition"
                  >
                    <ExternalLink size={14} />
                    Как меня видят
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto md:shrink-0">
            <Link
              to="/add"
              className="mobile-btn bg-sun text-white hover:bg-sun-600 shadow-sm flex-1 md:flex-none md:w-auto md:min-w-[9.5rem]"
            >
              <PlusCircle size={18} />
              Добавить
            </Link>

            <button
              type="button"
              className="mobile-btn border border-slate-200 bg-white hover:bg-slate-50 flex-1 md:flex-none md:w-auto md:min-w-[7.5rem]"
              onClick={onLogout}
            >
              <LogOut size={18} />
              Выйти
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-xl border bg-white/80 p-3 md:p-4">
          <div className="flex items-center justify-between gap-3 text-sm mb-2">
            <span className="font-medium text-slate-700">Заполненность профиля</span>
            <span className="font-bold tabular-nums text-sun">{completion.percent}%</span>
          </div>

          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sun to-sun-500 transition-all duration-500"
              style={{ width: `${completion.percent}%` }}
            />
          </div>

          {completion.percent < 100 && completion.hints[0] && (
            <Link
              to="/profile?tab=profile"
              className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-sun transition"
            >
              Следующий шаг: {completion.hints[0]}
              <ChevronRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
