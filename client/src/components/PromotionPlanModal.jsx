import React from "react";
import { X } from "lucide-react";
import { formatMoney } from "../lib/format";
import {
  getPromotionPlans,
  getPromotionPlan,
} from "../lib/promotionPlans";
import { useI18n, formatPromotionDaysLabel } from "../i18n";

export default function PromotionPlanModal({
  open,
  type,
  walletBalance = 0,
  onClose,
  onConfirm,
  confirming = false,
}) {
  const { t } = useI18n();
  const plans = React.useMemo(
    () => (open ? getPromotionPlans(type) : []),
    [open, type]
  );

  const [selectedDays, setSelectedDays] = React.useState(null);

  React.useEffect(() => {
    if (!open || !plans.length) return;
    setSelectedDays(plans[0].days);
  }, [open, type, plans]);

  if (!open || !type || !plans.length) {
    return null;
  }

  const selectedPlan = getPromotionPlan(type, selectedDays);
  const title = type === "vip" ? t("promotion.connectVipTitle") : t("promotion.connectTopTitle");
  const accent =
    type === "vip"
      ? "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50"
      : "border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promotion-plan-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label={t("common.close")}
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-md rounded-t-3xl sm:rounded-3xl border shadow-2xl ${accent}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/70 px-5 py-4">
          <div>
            <h2
              id="promotion-plan-title"
              className="text-lg font-bold text-ink"
            >
              {title}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {t("promotion.selectPeriod")}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border bg-white/80 p-2 text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-2 max-h-[50vh] overflow-y-auto">
          {plans.map((plan) => {
            const active = selectedDays === plan.days;

            return (
              <button
                key={plan.days}
                type="button"
                onClick={() => setSelectedDays(plan.days)}
                className={`w-full flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                  active
                    ? type === "vip"
                      ? "border-amber-400 bg-white shadow-sm ring-2 ring-amber-200"
                      : "border-teal-400 bg-white shadow-sm ring-2 ring-teal-200"
                    : "border-white/80 bg-white/70 hover:bg-white"
                }`}
              >
                <span className="font-semibold text-slate-900">
                  {formatPromotionDaysLabel(t, plan.days)}
                </span>
                <span className="font-bold text-ink">
                  {formatMoney(plan.price)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-white/70 px-5 py-4 space-y-3 bg-white/60 rounded-b-3xl">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>{t("promotion.walletBalance")}</span>
            <span className="font-semibold text-ink">
              {formatMoney(walletBalance)}
            </span>
          </div>

          <button
            type="button"
            disabled={!selectedPlan || confirming}
            onClick={() => onConfirm?.(type, selectedPlan.days)}
            className={`w-full rounded-xl px-4 py-3 text-sm font-bold text-white transition disabled:opacity-60 ${
              type === "vip"
                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600"
                : "bg-gradient-to-r from-teal-500 via-lagoon to-teal-700"
            }`}
          >
            {confirming
              ? t("promotion.activating")
              : selectedPlan
              ? t("promotion.pay", { price: formatMoney(selectedPlan.price) })
              : t("promotion.selectPeriodBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}
