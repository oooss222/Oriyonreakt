import React from "react";
import { ArrowLeft, Loader2, Phone, User as UserIcon } from "lucide-react";
import {
  formatPhoneLocalDigits,
  isValidPhoneDigits,
  phoneDigitsToApi,
} from "../../lib/phoneUtils";
import { useI18n } from "../../i18n";
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
  const { t } = useI18n();
  const isRegister = mode === "register";

  if (phoneStep === "phone") {
    return (
      <form onSubmit={onSendCode} className="space-y-5">
        <div className="auth-phone-hint">
          <Phone size={18} className="text-sun shrink-0" />
          <p>
            {isRegister ? t("auth.phoneRegisterHint") : t("auth.phoneLoginHint")}
          </p>
        </div>

        <Field label={t("auth.phoneLabel")}>
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
            <p className="text-xs text-red-600 mt-1">{t("auth.phoneInvalid")}</p>
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
              {t("auth.phoneSending")}
            </span>
          }
          disabled={!isValidPhoneDigits(phoneDigits)}
        >
          {t("auth.phoneGetCode")}
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
        {t("auth.phoneChangeNumber")}
      </button>

      <div className="auth-code-banner">
        <div className="auth-code-banner__title">{t("auth.phoneCodeSent")}</div>
        <div className="auth-code-banner__phone">
          {phoneDisplay || phoneDigitsToApi(phoneDigits)}
        </div>
      </div>

      <Field
        label={t("auth.phoneCodeLabel")}
        hint={
          <p className="text-xs text-slate-500 mt-1">{t("auth.phoneCodeHint")}</p>
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
          <Field label={t("auth.phoneNameLabel")} icon={UserIcon}>
            <Input
              placeholder={t("auth.phoneNamePlaceholder")}
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
            {isRegister ? t("auth.phoneCreating") : t("auth.phoneVerifying")}
          </span>
        }
        disabled={phoneCode.length !== 6 || (isRegister && !phoneName.trim())}
      >
        {isRegister ? t("auth.phoneCreateAccount") : t("auth.phoneSignIn")}
      </SubmitButton>

      <button
        type="button"
        onClick={onResendCode}
        disabled={resendSec > 0 || loading}
        className="auth-resend"
      >
        {resendSec > 0
          ? t("auth.phoneResendWait", { sec: resendSec })
          : t("auth.phoneResend")}
      </button>
    </form>
  );
}
