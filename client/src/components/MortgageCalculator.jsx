import React from "react";
import { Calculator } from "lucide-react";
import { formatPriceInput, getPriceDigits } from "../data/specOptions";
import { useI18n } from "../i18n";
import { Field, Input, SectionCard } from "../ui";

function formatMoney(value) {
  if (!Number.isFinite(value)) return "—";
  return `${Math.round(value).toLocaleString("ru-RU")} с.`;
}

function ResultTile({ label, value }) {
  return (
    <div className="surface-muted p-4">
      <p className="text-xs font-semibold text-ink-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-ink-900">{value}</p>
    </div>
  );
}

export default function MortgageCalculator({ price = "" }) {
  const { t } = useI18n();
  const initialPrice = getPriceDigits(price) || "";
  const [amount, setAmount] = React.useState(initialPrice);
  const [downPct, setDownPct] = React.useState("20");
  const [years, setYears] = React.useState("15");
  const [rate, setRate] = React.useState("14");

  React.useEffect(() => {
    if (initialPrice) setAmount(initialPrice);
  }, [initialPrice]);

  const result = React.useMemo(() => {
    const total = Number(String(amount).replace(/[^\d]/g, ""));
    const downPercent = Number(downPct) || 0;
    const termYears = Number(years) || 0;
    const annualRate = Number(rate) || 0;

    if (!total || !termYears) {
      return { monthly: null, loan: null, downPayment: null, overpay: null };
    }

    const downPayment = Math.round((total * downPercent) / 100);
    const loan = Math.max(0, total - downPayment);
    const monthlyRate = annualRate / 100 / 12;
    const months = termYears * 12;

    let monthly = 0;
    if (monthlyRate === 0) {
      monthly = loan / months;
    } else {
      monthly =
        (loan * monthlyRate * (1 + monthlyRate) ** months) /
        ((1 + monthlyRate) ** months - 1);
    }

    const overpay = monthly * months - loan;

    return { monthly, loan, downPayment, overpay };
  }, [amount, downPct, years, rate]);

  return (
    <SectionCard
      title={t("realestate.mortgageTitle")}
      description={t("realestate.mortgageHint")}
      icon={Calculator}
      bodyClassName="space-y-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("realestate.mortgagePrice")}>
          {(props) => (
            <Input
              {...props}
              inputMode="decimal"
              value={amount ? formatPriceInput(amount) : ""}
              onChange={(e) => setAmount(getPriceDigits(e.target.value))}
              placeholder="с."
            />
          )}
        </Field>

        <Field label={t("realestate.mortgageDown")}>
          {(props) => (
            <Input
              {...props}
              type="number"
              inputMode="decimal"
              min="0"
              max="90"
              value={downPct}
              onChange={(e) => setDownPct(e.target.value)}
            />
          )}
        </Field>

        <Field label={t("realestate.mortgageTerm")}>
          {(props) => (
            <Input
              {...props}
              type="number"
              inputMode="decimal"
              min="1"
              max="30"
              value={years}
              onChange={(e) => setYears(e.target.value)}
            />
          )}
        </Field>

        <Field label={t("realestate.mortgageRate")}>
          {(props) => (
            <Input
              {...props}
              type="number"
              inputMode="decimal"
              min="0"
              max="40"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          )}
        </Field>
      </div>

      <div
        className="rounded-2xl border border-sun-200 bg-sun-50 p-4 sm:p-5"
        aria-live="polite"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-sun-700">
          {t("realestate.mortgageMonthly")}
        </p>
        <p className="font-display text-3xl font-extrabold tracking-tight text-sun-900">
          {formatMoney(result.monthly)}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <ResultTile label={t("realestate.mortgageLoan")} value={formatMoney(result.loan)} />
        <ResultTile
          label={t("realestate.mortgageDownPayment")}
          value={formatMoney(result.downPayment)}
        />
        <ResultTile
          label={t("realestate.mortgageOverpay")}
          value={formatMoney(result.overpay)}
        />
      </div>
    </SectionCard>
  );
}
