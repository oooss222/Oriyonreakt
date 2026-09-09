import React from "react";
import { CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "../../ui";
import { useI18n } from "../../i18n";

export default function EmailBadge({ status }) {
  const { t } = useI18n();

  if (status === "verified") {
    return (
      <Badge tone="success" icon={CheckCircle2}>
        {t("profile.emailStateVerified")}
      </Badge>
    );
  }

  if (status === "pending") {
    return (
      <Badge tone="warning" icon={ShieldAlert}>
        {t("profile.emailStatePending")}
      </Badge>
    );
  }

  return (
    <Badge tone="neutral" icon={ShieldCheck}>
      {t("profile.emailStateUnverified")}
    </Badge>
  );
}
