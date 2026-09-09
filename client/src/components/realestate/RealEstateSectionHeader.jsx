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
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={20} className="shrink-0 text-sun-500" aria-hidden="true" />}
          <h2 className="section-title">{title}</h2>
        </div>
        {description && (
          <p className="section-subtitle mt-1 leading-relaxed">{description}</p>
        )}
      </div>

      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex min-h-[2.5rem] shrink-0 items-center gap-1 text-sm font-semibold text-sun-700 hover:text-sun-800"
        >
          {actionLabel}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
