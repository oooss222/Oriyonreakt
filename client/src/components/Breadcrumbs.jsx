import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useI18n } from "../i18n";

export default function Breadcrumbs({ items = [] }) {
  const { t } = useI18n();

  if (!items.length) return null;

  return (
    <nav
      aria-label={t("a11y.breadcrumbs")}
      className="flex flex-wrap items-center gap-1 text-sm text-ink-500"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 && (
              <ChevronRight size={14} className="shrink-0 text-ink-400" />
            )}

            {item.to && !isLast ? (
              <Link to={item.to} className="hover:text-sun transition">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-ink-700 font-medium" : ""}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
