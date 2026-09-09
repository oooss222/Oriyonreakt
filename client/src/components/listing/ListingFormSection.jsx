import React from "react";
import { Check } from "lucide-react";
import { cn } from "../../ui";
import { useI18n } from "../../i18n";

/**
 * Numbered composer section.
 *
 * Mirrors `SectionCard` visually but owns an id and a heading id so the
 * progress rail can jump to it and screen readers get `role="group"` +
 * `aria-labelledby`.
 */
export default function ListingFormSection({
  id,
  step,
  title,
  hint,
  icon: Icon,
  action,
  complete = false,
  optional = false,
  dataField,
  className = "",
  bodyClassName = "",
  children,
}) {
  const { t } = useI18n();
  const headingId = `${id}-title`;
  const showStep = complete || step != null;

  return (
    <section
      id={id}
      role="group"
      aria-labelledby={headingId}
      data-field={dataField}
      className={cn("card scroll-mt-20", className)}
    >
      <header className="listing-form-section__head">
        {showStep && (
          <span
            className={cn(
              "listing-form-section__step",
              complete && "listing-form-section__step--done"
            )}
            aria-hidden="true"
          >
            {complete ? <Check size={15} strokeWidth={3} /> : step}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="listing-form-section__title">
            {Icon && (
              <Icon
                size={16}
                strokeWidth={2.2}
                className="shrink-0 text-ink-400"
                aria-hidden="true"
              />
            )}
            <span className="min-w-0">{title}</span>
            {optional && (
              <span className="listing-form-section__optional">
                {t("composer.optional")}
              </span>
            )}
          </h2>
          {hint && <p className="listing-form-section__hint">{hint}</p>}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </header>

      <div className={cn("listing-form-section__body", bodyClassName)}>{children}</div>
    </section>
  );
}
