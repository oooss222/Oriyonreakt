import React from "react";
import { CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";

export default function EmailBadge({ status }) {
  if (status === "verified") {
    return (
      <span className="px-2 py-0.5 text-xs rounded-md bg-lagoon/10 text-lagoon-700 border border-lagoon/15 inline-flex items-center gap-1">
        <CheckCircle2 size={14} />
        Верифицирован
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="px-2 py-0.5 text-xs rounded-md bg-sun-50 text-sun-700 border border-sun/20 inline-flex items-center gap-1">
        <ShieldAlert size={14} />
        Письмо отправлено
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 text-xs rounded-md bg-mist text-ink-500 border border-ink/8 inline-flex items-center gap-1">
      <ShieldCheck size={14} />
      Не подтверждён
    </span>
  );
}
