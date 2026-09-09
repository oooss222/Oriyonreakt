import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useI18n } from "../i18n";

export default function Breadcrumbs({ items = [] }) {
  const { t } = useI18n();

  if (!items.length) return null;

  return (
    <nav aria-label={t("a11y.breadcrumbs")}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-ink-400">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight size={14} className="shrink-0 text-ink-300" aria-hidden="true" />
              )}

              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="rounded transition-colors hover:text-sun-700"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={isLast ? "font-medium text-ink-700" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
