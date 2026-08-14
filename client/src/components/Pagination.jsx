import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getVisiblePages } from "../lib/pagination";
import { useI18n } from "../i18n";

function PageButton({ page, active, onClick, t }) {
  if (active) {
    return (
      <button
        type="button"
        onClick={() => onClick(page)}
        aria-current="page"
        aria-label={t("a11y.page", { page })}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white transition hover:bg-ink-700"
      >
        {page}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick(page)}
      aria-label={t("a11y.page", { page })}
      className="flex h-10 min-w-10 items-center justify-center px-1 text-sm font-semibold text-ink transition hover:text-sun"
    >
      {page}
    </button>
  );
}

function NavButton({ direction, disabled, onClick, t }) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  const label =
    direction === "prev" ? t("a11y.prevPage") : t("a11y.nextPage");

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
        disabled
          ? "cursor-not-allowed border-mist-200 text-mist-300"
          : "border-mist-300 text-ink hover:border-ink hover:bg-mist-50"
      }`}
    >
      <Icon size={18} strokeWidth={2.25} />
    </button>
  );
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}) {
  const { t } = useI18n();

  if (totalPages <= 1) return null;

  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <nav
      aria-label={t("a11y.pagination")}
      className={`flex items-center justify-center gap-3 sm:gap-4 ${className}`}
    >
      <NavButton
        direction="prev"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        t={t}
      />

      <div className="flex items-center gap-1 sm:gap-2">
        {pages.map((page) => (
          <PageButton
            key={page}
            page={page}
            active={page === currentPage}
            onClick={onPageChange}
            t={t}
          />
        ))}
      </div>

      <NavButton
        direction="next"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        t={t}
      />
    </nav>
  );
}
