import React from "react";
import { Link } from "react-router-dom";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  actionVariant = "primary",
}) {
  return (
    <div className="surface-panel p-8 sm:p-10 text-center">
      {Icon && (
        <div className="mx-auto w-14 h-14 rounded-2xl bg-sun-50 grid place-items-center mb-4 ring-1 ring-sun/15">
          <Icon className="text-sun" size={26} />
        </div>
      )}

      <h3 className="font-display font-semibold text-lg text-ink">{title}</h3>

      {description && (
        <p className="text-sm text-ink-400 mt-2 max-w-md mx-auto">{description}</p>
      )}

      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className={`btn mt-5 ${actionVariant === "primary" ? "btn-primary" : ""}`}
        >
          {actionLabel}
        </Link>
      )}

      {actionLabel && onAction && !actionTo && (
        <button
          type="button"
          onClick={onAction}
          className={`btn mt-5 ${actionVariant === "primary" ? "btn-primary" : ""}`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
