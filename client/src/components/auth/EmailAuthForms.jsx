import React from "react";
import { Keyboard, Loader2, Lock, Mail, User as UserIcon } from "lucide-react";
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

function getPasswordChecks(password) {
  return [
    { ok: password.length >= 6, label: "Не менее 6 символов" },
    { ok: /[A-ZА-Я]/.test(password), label: "Заглавная буква" },
    { ok: /[0-9]/.test(password), label: "Цифра" },
    { ok: /[^A-Za-zА-Яа-я0-9]/.test(password), label: "Спецсимвол (необяз.)" },
  ];
}

function getStrengthMeta(password) {
  const checks = getPasswordChecks(password);
  const score = checks.filter((item) => item.ok).length;

  if (!password) {
    return { score: 0, label: "", className: "" };
  }

  if (score <= 1) return { score, label: "Слабый", className: "auth-strength--weak" };
  if (score === 2) return { score, label: "Средний", className: "auth-strength--medium" };
  if (score === 3) return { score, label: "Хороший", className: "auth-strength--good" };
  return { score, label: "Отличный", className: "auth-strength--great" };
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
}) {
  const strength = getStrengthMeta(reg.password);
  const checks = getPasswordChecks(reg.password);
  const passwordsMatch =
    reg.confirm.length > 0 && reg.password === reg.confirm;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="auth-phone-hint">
        <Mail size={18} className="text-sun shrink-0" />
        <p>
          Создайте аккаунт по email — подойдёт, если не хотите использовать
          номер телефона.
        </p>
      </div>

      <Field label="Как к вам обращаться" icon={UserIcon}>
        <Input
          placeholder="Имя или ФИО"
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
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Пароль"
          icon={Lock}
          right={
            <PasswordToggle
              visible={showPass}
              onToggle={onTogglePass}
              label="пароль"
            />
          }
        >
          <Input
            type={showPass ? "text" : "password"}
            placeholder="Придумайте пароль"
            value={reg.password}
            onChange={(e) => onChange({ password: e.target.value })}
            autoComplete="new-password"
            withIcon
            withToggle
          />
        </Field>

        <Field
          label="Повтор пароля"
          icon={Lock}
          right={
            <PasswordToggle
              visible={showConfirm}
              onToggle={onToggleConfirm}
              label="повтор пароля"
            />
          }
        >
          <Input
            type={showConfirm ? "text" : "password"}
            placeholder="Повторите пароль"
            value={reg.confirm}
            onChange={(e) => onChange({ confirm: e.target.value })}
            autoComplete="new-password"
            withIcon
            withToggle
          />
          {reg.confirm && !passwordsMatch && (
            <p className="text-xs text-red-600 mt-1">Пароли не совпадают</p>
          )}
          {passwordsMatch && (
            <p className="text-xs text-emerald-600 mt-1">Пароли совпадают</p>
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
            Создаём…
          </span>
        }
      >
        Создать аккаунт
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
}) {
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
      </Field>

      <Field
        label="Пароль"
        icon={Lock}
        right={
          <PasswordToggle
            visible={showPass}
            onToggle={onTogglePass}
            label="пароль"
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
            <Keyboard size={14} /> Включён Caps Lock
          </div>
        )}
      </Field>

      <SubmitButton
        loading={loading}
        loadingLabel={
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={18} />
            Входим…
          </span>
        }
      >
        Войти
      </SubmitButton>
    </form>
  );
}
