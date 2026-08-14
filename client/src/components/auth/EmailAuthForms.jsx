import React from "react";
import { Keyboard, Loader2, Lock, Mail, User as UserIcon } from "lucide-react";
import { useI18n } from "../../i18n";
import {
  Field,
  Input,
  PasswordToggle,
  PolicyCheckbox,
  SubmitButton,
} from "./AuthUi";

function PasswordRequirement({ ok, label }) {
  return (
    <li className={`auth-password-req ${ok ? "auth-password-req--ok" : ""}`}>
      <span className="auth-password-req__dot" />
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
  const strength = getStrengthMeta(reg.password, t);
  const checks = getPasswordChecks(reg.password, t);
  const passwordsMatch =
    reg.confirm.length > 0 && reg.password === reg.confirm;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="auth-phone-hint">
        <Mail size={18} className="text-sun shrink-0" />
        <p>{t("auth.emailRegisterHint")}</p>
      </div>

      <Field label={t("auth.emailNameLabel")} icon={UserIcon}>
        <Input
          placeholder={t("auth.emailNamePlaceholder")}
          value={reg.name}
          onChange={(e) => onChange({ name: e.target.value })}
          autoComplete="name"
          withIcon
        />
      </Field>

      <Field label="Email" icon={Mail}>
        <Input
          type="email"
          placeholder="you@mail.tj"
          value={reg.email}
          onChange={(e) => onChange({ email: e.target.value })}
          autoComplete="email"
          withIcon
        />
        {emailHint ? (
          <p className="auth-field-hint auth-field-hint--warn">{emailHint}</p>
        ) : null}
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label={t("auth.emailPasswordLabel")}
          icon={Lock}
          right={
            <PasswordToggle
              visible={showPass}
              onToggle={onTogglePass}
              label={t("auth.emailPasswordToggle")}
            />
          }
        >
          <Input
            type={showPass ? "text" : "password"}
            placeholder={t("auth.emailPasswordPlaceholder")}
            value={reg.password}
            onChange={(e) => onChange({ password: e.target.value })}
            autoComplete="new-password"
            withIcon
            withToggle
          />
        </Field>

        <Field
          label={t("auth.emailPasswordConfirmLabel")}
          icon={Lock}
          right={
            <PasswordToggle
              visible={showConfirm}
              onToggle={onToggleConfirm}
              label={t("auth.emailPasswordConfirmToggle")}
            />
          }
        >
          <Input
            type={showConfirm ? "text" : "password"}
            placeholder={t("auth.emailPasswordConfirmPlaceholder")}
            value={reg.confirm}
            onChange={(e) => onChange({ confirm: e.target.value })}
            autoComplete="new-password"
            withIcon
            withToggle
          />
          {reg.confirm && !passwordsMatch && (
            <p className="text-xs text-red-600 mt-1">{t("auth.emailPasswordMismatch")}</p>
          )}
          {passwordsMatch && (
            <p className="text-xs text-emerald-600 mt-1">{t("auth.emailPasswordMatch")}</p>
          )}
        </Field>
      </div>

      {reg.password ? (
        <div className={`auth-strength ${strength.className}`}>
          <div className="auth-strength__bar">
            <span style={{ width: `${(strength.score / 4) * 100}%` }} />
          </div>
          <div className="auth-strength__label">{strength.label}</div>
        </div>
      ) : null}

      <ul className="auth-password-reqs">
        {checks.map((item) => (
          <PasswordRequirement key={item.label} ok={item.ok} label={item.label} />
        ))}
      </ul>

      <PolicyCheckbox
        id="email-policy"
        checked={reg.agree}
        onChange={(agree) => onChange({ agree })}
      />

      <SubmitButton
        loading={loading}
        loadingLabel={
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={18} />
            {t("auth.emailCreating")}
          </span>
        }
      >
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

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="Email" icon={Mail}>
        <Input
          ref={emailRef}
          type="email"
          placeholder="you@mail.tj"
          value={login.email}
          onChange={(e) => onChange({ email: e.target.value })}
          autoComplete="email"
          withIcon
        />
        {emailHint ? (
          <p className="auth-field-hint auth-field-hint--warn">{emailHint}</p>
        ) : null}
      </Field>

      <Field
        label={t("auth.emailPasswordLabel")}
        icon={Lock}
        right={
          <PasswordToggle
            visible={showPass}
            onToggle={onTogglePass}
            label={t("auth.emailPasswordToggle")}
          />
        }
      >
        <Input
          type={showPass ? "text" : "password"}
          placeholder="••••••"
          value={login.password}
          onChange={(e) => onChange({ password: e.target.value })}
          onKeyUp={(e) => onCapsLockChange(e.getModifierState?.("CapsLock"))}
          autoComplete="current-password"
          withIcon
          withToggle
        />
        {capsLock && (
          <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
            <Keyboard size={14} /> {t("auth.emailCapsLock")}
          </div>
        )}
      </Field>

      <SubmitButton
        loading={loading}
        loadingLabel={
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={18} />
            {t("auth.emailSigningIn")}
          </span>
        }
      >
        {t("auth.emailSignIn")}
      </SubmitButton>
    </form>
  );
}
