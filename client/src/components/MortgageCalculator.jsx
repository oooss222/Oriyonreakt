import React from "react";
import { Calculator } from "lucide-react";
import { formatPriceInput, getPriceDigits } from "../data/specOptions";

function formatMoney(value) {
  if (!Number.isFinite(value)) return "—";
  return `${Math.round(value).toLocaleString("ru-RU")} с.`;
}

export default function MortgageCalculator({ price = "" }) {
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
    <section className="card p-5 md:p-6 rounded-3xl space-y-4">
      <div className="flex items-center gap-2">
        <Calculator size={18} className="text-sun" />
        <h2 className="text-lg font-bold text-slate-900">Калькулятор ипотеки</h2>
      </div>

      <p className="text-sm text-slate-500">
        Примерный расчёт ежемесячного платежа. Точные условия уточняйте в банке.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Стоимость</span>
          <input
            value={amount ? formatPriceInput(amount) : ""}
            onChange={(e) => setAmount(getPriceDigits(e.target.value))}
            className="mt-1 w-full h-11 rounded-xl border px-3"
            placeholder="с."
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Первый взнос, %</span>
          <input
            type="number"
            min="0"
            max="90"
            value={downPct}
            onChange={(e) => setDownPct(e.target.value)}
            className="mt-1 w-full h-11 rounded-xl border px-3"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Срок, лет</span>
          <input
            type="number"
            min="1"
            max="30"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            className="mt-1 w-full h-11 rounded-xl border px-3"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Ставка, % годовых</span>
          <input
            type="number"
            min="0"
            max="40"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="mt-1 w-full h-11 rounded-xl border px-3"
          />
        </label>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-sun-50 border border-sun/20 p-4">
          <div className="text-xs text-sun-700 font-semibold">Платёж / мес</div>
          <div className="text-xl font-extrabold text-sun-900 mt-1">
            {formatMoney(result.monthly)}
          </div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-xs text-slate-500 font-semibold">Кредит</div>
          <div className="text-lg font-bold mt-1">{formatMoney(result.loan)}</div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-xs text-slate-500 font-semibold">Первый взнос</div>
          <div className="text-lg font-bold mt-1">{formatMoney(result.downPayment)}</div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-xs text-slate-500 font-semibold">Переплата</div>
          <div className="text-lg font-bold mt-1">{formatMoney(result.overpay)}</div>
        </div>
      </div>
    </section>
  );
}
