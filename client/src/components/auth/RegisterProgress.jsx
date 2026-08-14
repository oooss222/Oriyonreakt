import React from "react";
import { CheckCircle2 } from "lucide-react";
import { useI18n } from "../../i18n";

export default function RegisterProgress({ authMethod, phoneStep }) {
  const { t } = useI18n();

  const phoneSteps = [
    { id: "phone", label: t("auth.progressPhone") },
    { id: "code", label: t("auth.progressCode") },
  ];

  const emailSteps = [{ id: "form", label: t("auth.progressAccount") }];

  const steps = authMethod === "phone" ? phoneSteps : emailSteps;
  const activeIndex =
    authMethod === "phone" ? (phoneStep === "code" ? 1 : 0) : 0;

  return (
    <ol className="auth-register-steps" aria-label={t("auth.progressAria")}>
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
