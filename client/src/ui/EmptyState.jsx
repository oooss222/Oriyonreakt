import React from "react";
import { cn } from "./cn";
import Button from "./Button";

/**
 * Nothing-here state: says what happened and offers the next step.
 *
 * `bare` drops the surrounding panel for use inside a card that already has
 * its own border.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  actionVariant = "primary",
  secondaryAction,
  bare = false,
  className = "",
  children,
}) {
  return (
    <div
      className={cn(
        "text-center",
        bare ? "px-4 py-10" : "surface-panel px-6 py-10 sm:px-10 sm:py-12",
        className
      )}
    >
      {Icon && (
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-mist-100 text-ink-400 ring-1 ring-ink-200">
          <Icon size={24} strokeWidth={1.8} aria-hidden="true" />
        </div>
      )}

      {title && <h3 className="font-display text-lg font-bold text-ink-900">{title}</h3>}

      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">{description}</p>
      )}

      {children}

      {(actionLabel || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {actionLabel && (
            <Button
              variant={actionVariant === "primary" ? "primary" : "secondary"}
              to={actionTo}
              onClick={actionTo ? undefined : onAction}
            >
              {actionLabel}
            </Button>
          )}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
