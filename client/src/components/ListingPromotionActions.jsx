import React from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  Crown,
  TrendingUp,
  Zap,
  Eye,
  ArrowUp,
} from "lucide-react";
import { formatMoney } from "../lib/format";
import { getMinPromotionPrice } from "../lib/promotionPlans";
import PromotionPlanModal from "./PromotionPlanModal";
import { useI18n } from "../i18n";

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
    <li className="flex items-start gap-2 text-xs text-ink-500">
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
  const { t } = useI18n();
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
        <div className="rounded-2xl border border-ink/8 bg-mist/40 p-2 space-y-2">
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              disabled={Boolean(promoting)}
              onClick={() => openPlanPicker("vip")}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-60 ${
                vipActive
                  ? "border-sun/30 bg-sun-50 text-sun-700"
                  : "border-ink/10 bg-white text-ink-600 hover:border-sun/25 hover:bg-sun-50"
              }`}
            >
              <Crown className="w-4 h-4" />
              {vipBusy
                ? t("promotion.activating")
                : vipActive
                ? t("promotion.vipUntil", { date: vipUntilLabel || "—" })
                : t("promotion.vipFrom", { price: formatMoney(vipFromPrice) })}
            </button>

            <button
              type="button"
              disabled={Boolean(promoting)}
              onClick={() => openPlanPicker("top")}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-60 ${
                topActive
                  ? "border-lagoon/30 bg-lagoon/10 text-lagoon-700"
                  : "border-ink/10 bg-white text-ink-600 hover:border-lagoon/25 hover:bg-lagoon/5"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              {topBusy
                ? t("promotion.activating")
                : topActive
                ? t("promotion.topUntil", { date: topUntilLabel || "—" })
                : t("promotion.topFrom", { price: formatMoney(topFromPrice) })}
            </button>

            <button
              type="button"
              disabled={Boolean(promoting)}
              onClick={() => onPromote?.("bump")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs font-semibold text-ink-600 hover:bg-mist transition disabled:opacity-60"
            >
              <CalendarClock className="w-4 h-4" />
              {bumpBusy
                ? t("promotion.bumpUpdating")
                : Number(bumpPrice) <= 0
                ? t("promotion.bumpFree")
                : bumpedAtLabel
                ? t("promotion.bumpUpdated", { date: bumpedAtLabel })
                : t("promotion.bumpPrice", { price: formatMoney(bumpPrice) })}
            </button>
          </div>
        </div>
        {planModal}
      </>
    );
  }

  return (
    <>
      <div className="rounded-[1.35rem] border border-ink/8 bg-white p-4 sm:p-5 space-y-4 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-bold text-ink">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sun text-white">
                <Crown className="w-4 h-4" />
              </span>
              {t("promotion.title")}
            </div>
            <p className="text-sm text-ink-400 mt-2 max-w-2xl">{t("promotion.desc")}</p>
          </div>

          <div className="rounded-xl border border-ink/8 bg-mist/50 px-3 py-2 text-xs text-ink-500">
            {t("promotion.balance")}{" "}
            <span className="font-bold text-ink">
              {balance.toLocaleString("ru-RU")} TJS
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div
            className={`rounded-2xl border p-4 transition ${
              vipActive
                ? "border-sun/35 bg-sun-50/70"
                : "border-ink/8 bg-white hover:border-sun/25"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sun text-white">
                    <Crown className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="font-display text-lg font-extrabold text-ink">VIP</div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-sun-700">
                      {t("promotion.vipMaxAttention")}
                    </div>
                  </div>
                </div>

                {vipActive && (
                  <span className="rounded-md bg-sun px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                    {t("promotion.active")}
                  </span>
                )}
              </div>

              <ul className="space-y-1.5">
                <Benefit icon={Crown}>{t("promotion.vipBadge")}</Benefit>
                <Benefit icon={Zap}>{t("promotion.vipFirst")}</Benefit>
                <Benefit icon={Eye}>{t("promotion.vipViews")}</Benefit>
              </ul>

              <button
                type="button"
                disabled={Boolean(promoting)}
                onClick={() => openPlanPicker("vip")}
                className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition disabled:opacity-60 ${
                  vipActive
                    ? "bg-white text-sun-700 border border-sun/25"
                    : "btn btn-primary"
                }`}
              >
                {vipBusy
                  ? t("promotion.activatingVip")
                  : vipActive
                  ? t("promotion.vipActiveUntil", { date: vipUntilLabel || "—" })
                  : t("promotion.connectVip", { price: formatMoney(vipFromPrice) })}
              </button>
            </div>
          </div>

          <div
            className={`rounded-2xl border p-4 transition ${
              topActive
                ? "border-lagoon/35 bg-lagoon/5"
                : "border-ink/8 bg-white hover:border-lagoon/25"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-lagoon text-white">
                    <TrendingUp className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="font-display text-lg font-extrabold text-ink">TOP</div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-lagoon-700">
                      {t("promotion.topAbove")}
                    </div>
                  </div>
                </div>

                {topActive && (
                  <span className="rounded-md bg-lagoon px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                    {t("promotion.active")}
                  </span>
                )}
              </div>

              <ul className="space-y-1.5">
                <Benefit icon={ArrowUp}>{t("promotion.topRaise")}</Benefit>
                <Benefit icon={TrendingUp}>{t("promotion.topBadge")}</Benefit>
                <Benefit icon={Eye}>{t("promotion.topVisibility")}</Benefit>
              </ul>

              <button
                type="button"
                disabled={Boolean(promoting)}
                onClick={() => openPlanPicker("top")}
                className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition disabled:opacity-60 ${
                  topActive
                    ? "bg-white text-lagoon-700 border border-lagoon/25"
                    : "bg-lagoon text-white hover:bg-lagoon-600"
                }`}
              >
                {topBusy
                  ? t("promotion.activatingTop")
                  : topActive
                  ? t("promotion.topActiveUntil", { date: topUntilLabel || "—" })
                  : t("promotion.connectTop", { price: formatMoney(topFromPrice) })}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-ink/8 bg-mist/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
              <CalendarClock className="w-4 h-4 text-ink-400" />
              {t("promotion.bumpTitle")}
            </div>
            <p className="text-xs text-ink-400 mt-1">{t("promotion.bumpDesc")}</p>
          </div>

          <button
            type="button"
            disabled={Boolean(promoting)}
            onClick={() => onPromote?.("bump")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink-600 hover:border-ink/20 transition disabled:opacity-60 shrink-0"
          >
            {bumpBusy
              ? t("promotion.bumpUpdating")
              : Number(bumpPrice) <= 0
              ? t("promotion.bumpFreeShort")
              : bumpedAtLabel
              ? t("promotion.bumpUpdated", { date: bumpedAtLabel })
              : t("promotion.bumpPriceShort", { price: formatMoney(bumpPrice) })}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-400">
          <span>{t("promotion.walletNote")}</span>
          <Link to="/profile?tab=wallet" className="font-semibold text-sun-700 hover:underline">
            {t("promotion.topUpWallet")}
          </Link>
        </div>
      </div>
      {planModal}
    </>
  );
}
