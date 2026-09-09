import React from "react";
import { RotateCcw } from "lucide-react";
import { Button, Skeleton, cn } from "../../ui";
import { useI18n } from "../../i18n";

/** Section heading used by every admin panel: eyebrow, title, blurb, action. */
export function SectionHeader({
  eyebrow,
  icon: Icon,
  title,
  description,
  action,
  headingLevel: Heading = "h2",
  className = "",
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="label-caps mb-1.5 flex items-center gap-1.5">
            {Icon && <Icon size={13} strokeWidth={2.4} aria-hidden="true" />}
            {eyebrow}
          </p>
        )}

        <Heading className="font-display text-lg font-bold text-ink-900 sm:text-xl">
          {title}
        </Heading>

        {description && (
          <p className="mt-1 max-w-2xl text-sm text-ink-400">{description}</p>
        )}
      </div>

      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
}

const ROLE_TONES = {
  super_admin: "info",
  admin: "sun",
  moderator: "info",
  accountant: "warning",
};

/** Badge tone for a staff role. The role name is always rendered next to it. */
export function roleTone(role) {
  return ROLE_TONES[role] || "neutral";
}

const TILE_TONES = {
  neutral: "border-ink-200 bg-mist-50 text-ink-900",
  sun: "border-sun-100 bg-sun-50 text-sun-800",
  success: "border-success-200 bg-success-50 text-success-800",
  warning: "border-warning-200 bg-warning-50 text-warning-800",
  danger: "border-danger-200 bg-danger-50 text-danger-800",
  info: "border-info-200 bg-info-50 text-info-800",
};

/** Single number with a label. The tone tints the tile, the label carries it. */
export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  className = "",
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-3 sm:p-4",
        TILE_TONES[tone] || TILE_TONES.neutral,
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium opacity-80">
        {Icon && <Icon size={14} strokeWidth={2.2} aria-hidden="true" />}
        <span className="min-w-0 truncate">{label}</span>
      </div>

      <div className="mt-1 font-display text-2xl font-bold">{value}</div>

      {hint && <div className="mt-1 text-xs opacity-75">{hint}</div>}
    </div>
  );
}

/**
 * Wide tables live in a labelled scroll region. `tabIndex` makes it reachable
 * for keyboard users who cannot drag it sideways.
 */
export function DataTable({
  label,
  minWidth = "48rem",
  scrollHeight,
  className = "",
  children,
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn(
        "overflow-auto overscroll-x-contain rounded-2xl border border-ink-200 bg-white",
        "outline-none focus-visible:ring-2 focus-visible:ring-sun/40",
        className
      )}
      style={scrollHeight ? { maxHeight: scrollHeight } : undefined}
    >
      <table
        className="w-full border-separate border-spacing-0 text-sm"
        style={{ minWidth }}
      >
        {children}
      </table>
    </div>
  );
}

/**
 * Sticky header cell. `border-separate` on the table keeps the divider visible
 * while the body scrolls under it.
 */
export function Th({ children, align = "left", className = "", ...rest }) {
  return (
    <th
      scope="col"
      className={cn(
        "sticky top-0 z-10 whitespace-nowrap bg-mist-50 px-3 py-2.5 text-2xs font-bold uppercase tracking-wide text-ink-500",
        align === "right" ? "text-right" : "text-left",
        className
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = "", ...rest }) {
  return (
    <td
      className={cn("border-t border-ink-200 px-3 py-3 align-top", className)}
      {...rest}
    >
      {children}
    </td>
  );
}

export function TableRow({ children, className = "", ...rest }) {
  return (
    <tr className={cn("transition-colors hover:bg-mist-50", className)} {...rest}>
      {children}
    </tr>
  );
}

/** Placeholder rows shaped like the table they replace. */
export function TableSkeleton({ label, rows = 6, columns = 4, minWidth }) {
  const { t } = useI18n();

  return (
    <>
      <p className="sr-only" role="status">
        {t("common.loading")}
      </p>

      <DataTable label={label} minWidth={minWidth}>
        <tbody>
          {Array.from({ length: rows }).map((_, row) => (
            <tr key={row}>
              {Array.from({ length: columns }).map((_, column) => (
                <td
                  key={column}
                  className={cn("px-3 py-3.5", row > 0 && "border-t border-ink-200")}
                >
                  <Skeleton className={cn("h-4", column === 0 ? "w-4/5" : "w-2/3")} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </DataTable>
    </>
  );
}

/** Card-shaped placeholders for list layouts (moderation queue, reports). */
export function CardListSkeleton({ count = 4, className = "" }) {
  const { t } = useI18n();

  return (
    <div className={cn("space-y-3", className)}>
      <p className="sr-only" role="status">
        {t("common.loading")}
      </p>

      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="surface-panel p-3 sm:p-4">
          <div className="flex gap-3">
            <Skeleton className="h-24 w-32 shrink-0" rounded="rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Filter row. Every control keeps its own label; the reset button stays
 * visible so it is obvious how to get back to the unfiltered list.
 */
export function FilterBar({
  label,
  children,
  onReset,
  resetDisabled = false,
  gridClassName = "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  className = "",
}) {
  const { t } = useI18n();

  return (
    <section
      aria-label={label || t("admin.filtersLabel")}
      className={cn("surface-muted p-3", className)}
    >
      <div className={cn("grid gap-3", gridClassName)}>{children}</div>

      {onReset && (
        <div className="mt-3 flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            icon={RotateCcw}
            onClick={onReset}
            disabled={resetDisabled}
          >
            {t("admin.reset")}
          </Button>
        </div>
      )}
    </section>
  );
}

/** "Показано: 25 из 400" plus the pager, on one line. */
export function ResultsBar({ children, pager, className = "" }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 text-sm text-ink-400 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p className="min-w-0">{children}</p>
      {pager}
    </div>
  );
}
