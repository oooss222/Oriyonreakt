import React from "react";
import {
  parseMultiSpecValue,
  RENT_RULE_SPECS,
} from "../../data/realEstate";
import { getSpecValue } from "../../lib/realEstate";
import { useI18n } from "../../i18n";

export default function RealEstateRentFeatures({ specs = [], compact = false }) {
  const { t } = useI18n();
  const appliances = parseMultiSpecValue(getSpecValue(specs, "Техника"));
  const rules = RENT_RULE_SPECS.map((name) => ({
    name,
    value: getSpecValue(specs, name),
  })).filter((row) => row.value);

  if (!appliances.length && !rules.length) return null;

  return (
    <section className={compact ? "space-y-2" : "space-y-3"}>
      {!compact ? (
        <h3 className="text-sm font-bold text-ink-900">{t("realestate.rentFeaturesTitle")}</h3>
      ) : null}

      {appliances.length > 0 ? (
        <div>
          {!compact ? (
            <div className="mb-1.5 text-2xs font-semibold uppercase tracking-wide text-ink-400">
              {t("realestate.appliances")}
            </div>
          ) : null}
          <ul className="flex flex-wrap gap-1.5">
            {appliances.map((item) => (
              <li
                key={item}
                className="inline-flex rounded-full bg-mist-100 px-2.5 py-1 text-2xs font-semibold text-ink-600"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {rules.length > 0 ? (
        <ul className={`flex flex-wrap gap-2 ${appliances.length ? "pt-0.5" : ""}`}>
          {rules.map(({ name, value }) => (
            <li
              key={name}
              className="inline-flex rounded-xl border border-ink-200 bg-white px-2.5 py-1 text-2xs font-medium text-ink-600"
            >
              {name}: {value}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
