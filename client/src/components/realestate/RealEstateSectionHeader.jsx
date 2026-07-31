import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function RealEstateSectionHeader({
  title,
  description,
  actionLabel,
  actionTo,
  icon: Icon,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={20} className="text-sun shrink-0" />}
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        </div>
        {description && (
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">{description}</p>
        )}
      </div>

      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex items-center gap-1 text-sm font-semibold text-sun hover:text-sun-600 shrink-0"
        >
          {actionLabel}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
