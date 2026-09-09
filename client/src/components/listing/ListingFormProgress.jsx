import React from "react";
import { Check } from "lucide-react";
import { cn } from "../../ui";
import { useI18n } from "../../i18n";

/**
 * Sticky rail that shows how much of the composer is filled in and jumps to a
 * section. Sections stay on the page, so this navigates rather than steps.
 */
export default function ListingFormProgress({ sections = [] }) {
  const { t } = useI18n();

  const required = sections.filter((section) => !section.optional);
  const total = required.length || 1;
  const done = required.filter((section) => section.complete).length;
  const percent = Math.round((done / total) * 100);

  const goToSection = (id) => {
    const target = typeof document === "undefined" ? null : document.getElementById(id);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "start" });

    const control = target.querySelector(
      "input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled])"
    );
    control?.focus({ preventScroll: true });
  };

  return (
    <nav className="listing-form-progress" aria-label={t("composer.progressTitle")}>
      <div className="flex items-center gap-3">
        <div
          className="listing-form-progress__track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-valuetext={t("composer.progressCount", { done, total })}
        >
          <span
            className="listing-form-progress__fill"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="listing-form-progress__count">
          {t("composer.progressCount", { done, total })}
        </p>
      </div>

      <ol className="listing-form-progress__list">
        {sections.map((section, index) => (
          <li key={section.id} className="shrink-0">
            <button
              type="button"
              onClick={() => goToSection(section.id)}
              className={cn(
                "listing-form-progress__step",
                section.complete && "listing-form-progress__step--done"
              )}
            >
              <span className="listing-form-progress__badge" aria-hidden="true">
                {section.complete ? <Check size={11} strokeWidth={3.5} /> : index + 1}
              </span>
              <span className="truncate">{section.title}</span>
              <span className="sr-only">
                {" — "}
                {section.optional
                  ? t("composer.optional")
                  : section.complete
                    ? t("composer.progressDone")
                    : t("composer.progressTodo")}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
