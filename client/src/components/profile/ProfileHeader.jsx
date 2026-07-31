import React from "react";
import { Link } from "react-router-dom";
import {
  User as UserIcon,
  LogOut,
  PlusCircle,
  Wallet,
  Sparkles,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import EmailBadge from "./EmailBadge";
import { calculateProfileCompletion } from "./profileUtils";

export default function ProfileHeader({
  me,
  role,
  emailStatus,
  walletBalance,
  unreadCount = 0,
  onOpenWallet,
  onOpenPromote,
  onLogout,
}) {
  const completion = calculateProfileCompletion(me, emailStatus);
  const userId = me?.id || me?._id;

  return (
    <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-slate-100 to-white border grid place-items-center shrink-0">
          <UserIcon className="text-slate-500" size={28} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <EmailBadge status={emailStatus} />
            <span className="px-2 py-0.5 text-xs rounded-full bg-sun-50 text-sun-700 border border-sun-100">
              {role}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold leading-tight break-words">
            {me?.name || "Без имени"}
          </h1>

          <p className="text-sm text-slate-500 mt-1 truncate">{me?.email}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 text-slate-600">
              <Wallet size={15} className="text-sun" />
              {walletBalance.toLocaleString("ru-RU")} TJS
            </span>

            {userId && (
              <Link
                to={`/seller/${userId}`}
                className="inline-flex items-center gap-1 text-sun font-semibold hover:text-sun-600"
              >
                <ExternalLink size={14} />
                Как меня видят
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-slate-50 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-medium text-slate-700">Заполненность профиля</span>
          <span className="font-bold text-sun">{completion.percent}%</span>
        </div>

        <div className="h-2 rounded-full bg-white overflow-hidden border">
          <div
            className="h-full bg-sun transition-all duration-500"
            style={{ width: `${completion.percent}%` }}
          />
        </div>

        {completion.percent < 100 && completion.hints[0] && (
          <p className="text-xs text-slate-500">Следующий шаг: {completion.hints[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Link to="/add" className="mobile-btn bg-sun text-white hover:bg-sun-600 shadow-sm">
          <PlusCircle size={18} />
          Добавить
        </Link>

        <Link to="/messages" className="mobile-btn border bg-white hover:bg-slate-50 relative">
          <MessageCircle size={18} />
          Сообщения
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-500 text-white text-[10px] grid place-items-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={onOpenWallet}
          className="mobile-btn border bg-white hover:bg-slate-50"
        >
          <Wallet size={18} />
          Кошелёк
        </button>

        <button
          type="button"
          onClick={onOpenPromote}
          className="mobile-btn border bg-white hover:bg-slate-50"
        >
          <Sparkles size={18} />
          Продвижение
        </button>
      </div>

      <button
        type="button"
        className="mobile-btn border border-slate-200 bg-white hover:bg-slate-50 w-full sm:w-auto"
        onClick={onLogout}
      >
        <LogOut size={18} />
        Выйти
      </button>
    </div>
  );
}
