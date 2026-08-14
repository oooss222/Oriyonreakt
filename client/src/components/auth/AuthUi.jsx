import React from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useI18n } from "../../i18n";

export const Field = ({ label, hint, icon: Icon, right, children }) => (
  <div className="space-y-1.5">
    {label && (
      <label className="text-sm font-medium text-slate-700">{label}</label>
    )}
    <div className="relative">
      {Icon && (
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <Icon size={18} />
        </span>
      )}
      {children}
      {right && (
        <span className="absolute inset-y-0 right-0 flex items-center pr-3">
          {right}
        </span>
      )}
    </div>
    {hint}
  </div>
);

export const Input = React.forwardRef(function AuthInput(
  { className = "", withIcon, withToggle, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      {...props}
      className={[
        "auth-input",
        withIcon ? "auth-input--icon" : "",
        withToggle ? "auth-input--toggle" : "",
        className,
      ].join(" ")}
    />
  );
});

export function Alert({ type = "error", children, actionLabel, onAction }) {
  if (!children) return null;

  const styles =
    type === "success"
      ? "auth-alert auth-alert--success"
      : "auth-alert auth-alert--error";
  const Icon = type === "success" ? CheckCircle2 : AlertTriangle;

  return (
    <div className={styles}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="text-sm space-y-2">
        <div>{children}</div>
        {actionLabel && onAction ? (
          <button type="button" className="auth-alert__action" onClick={onAction}>
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
    <button
      type="button"
      onClick={onToggle}
      className="text-slate-400 hover:text-slate-600 transition"
      aria-label={
        visible ? t("auth.hideField", { field: label }) : t("auth.showField", { field: label })
      }
    >
      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );
}

export function PolicyCheckbox({ checked, onChange, id = "auth-policy" }) {
  const { t } = useI18n();

  return (
    <label
      htmlFor={id}
      className={`auth-policy ${checked ? "auth-policy--checked" : ""}`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="auth-policy__input"
      />
      <span className="auth-policy__box" aria-hidden="true">
        {checked ? "✓" : ""}
      </span>
      <span>
        {t("auth.policyPrefix")}{" "}
        <Link to="/policy" className="text-sun font-medium hover:underline">
          {t("auth.policyLink")}
        </Link>{" "}
        {t("auth.policySuffix")}
      </span>
    </label>
  );
}

export function SubmitButton({ loading, loadingLabel, children, disabled }) {
  const { t } = useI18n();

  return (
    <button
      type="submit"
      className="auth-submit"
      disabled={loading || disabled}
    >
      {loading ? loadingLabel || t("common.loading") : children}
    </button>
  );
}
