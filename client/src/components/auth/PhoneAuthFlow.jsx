import React from "react";
import { Phone, User as UserIcon } from "lucide-react";
import {
  formatPhoneLocalDigits,
  isValidPhoneDigits,
  phoneDigitsToApi,
} from "../../lib/phoneUtils";
import { useI18n } from "../../i18n";
import { Button, Field, Input } from "../../ui";
import OtpInput from "./OtpInput";
import { PolicyCheckbox, SubmitButton } from "./AuthUi";

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
    const phoneError =
      phoneDigits.length > 0 && !isValidPhoneDigits(phoneDigits)
        ? t("auth.phoneInvalid")
        : "";

    return (
      <form onSubmit={onSendCode} className="space-y-5">
        <p className="auth-note flex items-start gap-2">
          <Phone size={16} className="mt-px shrink-0 text-sun-600" aria-hidden="true" />
          <span>
            {isRegister ? t("auth.phoneRegisterHint") : t("auth.phoneLoginHint")}
          </span>
        </p>

        <Field
          label={t("auth.phoneLabel")}
          error={phoneError}
          hint={
            fieldHint ? (
              <span className="font-medium text-warning-700">{fieldHint}</span>
            ) : null
          }
        >
          {({ id, invalid, "aria-describedby": describedBy }) => (
            <div className="auth-phone-row">
              <span className="auth-phone-prefix">+992</span>
              <Input
                ref={phoneRef}
                id={id}
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
                invalid={invalid}
                aria-describedby={describedBy}
                className="auth-phone-input"
              />
            </div>
          )}
        </Field>

        <SubmitButton
          loading={loading}
          loadingLabel={t("auth.phoneSending")}
          disabled={!isValidPhoneDigits(phoneDigits)}
        >
          {t("auth.phoneGetCode")}
        </SubmitButton>
      </form>
    );
  }

  return (
    <form onSubmit={onVerifyCode} className="space-y-5">
      <div className="auth-code-target">
        <div className="min-w-0">
          <div className="text-xs text-ink-400">{t("auth.phoneCodeSent")}</div>
          <div className="auth-code-target__phone truncate">
            {phoneDisplay || phoneDigitsToApi(phoneDigits)}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={onResetPhone}
        >
          {t("auth.phoneChangeNumber")}
        </Button>
      </div>

      <Field label={t("auth.phoneCodeLabel")} hint={t("auth.phoneCodeHint")}>
        {({ id, invalid, "aria-describedby": describedBy }) => (
          <OtpInput
            id={id}
            value={phoneCode}
            onChange={onPhoneCodeChange}
            disabled={loading}
            inputRef={codeRef}
            invalid={invalid}
            describedBy={describedBy}
          />
        )}
      </Field>

      {isRegister ? (
        <>
          <Field label={t("auth.phoneNameLabel")}>
            {({ id, "aria-describedby": describedBy }) => (
              <Input
                id={id}
                iconLeft={UserIcon}
                placeholder={t("auth.phoneNamePlaceholder")}
                value={phoneName}
                onChange={(e) => onPhoneNameChange(e.target.value)}
                autoComplete="name"
                aria-describedby={describedBy}
              />
            )}
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
          isRegister ? t("auth.phoneCreating") : t("auth.phoneVerifying")
        }
        disabled={phoneCode.length !== 6 || (isRegister && !phoneName.trim())}
      >
        {isRegister ? t("auth.phoneCreateAccount") : t("auth.phoneSignIn")}
      </SubmitButton>

      {/* The countdown is the only feedback that a resend is throttled, so it
          has to reach screen readers too. */}
      <div className="text-center" aria-live="polite">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onResendCode}
          disabled={resendSec > 0 || loading}
        >
          {resendSec > 0
            ? t("auth.phoneResendWait", { sec: resendSec })
            : t("auth.phoneResend")}
        </Button>
      </div>
    </form>
  );
}
