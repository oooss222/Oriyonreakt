import React from "react";
import { Alert, Button, Chip, Input } from "../../ui";
import { api } from "../../lib/api";
import { useI18n } from "../../i18n";

export default React.memo(function WalletTopUp({ token, onSuccess }) {
  const { t } = useI18n();
  const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500];

  const [amount, setAmount] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [paymentConfig, setPaymentConfig] = React.useState({
    alifEnabled: false,
    directTopUpEnabled: false,
    environment: "test",
  });
  const [configLoading, setConfigLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;

    api
      .paymentConfig()
      .then((config) => {
        if (!alive || !config) return;

        setPaymentConfig({
          alifEnabled: Boolean(config.alifEnabled),
          directTopUpEnabled: Boolean(config.directTopUpEnabled),
          environment: config.environment || "test",
        });
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setConfigLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const value = React.useMemo(() => Number(String(amount).replace(",", ".")), [amount]);
  const isValid = Number.isFinite(value) && value > 0;

  const submit = React.useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      setSuccess("");

      if (!isValid) {
        setError(t("wallet.invalidAmount"));
        return;
      }

      if (value < 1) {
        setError(t("wallet.minAmount"));
        return;
      }

      if (value > 10000) {
        setError(t("wallet.maxAmount"));
        return;
      }

      try {
        setLoading(true);

        if (paymentConfig.alifEnabled) {
          const payment = await api.initAlifWalletTopUp(token, value);
          sessionStorage.setItem("alifPendingOrder", payment.orderId || "");

          if (payment?.checkout?.action && payment?.checkout?.fields) {
            const form = document.createElement("form");
            form.method = payment.checkout.method || "POST";
            form.action = payment.checkout.action;
            form.style.display = "none";

            Object.entries(payment.checkout.fields).forEach(([name, fieldValue]) => {
              const input = document.createElement("input");
              input.type = "hidden";
              input.name = name;
              input.value = String(fieldValue ?? "");
              form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();
            return;
          }

          if (payment?.paymentUrl) {
            window.location.href = payment.paymentUrl;
            return;
          }

          throw new Error(t("wallet.noPaymentLink"));
        }

        if (!paymentConfig.directTopUpEnabled) {
          throw new Error(t("wallet.paymentUnavailable"));
        }

        const user = await api.topUpWallet(token, value);
        onSuccess?.(user, {
          amount: value,
          type: "top_up",
          createdAt: new Date().toISOString(),
        });
        setSuccess(
          t("wallet.topUpSuccess", { amount: value.toLocaleString("ru-RU") })
        );
        setAmount("");
      } catch (e) {
        const message = e.message || t("wallet.topUpError");

        if (message.includes("HTTP 401")) {
          setError(t("wallet.sessionExpired"));
        } else if (
          message.includes("401") ||
          message.includes("доступ в транзакции отказан")
        ) {
          setError(t("wallet.alifDeclined"));
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    },
    [token, value, isValid, onSuccess, paymentConfig, t]
  );

  const paymentHint = React.useMemo(() => {
    if (configLoading) return t("wallet.loadingMethods");
    if (paymentConfig.alifEnabled) {
      return paymentConfig.environment === "test"
        ? t("wallet.alifTest")
        : t("wallet.alifLive");
    }
    if (paymentConfig.directTopUpEnabled) {
      return t("wallet.internalTest");
    }
    return t("wallet.unavailable");
  }, [configLoading, paymentConfig, t]);

  const submitLabel = loading
    ? paymentConfig.alifEnabled
      ? t("wallet.redirecting")
      : t("wallet.toppingUp")
    : paymentConfig.alifEnabled
      ? t("wallet.payAlif")
      : t("wallet.topUp");

  return (
    <form onSubmit={submit} className="space-y-4">
      <Alert tone="info" live={false}>
        {paymentHint}
      </Alert>

      {paymentConfig.environment === "test" && paymentConfig.alifEnabled && (
        <Alert tone="warning" live={false} title={t("wallet.alifTestTitle")}>
          <dl className="space-y-0.5">
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <dt>{t("wallet.cardLabel")}:</dt>
              <dd className="font-mono tabular-nums">5058270283789872</dd>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <dt>{t("wallet.otpLabel")}:</dt>
              <dd className="font-mono tabular-nums">12345</dd>
            </div>
          </dl>
        </Alert>
      )}

      <div role="group" aria-label={t("wallet.quickAmounts")}>
        <p className="field-label">{t("wallet.quickAmounts")}</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {QUICK_AMOUNTS.map((item) => {
            const active = Number(amount) === item;

            return (
              <Chip
                key={item}
                tone="sun"
                active={active}
                className="h-10 w-full px-2 tabular-nums"
                onClick={() => {
                  setAmount(String(item));
                  setError("");
                  setSuccess("");
                }}
              >
                {item} TJS
              </Chip>
            );
          })}
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="wallet-top-up-amount">
          {t("wallet.amountLabel")}
        </label>
        <Input
          id="wallet-top-up-amount"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value.replace(/[^\d.,]/g, ""));
            setError("");
            setSuccess("");
          }}
          placeholder={t("wallet.amountPlaceholder")}
          inputMode="decimal"
          className="tabular-nums"
          addonRight={
            <span className="pr-1.5 text-sm font-semibold text-ink-400">TJS</span>
          }
        />
      </div>

      {/* The region has to be in the DOM before the message lands, otherwise
          screen readers miss the change. */}
      <div aria-live="polite" className="empty:hidden">
        {error && (
          <Alert tone="danger" live={false}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert tone="success" live={false}>
            {success}
          </Alert>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        block
        loading={loading}
        disabled={loading || !isValid || configLoading}
      >
        {submitLabel}
      </Button>
    </form>
  );
});
