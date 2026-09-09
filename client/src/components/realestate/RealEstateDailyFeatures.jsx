import React from "react";
import {
  parseMultiSpecValue,
  DAILY_RULE_SPECS,
} from "../../data/realEstate";
import { getSpecValue } from "../../lib/realEstate";
import { useI18n } from "../../i18n";

export default function RealEstateDailyFeatures({ specs = [], compact = false }) {
  const { t } = useI18n();
  const amenities = parseMultiSpecValue(getSpecValue(specs, "Удобства"));
  const rules = DAILY_RULE_SPECS.map((name) => ({
    name,
    value: getSpecValue(specs, name),
  })).filter((row) => row.value);

  if (!amenities.length && !rules.length) return null;

  return (
    <section className={compact ? "space-y-2" : "space-y-3"}>
      {!compact ? (
        <h3 className="text-sm font-bold text-ink-900">{t("realestate.dailyFeaturesTitle")}</h3>
      ) : null}

      {amenities.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {amenities.map((item) => (
            <li
              key={item}
              className="inline-flex rounded-full bg-mist-100 px-2.5 py-1 text-2xs font-semibold text-ink-600"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : null}

      {rules.length > 0 ? (
        <ul className={`flex flex-wrap gap-2 ${amenities.length ? "pt-0.5" : ""}`}>
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
