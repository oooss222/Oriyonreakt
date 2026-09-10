import React from "react";
import { Keyboard, Lock, Mail, User as UserIcon } from "lucide-react";
import { useI18n } from "../../i18n";
import { Field, Input, cn } from "../../ui";
import { PasswordField, PolicyCheckbox, SubmitButton } from "./AuthUi";

function PasswordRequirement({ ok, label }) {
  return (
    <li
      className={cn(
        "flex items-center gap-1.5 text-xs",
        ok ? "font-medium text-success-700" : "text-ink-400"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          ok ? "bg-success-500" : "bg-ink-300"
        )}
      />
      {label}
    </li>
  );
}

function getPasswordChecks(password, t) {
  return [
    { ok: password.length >= 6, label: t("auth.pwdMinLength") },
    { ok: /[A-ZА-Я]/.test(password), label: t("auth.pwdUppercase") },
    { ok: /[0-9]/.test(password), label: t("auth.pwdDigit") },
    { ok: /[^A-Za-zА-Яа-я0-9]/.test(password), label: t("auth.pwdSpecial") },
  ];
}

function getStrengthMeta(password, t) {
  const checks = getPasswordChecks(password, t);
  const score = checks.filter((item) => item.ok).length;

  if (!password) {
    return { score: 0, label: "", className: "" };
  }

  if (score <= 1) return { score, label: t("auth.pwdWeak"), className: "auth-strength--weak" };
  if (score === 2) return { score, label: t("auth.pwdMedium"), className: "auth-strength--medium" };
  if (score === 3) return { score, label: t("auth.pwdGood"), className: "auth-strength--good" };
  return { score, label: t("auth.pwdGreat"), className: "auth-strength--great" };
}

export default function EmailRegisterForm({
  reg,
  onChange,
  loading,
  onSubmit,
  showPass,
  onTogglePass,
  showConfirm,
  onToggleConfirm,
  emailHint = "",
}) {
  const { t } = useI18n();
  const requirementsId = `${React.useId()}-password-rules`;
  const strength = getStrengthMeta(reg.password, t);
  const checks = getPasswordChecks(reg.password, t);
  const passwordsMatch =
    reg.confirm.length > 0 && reg.password === reg.confirm;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <p className="auth-note flex items-start gap-2">
        <Mail size={16} className="mt-px shrink-0 text-sun-600" aria-hidden="true" />
        <span>{t("auth.emailRegisterHint")}</span>
      </p>

      <Field label={t("auth.emailNameLabel")}>
        {({ id, "aria-describedby": describedBy }) => (
          <Input
            id={id}
            iconLeft={UserIcon}
            placeholder={t("auth.emailNamePlaceholder")}
            value={reg.name}
            onChange={(e) => onChange({ name: e.target.value })}
            autoComplete="name"
            aria-describedby={describedBy}
          />
        )}
      </Field>

      <Field
        label={t("auth.email")}
        hint={
          emailHint ? (
            <span className="font-medium text-warning-700">{emailHint}</span>
          ) : null
        }
      >
        {({ id, "aria-describedby": describedBy }) => (
          <Input
            id={id}
            type="email"
            iconLeft={Mail}
            placeholder="you@mail.tj"
            value={reg.email}
            onChange={(e) => onChange({ email: e.target.value })}
            autoComplete="email"
            aria-describedby={describedBy}
          />
        )}
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PasswordField
          label={t("auth.emailPasswordLabel")}
          toggleLabel={t("auth.emailPasswordToggle")}
          required={false}
          iconLeft={Lock}
          visible={showPass}
          onToggleVisible={onTogglePass}
          describedBy={requirementsId}
          placeholder={t("auth.emailPasswordPlaceholder")}
          value={reg.password}
          onChange={(e) => onChange({ password: e.target.value })}
          autoComplete="new-password"
        />

        <PasswordField
          label={t("auth.emailPasswordConfirmLabel")}
          toggleLabel={t("auth.emailPasswordConfirmToggle")}
          required={false}
          iconLeft={Lock}
          visible={showConfirm}
          onToggleVisible={onToggleConfirm}
          error={
            reg.confirm && !passwordsMatch ? t("auth.emailPasswordMismatch") : ""
          }
          hint={
            passwordsMatch ? (
              <span className="font-medium text-success-700">
                {t("auth.emailPasswordMatch")}
              </span>
            ) : null
          }
          placeholder={t("auth.emailPasswordConfirmPlaceholder")}
          value={reg.confirm}
          onChange={(e) => onChange({ confirm: e.target.value })}
          autoComplete="new-password"
        />
      </div>

      {reg.password ? (
        <div className={cn("auth-strength", strength.className)}>
          <div className="auth-strength__bar" aria-hidden="true">
            <span style={{ width: `${(strength.score / 4) * 100}%` }} />
          </div>
          <div className="auth-strength__label">{strength.label}</div>
        </div>
      ) : null}

      <ul id={requirementsId} className="flex flex-wrap gap-x-4 gap-y-1.5">
        {checks.map((item) => (
          <PasswordRequirement key={item.label} ok={item.ok} label={item.label} />
        ))}
      </ul>

      <PolicyCheckbox
        id="email-policy"
        checked={reg.agree}
        onChange={(agree) => onChange({ agree })}
      />

      <SubmitButton loading={loading} loadingLabel={t("auth.emailCreating")}>
        {t("auth.emailCreateAccount")}
      </SubmitButton>
    </form>
  );
}

export function EmailLoginForm({
  login,
  onChange,
  loading,
  onSubmit,
  showPass,
  onTogglePass,
  capsLock,
  onCapsLockChange,
  emailRef,
  emailHint = "",
}) {
  const { t } = useI18n();
  const capsLockId = `${React.useId()}-caps-lock`;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field
        label={t("auth.email")}
        hint={
          emailHint ? (
            <span className="font-medium text-warning-700">{emailHint}</span>
          ) : null
        }
      >
        {({ id, "aria-describedby": describedBy }) => (
          <Input
            ref={emailRef}
            id={id}
            type="email"
            iconLeft={Mail}
            placeholder="you@mail.tj"
            value={login.email}
            onChange={(e) => onChange({ email: e.target.value })}
            autoComplete="email"
            aria-describedby={describedBy}
          />
        )}
      </Field>

      <div>
        <PasswordField
          label={t("auth.emailPasswordLabel")}
          toggleLabel={t("auth.emailPasswordToggle")}
          required={false}
          iconLeft={Lock}
          visible={showPass}
          onToggleVisible={onTogglePass}
          describedBy={capsLock ? capsLockId : undefined}
          placeholder="••••••"
          value={login.password}
          onChange={(e) => onChange({ password: e.target.value })}
          onKeyUp={(e) => onCapsLockChange(e.getModifierState?.("CapsLock"))}
          autoComplete="current-password"
        />

        {/* Kept mounted so the warning is announced the moment Caps Lock goes on. */}
        <p id={capsLockId} className="text-xs" role="status" aria-live="polite">
          {capsLock ? (
            <span className="mt-1.5 inline-flex items-center gap-1.5 font-medium text-warning-700">
              <Keyboard size={13} aria-hidden="true" />
              {t("auth.emailCapsLock")}
            </span>
          ) : null}
        </p>
      </div>

      <SubmitButton loading={loading} loadingLabel={t("auth.emailSigningIn")}>
        {t("auth.emailSignIn")}
      </SubmitButton>
    </form>
  );
}
