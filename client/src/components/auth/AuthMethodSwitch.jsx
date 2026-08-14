import React from "react";
import { Mail, Phone } from "lucide-react";

export default function AuthMethodSwitch({ value, onChange }) {
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
        Телефон
      </button>
      <button
        type="button"
        className={`auth-method-switch__btn ${
          value === "email" ? "auth-method-switch__btn--active" : ""
        }`}
        onClick={() => onChange("email")}
      >
        <Mail size={16} />
        Email
      </button>
    </div>
  );
}
