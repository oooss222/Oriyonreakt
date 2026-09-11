import React from "react";
import { TrendingUp, Wallet } from "lucide-react";
import WalletTopUp from "./WalletTopUp";
import { getWalletTypeLabels } from "./profileUtils";
import { useI18n } from "../../i18n";

const LOW_BALANCE_THRESHOLD = 15;

export default function WalletPanel({
  walletBalance,
  walletHistory,
  paymentReturnMessage,
  token,
  onWalletSuccess,
  onOpenPromote,
}) {
  const { t, lang } = useI18n();
  const numberLocale = lang === "en" ? "en-US" : lang === "tg" ? "tg-TJ" : "ru-RU";
  const isLowBalance = walletBalance < LOW_BALANCE_THRESHOLD;

  return (
    <div className="space-y-5">
      {isLowBalance && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <div className="font-semibold text-amber-900">{t("wallet.lowBalanceTitle")}</div>
            <p className="text-sm text-amber-800 mt-1">
              {t("wallet.lowBalanceDesc")}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenPromote}
            className="mobile-btn bg-sun text-white hover:bg-sun-600 shrink-0"
          >
            <TrendingUp size={18} />
            {t("home.promotionTitle")}
          </button>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sun-50 grid place-items-center">
            <Wallet className="text-sun" size={22} />
          </div>
          <div>
            <div className="text-sm text-slate-500">{t("promotion.walletBalance")}</div>
            <div className="text-3xl font-extrabold text-slate-900">
              {walletBalance.toLocaleString(numberLocale)} TJS
            </div>
          </div>
        </div>

        {paymentReturnMessage && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 text-blue-800 p-3 text-sm">
            {paymentReturnMessage}
          </div>
        )}

        <WalletTopUp token={token} onSuccess={onWalletSuccess} />
      </div>

      <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-3">
        <h3 className="text-lg font-semibold">{t("wallet.recentOperations")}</h3>

        {walletHistory.length === 0 ? (
          <div className="rounded-xl border bg-slate-50 p-5 text-center text-slate-500 text-sm">
            {t("wallet.noOperations")}
          </div>
        ) : (
          <div className="space-y-2">
            {walletHistory.slice(0, 10).map((operation) => (
              <div
                key={operation.id || operation._id}
                className="rounded-xl border p-3 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-medium text-sm">
                    {getWalletTypeLabels()[operation.type] ||
                      operation.description ||
                      t("wallet.operation")}
                  </div>
                  <div className="text-xs text-slate-500">
                    {operation.createdAt
                      ? new Date(operation.createdAt).toLocaleString(numberLocale)
                      : ""}
                  </div>
                </div>
                <div
                  className={`font-bold text-sm ${
                    Number(operation.amount || 0) >= 0 ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {Number(operation.amount || 0) >= 0 ? "+" : ""}
                  {Number(operation.amount || 0).toLocaleString(numberLocale)} TJS
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
