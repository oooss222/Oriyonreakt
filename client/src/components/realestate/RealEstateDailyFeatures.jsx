import React from "react";
import {
  parseMultiSpecValue,
  DAILY_RULE_SPECS,
} from "../../data/realEstate";
import { getSpecValue } from "../../lib/realEstate";

export default function RealEstateDailyFeatures({ specs = [], compact = false }) {
  const amenities = parseMultiSpecValue(getSpecValue(specs, "Удобства"));
  const rules = DAILY_RULE_SPECS.map((name) => ({
    name,
    value: getSpecValue(specs, name),
  })).filter((row) => row.value);

  if (!amenities.length && !rules.length) return null;

  return (
    <section className={compact ? "space-y-2" : "space-y-3"}>
      {!compact ? (
        <h3 className="text-sm font-bold text-ink">Удобства и правила</h3>
      ) : null}

      {amenities.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {amenities.map((item) => (
            <span
              key={item}
              className="inline-flex rounded-full bg-mist px-2.5 py-1 text-[11px] font-semibold text-ink-600"
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}

      {rules.length > 0 ? (
        <div className={`flex flex-wrap gap-2 ${amenities.length ? "pt-0.5" : ""}`}>
          {rules.map(({ name, value }) => (
            <span
              key={name}
              className="inline-flex rounded-xl border border-ink/10 bg-white px-2.5 py-1 text-[11px] font-medium text-ink-600"
            >
              {name}: {value}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
