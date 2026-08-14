import React from "react";
import { ArrowLeft, Loader2, Phone, User as UserIcon } from "lucide-react";
import {
  formatPhoneLocalDigits,
  isValidPhoneDigits,
  phoneDigitsToApi,
} from "../../lib/phoneUtils";
import OtpInput from "./OtpInput";
import {
  Field,
  Input,
  PolicyCheckbox,
  SubmitButton,
} from "./AuthUi";

export default function PhoneAuthFlow({
  mode,
  phoneStep,
  phoneDigits,
  onPhoneDigitsChange,
  phoneCode,
  onPhoneCodeChange,
  phoneName,
  onPhoneNameChange,
  phoneAgree,
  onPhoneAgreeChange,
  phoneDisplay,
  resendSec,
  loading,
  phoneRef,
  codeRef,
  onSendCode,
  onVerifyCode,
  onResendCode,
  onResetPhone,
  fieldHint = "",
}) {
  const isRegister = mode === "register";

  if (phoneStep === "phone") {
    return (
      <form onSubmit={onSendCode} className="space-y-5">
        <div className="auth-phone-hint">
          <Phone size={18} className="text-sun shrink-0" />
          <p>
            {isRegister
              ? "Отправим SMS с кодом подтверждения. Регистрация занимает около минуты."
              : "Введите номер — мы отправим код для входа без пароля."}
          </p>
        </div>

        <Field label="Номер телефона">
          <div className="auth-phone-row">
            <span className="auth-phone-prefix">+992</span>
            <Input
              ref={phoneRef}
              type="tel"
              inputMode="numeric"
              placeholder="90 123 45 67"
              value={formatPhoneLocalDigits(phoneDigits)}
              onChange={(e) =>
                onPhoneDigitsChange(
                  e.target.value.replace(/\D/g, "").slice(0, 9)
                )
              }
              autoComplete="tel"
              className="auth-phone-input"
            />
          </div>
          {phoneDigits.length > 0 && !isValidPhoneDigits(phoneDigits) && (
            <p className="text-xs text-red-600 mt-1">
              Номер должен начинаться с 9 и содержать 9 цифр
            </p>
          )}
          {fieldHint ? (
            <p className="auth-field-hint auth-field-hint--warn">{fieldHint}</p>
          ) : null}
        </Field>

        <SubmitButton
          loading={loading}
          loadingLabel={
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={18} />
              Отправляем…
            </span>
          }
          disabled={!isValidPhoneDigits(phoneDigits)}
        >
          Получить код
        </SubmitButton>
      </form>
    );
  }

  return (
    <form onSubmit={onVerifyCode} className="space-y-5">
      <button
        type="button"
        onClick={onResetPhone}
        className="auth-back-link"
      >
        <ArrowLeft size={16} />
        Изменить номер
      </button>

      <div className="auth-code-banner">
        <div className="auth-code-banner__title">Код отправлен</div>
        <div className="auth-code-banner__phone">
          {phoneDisplay || phoneDigitsToApi(phoneDigits)}
        </div>
      </div>

      <Field
        label="Код из SMS"
        hint={
          <p className="text-xs text-slate-500 mt-1">
            Введите 6 цифр из сообщения
          </p>
        }
      >
        <OtpInput
          value={phoneCode}
          onChange={onPhoneCodeChange}
          disabled={loading}
          inputRef={codeRef}
        />
      </Field>

      {isRegister ? (
        <>
          <Field label="Как к вам обращаться" icon={UserIcon}>
            <Input
              placeholder="Имя или ФИО"
              value={phoneName}
              onChange={(e) => onPhoneNameChange(e.target.value)}
              autoComplete="name"
              withIcon
            />
          </Field>

          <PolicyCheckbox
            id="phone-policy"
            checked={phoneAgree}
            onChange={onPhoneAgreeChange}
          />
        </>
      ) : null}

      <SubmitButton
        loading={loading}
        loadingLabel={
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={18} />
            {isRegister ? "Создаём…" : "Проверяем…"}
          </span>
        }
        disabled={phoneCode.length !== 6 || (isRegister && !phoneName.trim())}
      >
        {isRegister ? "Создать аккаунт" : "Войти"}
      </SubmitButton>

      <button
        type="button"
        onClick={onResendCode}
        disabled={resendSec > 0 || loading}
        className="auth-resend"
      >
        {resendSec > 0
          ? `Отправить код повторно через ${resendSec} сек`
          : "Отправить код повторно"}
      </button>
    </form>
  );
}
