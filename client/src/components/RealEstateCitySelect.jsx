import React from "react";
import { REAL_ESTATE_CITIES } from "../data/realEstate";
import { cn } from "../ui";

export default function RealEstateCitySelect({
  value,
  onChange,
  className = "select",
  includeAny = false,
  anyLabel = "Вся страна",
  // Swallowed so `Field`'s render-prop payload can be spread onto this control.
  invalid,
  ...rest
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={cn(className, invalid && "select-invalid")}
      {...rest}
    >
      {includeAny && <option value="">{anyLabel}</option>}
      {REAL_ESTATE_CITIES.map((city) => (
        <option key={city} value={city}>
          {city}
        </option>
      ))}
    </select>
  );
}
