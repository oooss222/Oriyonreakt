import React from "react";
import { Check } from "lucide-react";
import { useI18n } from "../../i18n";

export default function ListingFormStepper({
  steps = [],
  current = 0,
  onSelect,
}) {
  const { t } = useI18n();
  const total = steps.length;
  const progress = total ? ((current + 1) / total) * 100 : 0;
  const currentStep = steps[current];

  return (
    <div className="listing-form-stepper">
      <div className="listing-form-stepper__mobile">
        <div className="listing-form-stepper__mobile-row">
          <span className="listing-form-stepper__mobile-label">
            {currentStep?.label}
          </span>
          <span className="listing-form-stepper__mobile-count">
            {t("listing.stepOf", { current: current + 1, total })}
          </span>
        </div>
        <div className="listing-form-stepper__bar" aria-hidden>
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <ol className="listing-form-stepper__list">
        {steps.map((item, index) => {
          const active = index === current;
          const done = item.ok && !active;
          const reachable = index <= current || item.ok || steps[index - 1]?.ok;

          return (
            <React.Fragment key={item.id}>
              {index > 0 ? (
                <span
                  className={`listing-form-stepper__line ${
                    steps[index - 1]?.ok || index <= current
                      ? "listing-form-stepper__line--on"
                      : ""
                  }`}
                  aria-hidden
                />
              ) : null}
              <li>
                <button
                  type="button"
                  onClick={() => reachable && onSelect?.(index)}
                  disabled={!reachable}
                  className={`listing-form-step ${
                    active
                      ? "listing-form-step--active"
                      : done
                        ? "listing-form-step--done"
                        : ""
                  }`}
                >
                  <span className="listing-form-step__index">
                    {done ? <Check size={14} strokeWidth={3} /> : index + 1}
                  </span>
                  <span className="listing-form-step__label">{item.label}</span>
                </button>
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </div>
  );
}
