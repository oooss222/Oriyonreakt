import React from "react";
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
        setSuccess(`Баланс пополнен на ${value.toLocaleString("ru-RU")} TJS`);
        setAmount("");
      } catch (e) {
        const message = e.message || t("wallet.topUpError");

        if (message.includes("HTTP 401")) {
          setError(t("wallet.sessionExpired"));
        } else if (
          message.includes("401") ||
          message.includes("доступ в транзакции отказан")
        ) {
          setError(
            "Alif отклонил оплату (401). Terminal 722796 нужно активировать и добавить callback в whitelist у Alif."
          );
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

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-xl border bg-slate-50 p-3 text-sm text-slate-600">{paymentHint}</div>

      {paymentConfig.environment === "test" && paymentConfig.alifEnabled && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-2">
          <div className="font-semibold">Тестовые данные Alif</div>
          <div>
            Карта: <span className="font-mono">5058270283789872</span> · OTP{" "}
            <span className="font-mono">12345</span>
          </div>
        </div>
      )}

      <div>
        <div className="text-sm font-medium mb-2">Быстрый выбор суммы</div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {QUICK_AMOUNTS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setAmount(String(item));
                setError("");
                setSuccess("");
              }}
              className={`mobile-btn border ${
                Number(amount) === item
                  ? "bg-sun text-white border-sun"
                  : "bg-white hover:bg-slate-50"
              }`}
            >
              {item} TJS
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <div className="text-sm font-medium mb-1">Сумма пополнения</div>
        <div className="relative">
          <input
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value.replace(/[^\d.,]/g, ""));
              setError("");
              setSuccess("");
            }}
            placeholder={t("wallet.amountPlaceholder")}
            className="mobile-control pr-14"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">TJS</span>
        </div>
      </label>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">{error}</div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 p-3 text-sm">
          {success}
        </div>
      )}

      <button
        disabled={loading || !isValid || configLoading}
        className="mobile-btn bg-sun text-white hover:bg-sun-600 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading
          ? paymentConfig.alifEnabled
            ? t("wallet.redirecting")
            : t("wallet.toppingUp")
          : paymentConfig.alifEnabled
            ? t("wallet.payAlif")
            : t("wallet.topUp")}
      </button>
    </form>
  );
});
