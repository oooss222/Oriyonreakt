import React from "react";
import { BadgeCheck, Building2 } from "lucide-react";
import { Badge } from "../ui";
import { sellerTypeLabel } from "../lib/businessAccount";
import { useI18n } from "../i18n";

export default function BusinessBadge({
  sellerType,
  businessVerified = false,
  size = "sm",
  className = "",
}) {
  const { t } = useI18n();

  if (sellerType !== "company") {
    return null;
  }

  const sizeClass = size === "lg" ? "px-2.5 py-1 text-xs" : "";

  if (businessVerified) {
    return (
      <Badge tone="info" icon={BadgeCheck} className={`${sizeClass} ${className}`}>
        {t("business.verifiedBadge")}
      </Badge>
    );
  }

  return (
    <Badge tone="neutral" icon={Building2} className={`${sizeClass} ${className}`}>
      {sellerTypeLabel("company")}
    </Badge>
  );
}
