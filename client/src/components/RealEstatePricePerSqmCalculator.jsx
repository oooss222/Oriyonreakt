import React from "react";
import { Calculator } from "lucide-react";
import { formatPriceInput, getPriceDigits } from "../data/specOptions";
import {
  calculatePricePerSqm,
  calculateTotalPriceFromPerSqm,
  formatPricePerSqmValue,
} from "../lib/realEstate";
import { useI18n } from "../i18n";
import { Button, Field, Input, SectionCard } from "../ui";

function PerSqmInput({ value, onChange, ...rest }) {
  return (
    <Input
      inputMode="decimal"
      value={value ? formatPriceInput(value) : ""}
      onChange={(e) => onChange(getPriceDigits(e.target.value))}
      {...rest}
    />
  );
}

function AreaInput({ value, onChange, ...rest }) {
  return (
    <Input
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
      {...rest}
    />
  );
}

export default function RealEstatePricePerSqmCalculator({
  pricePerSqmFrom = "",
  pricePerSqmTo = "",
  onChange,
  disabled = false,
}) {
  const { t } = useI18n();
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
        <Field label={t("realestate.from")}>
          {(props) => (
            <PerSqmInput
              {...props}
              disabled={disabled}
              placeholder={t("realestate.ppsqmFrom")}
              value={pricePerSqmFrom}
              onChange={(next) => onChange?.({ pricePerSqmFrom: next, pricePerSqmTo })}
            />
          )}
        </Field>

        <Field label={t("realestate.to")}>
          {(props) => (
            <PerSqmInput
              {...props}
              disabled={disabled}
              placeholder={t("realestate.ppsqmTo")}
              value={pricePerSqmTo}
              onChange={(next) => onChange?.({ pricePerSqmFrom, pricePerSqmTo: next })}
            />
          )}
        </Field>
      </div>

      <SectionCard
        title={t("realestate.ppsqmTitle")}
        icon={Calculator}
        headingLevel="h4"
        bodyClassName="space-y-5"
      >
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <Field label={t("realestate.ppsqmPrice")}>
              {(props) => (
                <PerSqmInput
                  {...props}
                  disabled={disabled}
                  value={objectPrice}
                  onChange={setObjectPrice}
                />
              )}
            </Field>

            <Field label={t("realestate.ppsqmArea")}>
              {(props) => (
                <AreaInput
                  {...props}
                  disabled={disabled}
                  value={objectArea}
                  onChange={setObjectArea}
                />
              )}
            </Field>
          </div>

          {derivedPerSqm ? (
            <div
              className="rounded-xl border border-sun-200 bg-sun-50 px-3 py-2.5"
              aria-live="polite"
            >
              <p className="text-2xs font-semibold uppercase tracking-wide text-sun-700">
                {t("realestate.ppsqmResult")}
              </p>
              <p className="font-display text-xl font-extrabold tracking-tight text-sun-900">
                {formatPricePerSqmValue(derivedPerSqm)}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" disabled={disabled} onClick={() => applyDerivedPerSqm("to")}>
                  {t("realestate.ppsqmApplyTo")}
                </Button>
                <Button size="sm" disabled={disabled} onClick={() => applyDerivedPerSqm("from")}>
                  {t("realestate.ppsqmApplyFrom")}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-ink-400">{t("realestate.ppsqmEmpty")}</p>
          )}
        </div>

        <div className="space-y-2.5">
          <p className="label-caps">{t("realestate.ppsqmBudget")}</p>

          <div className="grid grid-cols-2 gap-2">
            <Field label={t("realestate.ppsqmRange")}>
              {(props) => (
                <PerSqmInput
                  {...props}
                  disabled={disabled}
                  value={targetPerSqm}
                  onChange={setTargetPerSqm}
                />
              )}
            </Field>

            <Field label={t("realestate.ppsqmArea")}>
              {(props) => (
                <AreaInput
                  {...props}
                  disabled={disabled}
                  value={budgetArea}
                  onChange={setBudgetArea}
                />
              )}
            </Field>
          </div>

          {derivedTotalPrice ? (
            <div
              className="rounded-xl border border-sun-200 bg-sun-50 px-3 py-2.5"
              aria-live="polite"
            >
              <p className="text-2xs font-semibold uppercase tracking-wide text-sun-700">
                {t("realestate.ppsqmTotal")}
              </p>
              <p className="font-display text-xl font-extrabold tracking-tight text-sun-900">
                {formatPriceInput(String(derivedTotalPrice))} с.
              </p>
            </div>
          ) : (
            <p className="text-xs text-ink-400">{t("realestate.ppsqmTotalEmpty")}</p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
