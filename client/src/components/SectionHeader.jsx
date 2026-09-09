import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "../ui";

/**
 * Heading row shared by every feed section: icon, title, optional counter and
 * a "see all" link.
 */
export default function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  linkTo,
  linkLabel,
  headingLevel: Heading = "h2",
  id,
  className = "",
  children,
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && (
          <span className="icon-box-sun h-9 w-9 shrink-0">
            <Icon size={18} strokeWidth={2} aria-hidden="true" />
          </span>
        )}

        <div className="min-w-0">
          <Heading id={id} className="section-title truncate">
            {title}
          </Heading>
          {subtitle && <p className="text-xs text-ink-400">{subtitle}</p>}
        </div>
      </div>

      {children}

      {linkTo && (
        <Link
          to={linkTo}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold
                     text-ink-600 transition-colors hover:text-sun-700"
        >
          <span className="hidden sm:inline">{linkLabel}</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
