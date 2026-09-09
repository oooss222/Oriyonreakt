import React from "react";
import { Check } from "lucide-react";
import { useI18n } from "../../i18n";

export default function RegisterProgress({ step }) {
  const { t } = useI18n();
  const steps = [t("auth.progressPhone"), t("auth.progressCode")];
  const activeIndex = step === "code" ? 1 : 0;

  return (
    <ol className="auth-steps" aria-label={t("auth.progressAria")}>
      {steps.map((label, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;

        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className={`auth-steps__item ${
              done
                ? "auth-steps__item--done"
                : active
                  ? "auth-steps__item--active"
                  : ""
            }`}
          >
            <span className="auth-steps__dot">
              {done ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : index + 1}
            </span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}
