import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "./cn";
import { getVisiblePages } from "../lib/pagination";
import { useI18n } from "../i18n";

function NavButton({ direction, disabled, onClick, label }) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "grid h-11 w-11 place-items-center rounded-xl border transition-colors",
        disabled
          ? "cursor-not-allowed border-ink-200 text-ink-300"
          : "border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-mist-100"
      )}
    >
      <Icon size={18} strokeWidth={2.25} aria-hidden="true" />
    </button>
  );
}

/** Numbered pager for result lists. 44px targets throughout. */
export default function Pagination({ currentPage, totalPages, onPageChange, className = "" }) {
  const { t } = useI18n();

  if (totalPages <= 1) return null;

  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <nav
      aria-label={t("a11y.pagination")}
      className={cn("flex items-center justify-center gap-1.5 sm:gap-2", className)}
    >
      <NavButton
        direction="prev"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        label={t("a11y.prevPage")}
      />

      <div className="flex items-center gap-1">
        {pages.map((page) => {
          const active = page === currentPage;

          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={active ? "page" : undefined}
              aria-label={t("a11y.page", { page })}
              className={cn(
                "grid h-11 min-w-[2.75rem] place-items-center rounded-xl px-2 text-sm font-semibold transition-colors",
                active
                  ? "bg-ink-900 text-white"
                  : "text-ink-700 hover:bg-mist-100"
              )}
            >
              {page}
            </button>
          );
        })}
      </div>

      <NavButton
        direction="next"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        label={t("a11y.nextPage")}
      />
    </nav>
  );
}

/**
 * Prev / next with a page counter. Replaces the six hand-rolled copies in the
 * admin tables, where numbered pages are not useful.
 */
export function SimplePagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
  className = "",
}) {
  const { t } = useI18n();
  const total = Math.max(1, totalPages || 1);

  return (
    <nav
      aria-label={t("a11y.pagination")}
      className={cn("flex items-center justify-end gap-2", className)}
    >
      <button
        type="button"
        className="btn btn-sm"
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label={t("a11y.prevPage")}
      >
        <ChevronLeft size={15} aria-hidden="true" />
      </button>

      <span className="text-xs font-medium tabular text-ink-500">
        {page} / {total}
      </span>

      <button
        type="button"
        className="btn btn-sm"
        disabled={disabled || page >= total}
        onClick={() => onPageChange(page + 1)}
        aria-label={t("a11y.nextPage")}
      >
        <ChevronRight size={15} aria-hidden="true" />
      </button>
    </nav>
  );
}
