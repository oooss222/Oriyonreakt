import React from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Sparkles, TrendingUp } from "lucide-react";
import { formatMoney } from "../lib/format";

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

export default function ListingPromotionActions({
  listing,
  vipPrice = 25,
  topPrice = 15,
  bumpPrice = 5,
  walletBalance = 0,
  onPromote,
  promoting = null,
  compact = false,
}) {
  const vipActive = Boolean(listing?.vip);
  const topActive = Boolean(listing?.top);
  const listingId = listing?._id || listing?.id;
  const balance = Number(walletBalance || 0);

  const vipUntilLabel = formatUntil(listing?.vipUntil);
  const topUntilLabel = formatUntil(listing?.topUntil);
  const bumpedAtLabel = formatDateTime(listing?.bumpedAt);

  const vipBusy = promoting === `${listingId}-vip`;
  const topBusy = promoting === `${listingId}-top`;
  const bumpBusy = promoting === `${listingId}-bump`;

  return (
    <div
      className={`rounded-2xl border border-sun-100 bg-gradient-to-br from-sun-50/80 to-white ${
        compact ? "p-2 space-y-2" : "p-4 space-y-3"
      }`}
    >
      {!compact && (
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-sun-700">
            <Sparkles className="w-3.5 h-3.5" />
            Продвижение
          </div>
          <p className="text-sm text-slate-600 mt-1">
            VIP — значок и приоритет на 7 дней. TOP — поднятие в ленте на 3 дня.
            Обновление даты поднимает объявление среди обычных.
          </p>
        </div>
      )}

      <div
        className={`grid gap-2 ${
          compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-3"
        }`}
      >
        <button
          type="button"
          disabled={Boolean(promoting)}
          onClick={() => onPromote?.("vip")}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border font-semibold transition disabled:opacity-60 ${
            compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"
          } ${
            vipActive
              ? "border-sun-300 bg-sun-100 text-sun-800"
              : "border-sun-200 bg-white text-sun-700 hover:bg-sun-50"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          {vipBusy
            ? "Подключаем..."
            : vipActive
            ? `VIP до ${vipUntilLabel || "—"}`
            : `VIP · ${formatMoney(vipPrice)}`}
        </button>

        <button
          type="button"
          disabled={Boolean(promoting)}
          onClick={() => onPromote?.("top")}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border font-semibold transition disabled:opacity-60 ${
            compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"
          } ${
            topActive
              ? "border-lagoon-300 bg-lagoon-50 text-lagoon-800"
              : "border-lagoon-200 bg-white text-lagoon-700 hover:bg-lagoon-50"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          {topBusy
            ? "Подключаем..."
            : topActive
            ? `TOP до ${topUntilLabel || "—"}`
            : `TOP · ${formatMoney(topPrice)}`}
        </button>

        <button
          type="button"
          disabled={Boolean(promoting)}
          onClick={() => onPromote?.("bump")}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border font-semibold transition disabled:opacity-60 ${
            compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"
          } border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
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

      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>Баланс: {balance.toLocaleString("ru-RU")} TJS</span>
          <Link to="/profile?tab=wallet" className="text-sun-700 hover:underline">
            Пополнить кошелёк
          </Link>
        </div>
      )}
    </div>
  );
}
