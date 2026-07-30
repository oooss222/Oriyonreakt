import React from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  Crown,
  Sparkles,
  TrendingUp,
  Zap,
  Eye,
  ArrowUp,
} from "lucide-react";
import { formatMoney } from "../lib/format";
import { getMinPromotionPrice } from "../lib/promotionPlans";
import PromotionPlanModal from "./PromotionPlanModal";

function formatUntil(until) {
  if (!until) return null;

  const date = new Date(until);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Benefit({ icon: Icon, children }) {
  return (
    <li className="flex items-start gap-2 text-xs text-slate-600">
      <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5 text-current opacity-80" />
      <span>{children}</span>
    </li>
  );
}

export default function ListingPromotionActions({
  listing,
  bumpPrice = 5,
  walletBalance = 0,
  onPromote,
  promoting = null,
  compact = false,
}) {
  const [planPickerType, setPlanPickerType] = React.useState(null);

  const vipActive = Boolean(listing?.vip);
  const topActive = Boolean(listing?.top);
  const listingId = listing?._id || listing?.id;
  const balance = Number(walletBalance || 0);
  const vipFromPrice = getMinPromotionPrice("vip");
  const topFromPrice = getMinPromotionPrice("top");

  const vipUntilLabel = formatUntil(listing?.vipUntil);
  const topUntilLabel = formatUntil(listing?.topUntil);
  const bumpedAtLabel = formatDateTime(listing?.bumpedAt);

  const vipBusy = promoting === `${listingId}-vip`;
  const topBusy = promoting === `${listingId}-top`;
  const bumpBusy = promoting === `${listingId}-bump`;

  const openPlanPicker = (type) => {
    if (promoting) return;
    setPlanPickerType(type);
  };

  const handlePlanConfirm = (type, days) => {
    setPlanPickerType(null);
    onPromote?.(type, days);
  };

  const planModal = (
    <PromotionPlanModal
      open={Boolean(planPickerType)}
      type={planPickerType}
      walletBalance={balance}
      confirming={
        planPickerType === "vip"
          ? vipBusy
          : planPickerType === "top"
          ? topBusy
          : false
      }
      onClose={() => setPlanPickerType(null)}
      onConfirm={handlePlanConfirm}
    />
  );

  if (compact) {
    return (
      <>
        <div className="rounded-2xl border border-sun-100 bg-gradient-to-br from-sun-50/80 to-white p-2 space-y-2">
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              disabled={Boolean(promoting)}
              onClick={() => openPlanPicker("vip")}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-60 ${
                vipActive
                  ? "border-amber-300 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900"
                  : "border-amber-200 bg-white text-amber-800 hover:bg-amber-50"
              }`}
            >
              <Crown className="w-4 h-4" />
              {vipBusy
                ? "Подключаем..."
                : vipActive
                ? `VIP до ${vipUntilLabel || "—"}`
                : `VIP от ${formatMoney(vipFromPrice)}`}
            </button>

            <button
              type="button"
              disabled={Boolean(promoting)}
              onClick={() => openPlanPicker("top")}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-60 ${
                topActive
                  ? "border-teal-300 bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-900"
                  : "border-teal-200 bg-white text-teal-800 hover:bg-teal-50"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              {topBusy
                ? "Подключаем..."
                : topActive
                ? `TOP до ${topUntilLabel || "—"}`
                : `TOP от ${formatMoney(topFromPrice)}`}
            </button>

            <button
              type="button"
              disabled={Boolean(promoting)}
              onClick={() => onPromote?.("bump")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
            >
              <CalendarClock className="w-4 h-4" />
              {bumpBusy
                ? "Обновляем..."
                : Number(bumpPrice) <= 0
                ? "Обновить дату · бесплатно"
                : bumpedAtLabel
                ? `Обновлено ${bumpedAtLabel}`
                : `Обновить дату · ${formatMoney(bumpPrice)}`}
            </button>
          </div>
        </div>
        {planModal}
      </>
    );
  }

  return (
    <>
      <div className="rounded-3xl border border-amber-100/80 bg-gradient-to-br from-white via-amber-50/30 to-teal-50/20 p-4 sm:p-5 space-y-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-sm font-bold text-ink">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </span>
            Продвиньте объявление
          </div>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            VIP и TOP выделяют объявление в ленте, привлекают больше просмотров
            и помогают продать быстрее.
          </p>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/80 px-3 py-2 text-xs text-slate-600 shadow-sm">
          Баланс:{" "}
          <span className="font-bold text-ink">
            {balance.toLocaleString("ru-RU")} TJS
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div
          className={`relative overflow-hidden rounded-2xl border-2 p-4 transition ${
            vipActive
              ? "border-amber-400 promotion-panel-vip shadow-[0_8px_28px_rgb(251_191_36/0.18)]"
              : "border-amber-200/80 bg-white hover:border-amber-300 hover:shadow-md"
          }`}
        >
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-300/25 blur-2xl" />

          <div className="relative space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white shadow-lg">
                  <Crown className="w-5 h-5" />
                </span>
                <div>
                  <div className="font-display text-lg font-extrabold text-amber-950">
                    VIP
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-amber-700/80">
                    Максимум внимания
                  </div>
                </div>
              </div>

              {vipActive && (
                <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                  Активно
                </span>
              )}
            </div>

            <ul className="space-y-1.5">
              <Benefit icon={Crown}>Золотой значок VIP на карточке</Benefit>
              <Benefit icon={Zap}>Первое место в ленте на выбранный срок</Benefit>
              <Benefit icon={Eye}>Больше просмотров и откликов</Benefit>
            </ul>

            <button
              type="button"
              disabled={Boolean(promoting)}
              onClick={() => openPlanPicker("vip")}
              className={`relative w-full overflow-hidden rounded-xl px-4 py-3 text-sm font-bold transition disabled:opacity-60 ${
                vipActive
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-[0_8px_24px_rgb(245_158_11/0.35)] hover:brightness-105"
              }`}
            >
              {vipBusy
                ? "Подключаем VIP..."
                : vipActive
                ? `VIP активен до ${vipUntilLabel || "—"}`
                : `Подключить VIP от ${formatMoney(vipFromPrice)}`}
            </button>
          </div>
        </div>

        <div
          className={`relative overflow-hidden rounded-2xl border-2 p-4 transition ${
            topActive
              ? "border-teal-400 promotion-panel-top shadow-[0_8px_28px_rgb(14_124_123/0.16)]"
              : "border-teal-200/80 bg-white hover:border-teal-300 hover:shadow-md"
          }`}
        >
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-teal-300/20 blur-2xl" />

          <div className="relative space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 via-lagoon to-teal-700 text-white shadow-lg">
                  <TrendingUp className="w-5 h-5" />
                </span>
                <div>
                  <div className="font-display text-lg font-extrabold text-teal-950">
                    TOP
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-teal-700/80">
                    Выше конкурентов
                  </div>
                </div>
              </div>

              {topActive && (
                <span className="rounded-full bg-lagoon px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                  Активно
                </span>
              )}
            </div>

            <ul className="space-y-1.5">
              <Benefit icon={ArrowUp}>Поднятие выше обычных объявлений</Benefit>
              <Benefit icon={TrendingUp}>Яркий TOP-значок на фото</Benefit>
              <Benefit icon={Sparkles}>Повышенная видимость на выбранный срок</Benefit>
            </ul>

            <button
              type="button"
              disabled={Boolean(promoting)}
              onClick={() => openPlanPicker("top")}
              className={`relative w-full overflow-hidden rounded-xl px-4 py-3 text-sm font-bold transition disabled:opacity-60 ${
                topActive
                  ? "bg-teal-50 text-teal-900 border border-teal-300"
                  : "bg-gradient-to-r from-teal-500 via-lagoon to-teal-700 text-white shadow-[0_8px_24px_rgb(14_124_123/0.32)] hover:brightness-105"
              }`}
            >
              {topBusy
                ? "Подключаем TOP..."
                : topActive
                ? `TOP активен до ${topUntilLabel || "—"}`
                : `Подключить TOP от ${formatMoney(topFromPrice)}`}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
            <CalendarClock className="w-4 h-4 text-slate-500" />
            Обновить дату
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Поднимает объявление среди обычных без VIP/TOP.
          </p>
        </div>

        <button
          type="button"
          disabled={Boolean(promoting)}
          onClick={() => onPromote?.("bump")}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white transition disabled:opacity-60 shrink-0"
        >
          {bumpBusy
            ? "Обновляем..."
            : Number(bumpPrice) <= 0
            ? "Обновить · бесплатно"
            : bumpedAtLabel
            ? `Обновлено ${bumpedAtLabel}`
            : `Обновить · ${formatMoney(bumpPrice)}`}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>Оплата списывается с кошелька Oriyon.</span>
        <Link to="/profile?tab=wallet" className="font-semibold text-sun-700 hover:underline">
          Пополнить кошелёк →
        </Link>
      </div>
      </div>
      {planModal}
    </>
  );
}
