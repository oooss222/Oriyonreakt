import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;

  return (
    <nav
      aria-label="Навигация"
      className="flex flex-wrap items-center gap-1 text-sm text-slate-500"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 && (
              <ChevronRight size={14} className="shrink-0 text-slate-400" />
            )}

            {item.to && !isLast ? (
              <Link to={item.to} className="hover:text-sun transition">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-slate-700 font-medium" : ""}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
