import React from "react";

/** Label + control + hint/error wrapper for forms. */
export default function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className = "",
}) {
  const hasError = Boolean(error);

  return (
    <div className={`field ${hasError ? "field--error" : ""} ${className}`.trim()}>
      {label ? (
        <label className="field__label" htmlFor={htmlFor}>
          {label}
        </label>
      ) : null}
      {children}
      {hasError ? (
        <p className="field__error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field__hint">{hint}</p>
      ) : null}
    </div>
  );
}
