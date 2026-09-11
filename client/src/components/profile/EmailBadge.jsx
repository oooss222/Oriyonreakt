import React from "react";
import { CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import { useI18n } from "../../i18n";

export default function EmailBadge({ status }) {
  const { t } = useI18n();

  if (status === "verified") {
    return (
      <span className="px-2 py-0.5 text-xs rounded-md bg-lagoon/10 text-lagoon-700 border border-lagoon/15 inline-flex items-center gap-1">
        <CheckCircle2 size={14} />
        {t("profile.emailBadgeVerified")}
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="px-2 py-0.5 text-xs rounded-md bg-sun-50 text-sun-700 border border-sun/20 inline-flex items-center gap-1">
        <ShieldAlert size={14} />
        {t("profile.emailBadgePending")}
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 text-xs rounded-md bg-mist text-ink-500 border border-ink/8 inline-flex items-center gap-1">
      <ShieldCheck size={14} />
      {t("profile.emailBadgeUnverified")}
    </span>
  );
}
