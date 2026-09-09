import React from "react";
import { cn } from "./cn";

const PADDING = {
  none: "",
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6",
};

export default function Card({
  as: Tag = "div",
  padding = "md",
  interactive = false,
  className = "",
  children,
  ...rest
}) {
  return (
    <Tag
      className={cn("card", interactive && "card-interactive", PADDING[padding] ?? PADDING.md, className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Card with a titled header. Used for the settings, wallet, moderation and
 * composer sections that all hand-rolled the same header row.
 */
export function SectionCard({
  title,
  description,
  icon: Icon,
  action,
  headingLevel: Heading = "h2",
  bodyClassName = "",
  className = "",
  children,
}) {
  return (
    <section className={cn("card", className)}>
      {(title || action) && (
        <header className="flex items-start gap-3 border-b border-ink-200 px-4 py-3.5 sm:px-5">
          {Icon && (
            <span className="icon-box-ink mt-0.5 h-8 w-8 shrink-0">
              <Icon size={16} aria-hidden="true" />
            </span>
          )}

          <div className="min-w-0 flex-1">
            {title && <Heading className="text-base font-bold text-ink-900">{title}</Heading>}
            {description && <p className="mt-0.5 text-sm text-ink-400">{description}</p>}
          </div>

          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}

      <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
