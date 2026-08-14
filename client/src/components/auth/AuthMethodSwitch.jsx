import React from "react";
import { Mail, Phone } from "lucide-react";
import { useI18n } from "../../i18n";

export default function AuthMethodSwitch({ value, onChange }) {
  const { t } = useI18n();

  return (
    <div className="auth-method-switch">
      <button
        type="button"
        className={`auth-method-switch__btn ${
          value === "phone" ? "auth-method-switch__btn--active" : ""
        }`}
        onClick={() => onChange("phone")}
      >
        <Phone size={16} />
        {t("auth.phone")}
      </button>
      <button
        type="button"
        className={`auth-method-switch__btn ${
          value === "email" ? "auth-method-switch__btn--active" : ""
        }`}
        onClick={() => onChange("email")}
      >
        <Mail size={16} />
        {t("auth.email")}
      </button>
    </div>
  );
}
