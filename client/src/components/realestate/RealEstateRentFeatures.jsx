import React from "react";
import {
  parseMultiSpecValue,
  RENT_RULE_SPECS,
} from "../../data/realEstate";
import { getSpecValue } from "../../lib/realEstate";

export default function RealEstateRentFeatures({ specs = [], compact = false }) {
  const appliances = parseMultiSpecValue(getSpecValue(specs, "Техника"));
  const rules = RENT_RULE_SPECS.map((name) => ({
    name,
    value: getSpecValue(specs, name),
  })).filter((row) => row.value);

  if (!appliances.length && !rules.length) return null;

  return (
    <section className={compact ? "space-y-2" : "space-y-3"}>
      {!compact ? (
        <h3 className="text-sm font-bold text-ink">Условия аренды</h3>
      ) : null}

      {appliances.length > 0 ? (
        <div>
          {!compact ? (
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              Техника
            </div>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            {appliances.map((item) => (
              <span
                key={item}
                className="inline-flex rounded-full bg-mist px-2.5 py-1 text-[11px] font-semibold text-ink-600"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {rules.length > 0 ? (
        <div className={`flex flex-wrap gap-2 ${appliances.length ? "pt-0.5" : ""}`}>
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
