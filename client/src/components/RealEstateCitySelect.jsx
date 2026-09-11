import React from "react";
import { REAL_ESTATE_CITIES } from "../data/realEstate";
import { useI18n } from "../i18n";

export default function RealEstateCitySelect({
  value,
  onChange,
  className = "mobile-control",
  includeAny = false,
  anyLabel,
}) {
  const { t } = useI18n();
  const resolvedAnyLabel = anyLabel ?? t("realestate.citySelect.wholeCountry");
  return (
    <select value={value} onChange={onChange} className={className}>
      {includeAny && <option value="">{resolvedAnyLabel}</option>}
      {REAL_ESTATE_CITIES.map((city) => (
        <option key={city} value={city}>
          {city}
        </option>
      ))}
    </select>
  );
}
