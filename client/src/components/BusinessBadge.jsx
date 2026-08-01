import React from "react";
import { BadgeCheck, Building2 } from "lucide-react";
import { sellerTypeLabel } from "../lib/businessAccount";

export default function BusinessBadge({
  sellerType,
  businessVerified = false,
  size = "sm",
  className = "",
}) {
  if (sellerType !== "company") {
    return null;
  }

  const sizeClasses =
    size === "lg"
      ? "px-3 py-1 text-sm gap-1.5"
      : "px-2 py-0.5 text-[10px] gap-1";

  if (businessVerified) {
    return (
      <span
        className={`inline-flex items-center rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses} ${className}`}
      >
        <BadgeCheck className={size === "lg" ? "w-4 h-4" : "w-3 h-3"} />
        Проверенный премиум
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-100 ${sizeClasses} ${className}`}
    >
      <Building2 className={size === "lg" ? "w-4 h-4" : "w-3 h-3"} />
      {sellerTypeLabel("company")}
    </span>
  );
}
