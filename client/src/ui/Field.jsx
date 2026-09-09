import React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "./cn";

/**
 * Wires a label, a hint and an error message to a control.
 *
 * `children` receives the ids and validity flags it needs, so every form in the
 * app gets `htmlFor`/`aria-describedby`/`aria-invalid` without repeating the
 * plumbing.
 */
export default function Field({
  label,
  hint,
  error,
  required = false,
  htmlFor,
  id,
  className = "",
  labelClassName = "",
  children,
  ...rest
}) {
  const reactId = React.useId();
  const controlId = htmlFor || id || reactId;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = cn(errorId, hintId) || undefined;

  const control =
    typeof children === "function"
      ? children({
          id: controlId,
          "aria-describedby": describedBy,
          "aria-invalid": error ? true : undefined,
          "aria-required": required || undefined,
          invalid: Boolean(error),
        })
      : children;

  return (
    <div className={cn("min-w-0", className)} {...rest}>
      {label && (
        <label
          htmlFor={controlId}
          className={cn("field-label", required && "field-required", labelClassName)}
        >
          {label}
        </label>
      )}

      {control}

      {error && (
        <p id={errorId} className="field-error">
          <AlertCircle size={13} className="mt-px shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      {hint && !error && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
    </div>
  );
}
