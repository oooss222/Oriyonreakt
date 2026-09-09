import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import {
  Button,
  Checkbox,
  Field as UiField,
  IconButton,
  Input as UiInput,
  Spinner,
  cn,
} from "../../ui";
import { useI18n } from "../../i18n";

// The phone and email flows still compose a labelled row with an optional
// leading icon and a trailing control, so this wrapper keeps that contract.
export function Field({ label, hint, icon: Icon, right, error, children }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="field-label">{label}</label>}
      <div className="relative">
        {Icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 z-[1] flex items-center pl-3 text-ink-400">
            <Icon size={18} aria-hidden="true" />
          </span>
        )}
        {children}
        {right && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-1.5">
            {right}
          </span>
        )}
      </div>
      {error && <p className="field-error">{error}</p>}
      {hint}
    </div>
  );
}

export const Input = React.forwardRef(function AuthInput(
  { className = "", withIcon, withToggle, ...props },
  ref
) {
  return (
    <UiInput
      ref={ref}
      className={cn(withIcon && "pl-10", withToggle && "pr-11", className)}
      {...props}
    />
  );
});

export function Alert({ type = "error", children, actionLabel, onAction }) {
  if (!children) return null;

  const Icon = type === "success" ? CheckCircle2 : AlertTriangle;

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border p-3 text-sm",
        type === "success"
          ? "border-success-200 bg-success-50 text-success-800"
          : "border-danger-200 bg-danger-50 text-danger-800"
      )}
    >
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-2">
        <div>{children}</div>
        {actionLabel && onAction ? (
          <button
            type="button"
            className="text-sm font-semibold underline underline-offset-2"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function PasswordToggle({ visible, onToggle, label }) {
  const { t } = useI18n();

  return (
    <IconButton
      icon={visible ? EyeOff : Eye}
      variant="ghost"
      onClick={onToggle}
      label={
        label ||
        (visible ? t("auth.hidePassword") : t("auth.showPassword"))
      }
    />
  );
}

export const PasswordField = React.forwardRef(function PasswordField(
  {
    label,
    toggleLabel,
    error,
    hint,
    visible,
    onToggleVisible,
    required = true,
    ...inputProps
  },
  ref
) {
  const { t } = useI18n();

  return (
    <UiField label={label} error={error} hint={hint} required={required}>
      {({ id, invalid, "aria-describedby": describedBy }) => (
        <UiInput
          ref={ref}
          id={id}
          type={visible ? "text" : "password"}
          invalid={invalid}
          aria-describedby={describedBy}
          addonRight={
            <IconButton
              icon={visible ? EyeOff : Eye}
              variant="ghost"
              onClick={onToggleVisible}
              label={
                visible
                  ? t("auth.hideField", { field: toggleLabel })
                  : t("auth.showField", { field: toggleLabel })
              }
            />
          }
          {...inputProps}
        />
      )}
    </UiField>
  );
});

export function PolicyCheckbox({ id, checked, onChange, error }) {
  const { t } = useI18n();

  return (
    <UiField error={error} htmlFor={id}>
      {({ "aria-describedby": describedBy }) => (
        <Checkbox
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          label={
            <>
              {t("auth.policyPrefix")}{" "}
              <Link
                to="/policy"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-sun-700 underline underline-offset-2"
              >
                {t("auth.policyLink")}
              </Link>{" "}
              {t("auth.policySuffix")}
            </>
          }
        />
      )}
    </UiField>
  );
}

/**
 * The label keeps its box while the request is in flight, so the button never
 * changes size or reflows the form.
 */
export function SubmitButton({ loading, loadingLabel, disabled, children }) {
  return (
    <Button
      type="submit"
      variant="primary"
      size="lg"
      block
      className="relative"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      <span className={cn(loading && "invisible")}>{children}</span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner size="lg" label={loadingLabel} />
        </span>
      )}
    </Button>
  );
}
