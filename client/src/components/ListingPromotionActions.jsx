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
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
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
        <div className="grid grid-cols-1 gap-2 rounded-2xl border border-ink-200 bg-mist-50 p-2">
          <button
            type="button"
            disabled={Boolean(promoting)}
            onClick={() => openPlanPicker("vip")}
            className={`btn btn-sm ${
              vipActive ? "border-sun-300 bg-sun-50 text-sun-700" : ""
            }`}
          >
            <Crown className="h-4 w-4" aria-hidden />
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
            className={`btn btn-sm ${
              topActive ? "border-lagoon-300 bg-lagoon-50 text-lagoon-700" : ""
            }`}
          >
            <TrendingUp className="h-4 w-4" aria-hidden />
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
            className="btn btn-sm"
          >
            <CalendarClock className="h-4 w-4" aria-hidden />
            {bumpBusy
              ? t("promotion.bumpUpdating")
              : Number(bumpPrice) <= 0
                ? t("promotion.bumpFree")
                : bumpedAtLabel
                  ? t("promotion.bumpUpdated", { date: bumpedAtLabel })
                  : t("promotion.bumpPrice", { price: formatMoney(bumpPrice) })}
          </button>
        </div>
        {planModal}
      </>
    );
  }

  return (
    <>
      <section className="card space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="inline-flex items-center gap-2 text-base font-bold text-ink-900">
              <span className="icon-box-sun h-8 w-8">
                <Crown className="h-4 w-4" aria-hidden />
              </span>
              {t("promotion.title")}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-ink-400">
              {t("promotion.desc")}
            </p>
          </div>

          <p className="rounded-xl border border-ink-200 bg-mist-50 px-3 py-2 text-xs text-ink-500">
            {t("promotion.balance")}{" "}
            <span className="font-bold tabular-nums text-ink-900">
              {balance.toLocaleString("ru-RU")} TJS
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div
            className={`space-y-3 rounded-2xl border p-4 transition-colors ${
              vipActive
                ? "border-sun-300 bg-sun-50"
                : "border-ink-200 bg-white hover:border-sun-200"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sun-500 text-white">
                  <Crown className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-ink-900">
                    VIP
                  </h3>
                  <p className="label-caps text-sun-700">
                    {t("promotion.vipMaxAttention")}
                  </p>
                </div>
              </div>

              {vipActive && (
                <span className="badge">{t("promotion.active")}</span>
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
              className={`btn btn-lg btn-block ${
                vipActive ? "border-sun-300 text-sun-700" : "btn-primary"
              }`}
            >
              {vipBusy
                ? t("promotion.activatingVip")
                : vipActive
                  ? t("promotion.vipActiveUntil", { date: vipUntilLabel || "—" })
                  : t("promotion.connectVip", {
                      price: formatMoney(vipFromPrice),
                    })}
            </button>
          </div>

          <div
            className={`space-y-3 rounded-2xl border p-4 transition-colors ${
              topActive
                ? "border-lagoon-300 bg-lagoon-50"
                : "border-ink-200 bg-white hover:border-lagoon-200"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-lagoon-600 text-white">
                  <TrendingUp className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-ink-900">
                    TOP
                  </h3>
                  <p className="label-caps text-lagoon-700">
                    {t("promotion.topAbove")}
                  </p>
                </div>
              </div>

              {topActive && (
                <span className="badge badge-info">{t("promotion.active")}</span>
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
              className={`btn btn-lg btn-block ${
                topActive ? "border-lagoon-300 text-lagoon-700" : "btn-lagoon"
              }`}
            >
              {topBusy
                ? t("promotion.activatingTop")
                : topActive
                  ? t("promotion.topActiveUntil", { date: topUntilLabel || "—" })
                  : t("promotion.connectTop", {
                      price: formatMoney(topFromPrice),
                    })}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-ink-200 bg-mist-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-ink-900">
              <CalendarClock className="h-4 w-4 text-ink-400" aria-hidden />
              {t("promotion.bumpTitle")}
            </h3>
            <p className="mt-1 text-xs text-ink-400">{t("promotion.bumpDesc")}</p>
          </div>

          <button
            type="button"
            disabled={Boolean(promoting)}
            onClick={() => onPromote?.("bump")}
            className="btn shrink-0"
          >
            {bumpBusy
              ? t("promotion.bumpUpdating")
              : Number(bumpPrice) <= 0
                ? t("promotion.bumpFreeShort")
                : bumpedAtLabel
                  ? t("promotion.bumpUpdated", { date: bumpedAtLabel })
                  : t("promotion.bumpPriceShort", {
                      price: formatMoney(bumpPrice),
                    })}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-400">
          <span>{t("promotion.walletNote")}</span>
          <Link
            to="/profile?tab=wallet"
            className="font-semibold text-sun-700 hover:underline"
          >
            {t("promotion.topUpWallet")}
          </Link>
        </div>
      </section>
      {planModal}
    </>
  );
}
