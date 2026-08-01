import React from "react";
import { REAL_ESTATE_CITIES } from "../data/realEstate";

export default function RealEstateCitySelect({
  value,
  onChange,
  className = "mobile-control",
  includeAny = false,
  anyLabel = "Вся страна",
}) {
  return (
    <select value={value} onChange={onChange} className={className}>
      {includeAny && <option value="">{anyLabel}</option>}
      {REAL_ESTATE_CITIES.map((city) => (
        <option key={city} value={city}>
          {city}
        </option>
      ))}
    </select>
  );
}
