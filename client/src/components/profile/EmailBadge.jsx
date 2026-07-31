import React from "react";
import { CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";

export default function EmailBadge({ status }) {
  if (status === "verified") {
    return (
      <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
        <CheckCircle2 size={14} />
        Верифицирован
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="px-2 py-0.5 text-xs rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
        <ShieldAlert size={14} />
        Письмо отправлено
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 text-xs rounded-full bg-slate-50 text-slate-700 border inline-flex items-center gap-1">
      <ShieldCheck size={14} />
      Не подтверждён
    </span>
  );
}
