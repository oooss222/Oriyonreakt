import React from "react";
import { ArrowDownLeft, ArrowUpRight, Receipt, TrendingUp, Wallet } from "lucide-react";
import { Alert, Button, EmptyState, SectionCard } from "../../ui";
import WalletTopUp from "./WalletTopUp";
import { WALLET_TYPE_LABELS } from "./profileUtils";
import { useI18n } from "../../i18n";

const LOW_BALANCE_THRESHOLD = 15;
const HISTORY_LIMIT = 10;

function formatAmount(value) {
  return Math.abs(value).toLocaleString("ru-RU", { maximumFractionDigits: 2 });
}

export default function WalletPanel({
  walletBalance,
  walletHistory,
  paymentReturnMessage,
  token,
  onWalletSuccess,
  onOpenPromote,
}) {
  const { t } = useI18n();
  const isLowBalance = walletBalance < LOW_BALANCE_THRESHOLD;
  const operations = walletHistory.slice(0, HISTORY_LIMIT);

  return (
    <div className="space-y-4 sm:space-y-5">
      {isLowBalance && (
        <Alert tone="warning" live={false} title={t("wallet.lowBalanceTitle")}>
          <p className="leading-relaxed">{t("wallet.lowBalanceDesc")}</p>
          <Button icon={TrendingUp} onClick={onOpenPromote} className="mt-3">
            {t("wallet.promotion")}
          </Button>
        </Alert>
      )}

      <SectionCard
        title={t("wallet.title")}
        description={t("wallet.topUpHint")}
        icon={Wallet}
        bodyClassName="space-y-5"
      >
        <div>
          <p className="text-sm text-ink-400">{t("wallet.balanceLabel")}</p>
          <p className="mt-1 font-display text-4xl font-extrabold tracking-tight text-ink-900 tabular-nums sm:text-5xl">
            {walletBalance.toLocaleString("ru-RU")}{" "}
            <span className="text-xl font-bold text-ink-400 sm:text-2xl">TJS</span>
          </p>
        </div>

        {paymentReturnMessage && <Alert tone="info">{paymentReturnMessage}</Alert>}

        <div className="divider" />

        <WalletTopUp token={token} onSuccess={onWalletSuccess} />
      </SectionCard>

      <SectionCard title={t("wallet.historyTitle")} icon={Receipt} bodyClassName="pt-2">
        {operations.length === 0 ? (
          <EmptyState
            bare
            icon={Receipt}
            title={t("wallet.historyEmpty")}
            description={t("wallet.historyEmptyHint")}
          />
        ) : (
          <ul className="divide-y divide-ink-200">
            {operations.map((operation) => {
              const amount = Number(operation.amount || 0);
              const credit = amount >= 0;
              const Icon = credit ? ArrowDownLeft : ArrowUpRight;

              return (
                <li
                  key={operation.id || operation._id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ${
                      credit
                        ? "bg-success-50 text-success-700 ring-success-200"
                        : "bg-mist-100 text-ink-600 ring-ink-200"
                    }`}
                  >
                    <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">
                      {WALLET_TYPE_LABELS[operation.type] ||
                        operation.description ||
                        t("wallet.operation")}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-400">
                      {operation.createdAt
                        ? new Date(operation.createdAt).toLocaleString("ru-RU")
                        : ""}
                    </p>
                  </div>

                  <p
                    className={`shrink-0 text-sm font-bold tabular-nums ${
                      credit ? "text-success-700" : "text-ink-900"
                    }`}
                  >
                    <span className="sr-only">
                      {credit ? t("wallet.credit") : t("wallet.debit")}{" "}
                    </span>
                    <span aria-hidden="true">{credit ? "+" : "−"}</span>
                    {formatAmount(amount)} TJS
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
