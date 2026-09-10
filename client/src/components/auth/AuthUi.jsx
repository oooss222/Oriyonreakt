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

/**
 * `describedBy` is merged with the ids Field generates, so a password can point
 * at a shared rules list without losing its own error and hint.
 */
export const PasswordField = React.forwardRef(function PasswordField(
  {
    label,
    toggleLabel,
    error,
    hint,
    visible,
    onToggleVisible,
    required = true,
    describedBy,
    ...inputProps
  },
  ref
) {
  const { t } = useI18n();

  return (
    <UiField label={label} error={error} hint={hint} required={required}>
      {({ id, invalid, "aria-describedby": fieldDescribedBy }) => (
        <UiInput
          ref={ref}
          id={id}
          type={visible ? "text" : "password"}
          invalid={invalid}
          aria-describedby={cn(fieldDescribedBy, describedBy) || undefined}
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
