import React from "react";
import { Calculator } from "lucide-react";
import { formatPriceInput, getPriceDigits } from "../data/specOptions";
import {
  calculatePricePerSqm,
  calculateTotalPriceFromPerSqm,
  formatPricePerSqmValue,
} from "../lib/realEstate";

function PerSqmInput({ value, onChange, placeholder, disabled = false }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      disabled={disabled}
      placeholder={placeholder}
      value={value ? formatPriceInput(value) : ""}
      onChange={(e) => onChange(getPriceDigits(e.target.value))}
      className="mobile-control disabled:opacity-60"
    />
  );
}

export default function RealEstatePricePerSqmCalculator({
  pricePerSqmFrom = "",
  pricePerSqmTo = "",
  onChange,
  disabled = false,
}) {
  const [objectPrice, setObjectPrice] = React.useState("");
  const [objectArea, setObjectArea] = React.useState("");
  const [targetPerSqm, setTargetPerSqm] = React.useState("");
  const [budgetArea, setBudgetArea] = React.useState("");

  const derivedPerSqm = React.useMemo(
    () => calculatePricePerSqm(objectPrice, objectArea),
    [objectPrice, objectArea]
  );

  const derivedTotalPrice = React.useMemo(
    () => calculateTotalPriceFromPerSqm(targetPerSqm, budgetArea),
    [targetPerSqm, budgetArea]
  );

  const applyDerivedPerSqm = (mode) => {
    if (!derivedPerSqm) return;

    onChange?.({
      pricePerSqmFrom: mode === "from" ? String(derivedPerSqm) : pricePerSqmFrom,
      pricePerSqmTo: mode === "to" ? String(derivedPerSqm) : pricePerSqmTo,
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <PerSqmInput
          value={pricePerSqmFrom}
          onChange={(next) =>
            onChange?.({ pricePerSqmFrom: next, pricePerSqmTo })
          }
          placeholder="от, с./м²"
          disabled={disabled}
        />
        <PerSqmInput
          value={pricePerSqmTo}
          onChange={(next) =>
            onChange?.({ pricePerSqmFrom, pricePerSqmTo: next })
          }
          placeholder="до, с./м²"
          disabled={disabled}
        />
      </div>

      <div className="rounded-xl border border-ink/10 bg-mist p-3 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Calculator size={16} className="text-sun" />
          Калькулятор цены за м²
        </div>

        <div className="space-y-2">
          <div className="label-caps">Цена объекта и площадь</div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              inputMode="numeric"
              disabled={disabled}
              placeholder="Цена, с."
              value={objectPrice ? formatPriceInput(objectPrice) : ""}
              onChange={(e) => setObjectPrice(getPriceDigits(e.target.value))}
              className="mobile-control disabled:opacity-60"
            />
            <input
              type="text"
              inputMode="decimal"
              disabled={disabled}
              placeholder="Площадь, м²"
              value={objectArea}
              onChange={(e) =>
                setObjectArea(e.target.value.replace(/[^\d.,]/g, ""))
              }
              className="mobile-control disabled:opacity-60"
            />
          </div>

          {derivedPerSqm ? (
            <div className="rounded-lg border border-sun/20 bg-white px-3 py-2 text-sm text-ink">
              <span className="font-semibold text-sun-800">
                {formatPricePerSqmValue(derivedPerSqm)}
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => applyDerivedPerSqm("to")}
                  className="text-xs font-semibold text-sun-700 hover:text-sun-800 disabled:opacity-60"
                >
                  Подставить в «до»
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => applyDerivedPerSqm("from")}
                  className="text-xs font-semibold text-sun-700 hover:text-sun-800 disabled:opacity-60"
                >
                  Подставить в «от»
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Введите цену и площадь — рассчитаем стоимость квадратного метра.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Бюджет за м² и площадь
          </div>
          <div className="grid grid-cols-2 gap-2">
            <PerSqmInput
              value={targetPerSqm}
              onChange={setTargetPerSqm}
              placeholder="с./м²"
              disabled={disabled}
            />
            <input
              type="text"
              inputMode="decimal"
              disabled={disabled}
              placeholder="Площадь, м²"
              value={budgetArea}
              onChange={(e) =>
                setBudgetArea(e.target.value.replace(/[^\d.,]/g, ""))
              }
              className="mobile-control disabled:opacity-60"
            />
          </div>

          {derivedTotalPrice ? (
            <div className="rounded-lg border border-sun/20 bg-white px-3 py-2 text-sm text-slate-700">
              Итого:{" "}
              <span className="font-semibold text-sun-800">
                {formatPriceInput(String(derivedTotalPrice))} с.
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Покажем ориентировочную полную стоимость объекта.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
