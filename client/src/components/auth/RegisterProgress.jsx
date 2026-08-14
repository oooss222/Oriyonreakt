import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function RegisterProgress({ authMethod, phoneStep }) {
  const phoneSteps = [
    { id: "phone", label: "Номер" },
    { id: "code", label: "Подтверждение" },
  ];

  const emailSteps = [{ id: "form", label: "Данные аккаунта" }];

  const steps = authMethod === "phone" ? phoneSteps : emailSteps;
  const activeIndex =
    authMethod === "phone"
      ? phoneStep === "code"
        ? 1
        : 0
      : 0;

  return (
    <ol className="auth-register-steps" aria-label="Шаги регистрации">
      {steps.map((step, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;

        return (
          <li
            key={step.id}
            className={`auth-register-steps__item ${
              done
                ? "auth-register-steps__item--done"
                : active
                  ? "auth-register-steps__item--active"
                  : ""
            }`}
          >
            <span className="auth-register-steps__dot">
              {done ? <CheckCircle2 size={14} /> : index + 1}
            </span>
            <span className="auth-register-steps__label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
