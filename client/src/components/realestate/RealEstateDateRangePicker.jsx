import React from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { countNights } from "../../data/realEstate";
import {
  WEEKDAYS,
  addMonths,
  buildMonthGrid,
  compareIso,
  formatNightsLabel,
  formatShortDate,
  getDayRangeState,
  getInitialViewMonth,
  getMonthLabel,
  todayIso,
} from "../../lib/dateRange";
import { useI18n } from "../../i18n";
import { cn } from "../../ui";

function MonthGrid({ year, month, checkIn, checkOut, minIso, onPickDay }) {
  const cells = buildMonthGrid(year, month, minIso);

  return (
    <div className="min-w-0">
      <div className="mb-3 text-center text-sm font-semibold text-ink-800">
        {getMonthLabel(year, month)}
      </div>

      <div className="mb-1 grid grid-cols-7 gap-y-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-1 text-center text-2xs font-semibold uppercase tracking-wide text-ink-400"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((cell, index) => {
          if (!cell) {
            return <div key={`empty-${index}`} className="h-11" />;
          }

          const { isStart, isEnd, inRange } = getDayRangeState(
            cell.iso,
            checkIn,
            checkOut
          );
          const selected = isStart || isEnd;
          const inSelection = inRange || selected;

          return (
            <div
              key={cell.iso}
              className={cn(
                "relative h-11",
                inRange && "bg-sun-50",
                isStart && inRange && "rounded-l-xl",
                isEnd && inRange && "rounded-r-xl"
              )}
            >
              <button
                type="button"
                disabled={cell.disabled}
                aria-pressed={selected}
                onClick={() => onPickDay(cell.iso)}
                className={cn(
                  "absolute inset-0 flex w-full items-center justify-center rounded-xl text-sm font-medium transition-colors",
                  "disabled:cursor-not-allowed disabled:text-ink-300",
                  selected
                    ? "bg-sun-500 text-white shadow-xs"
                    : inSelection
                      ? "text-sun-800"
                      : cell.disabled
                        ? "text-ink-300"
                        : "text-ink-800 hover:bg-sun-50 hover:text-sun-800"
                )}
              >
                {cell.day}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarPanel({
  checkIn,
  checkOut,
  viewMonth,
  onViewMonthChange,
  onPickDay,
  minIso,
  t,
}) {
  const rightMonth = addMonths(viewMonth.year, viewMonth.month, 1);
  const minMonth = getInitialViewMonth();
  const nights = countNights(checkIn, checkOut);
  const canGoPrev =
    viewMonth.year > minMonth.year ||
    (viewMonth.year === minMonth.year && viewMonth.month > minMonth.month);

  const footerHint =
    checkIn && !checkOut
      ? t("realestate.chooseCheckOut")
      : formatNightsLabel(nights);

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-lg">
      <div className="relative mb-2">
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => onViewMonthChange(addMonths(viewMonth.year, viewMonth.month, -1))}
          className="btn btn-icon absolute left-0 top-0 z-10 rounded-full"
          aria-label={t("realestate.prevMonth")}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onViewMonthChange(addMonths(viewMonth.year, viewMonth.month, 1))}
          className="btn btn-icon absolute right-0 top-0 z-10 rounded-full"
          aria-label={t("realestate.nextMonth")}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>

        <div className="grid grid-cols-1 gap-6 pt-1 md:grid-cols-2 md:gap-8">
          <MonthGrid
            year={viewMonth.year}
            month={viewMonth.month}
            checkIn={checkIn}
            checkOut={checkOut}
            minIso={minIso}
            onPickDay={onPickDay}
          />
          <MonthGrid
            year={rightMonth.year}
            month={rightMonth.month}
            checkIn={checkIn}
            checkOut={checkOut}
            minIso={minIso}
            onPickDay={onPickDay}
          />
        </div>
      </div>

      <div
        className="mt-5 flex items-center justify-between gap-3 border-t border-dashed border-ink-200 pt-4 text-sm"
        aria-live="polite"
      >
        <span className="font-medium text-ink-600">{t("realestate.stayLength")}</span>
        <span
          className={cn(
            "font-semibold",
            checkIn && !checkOut ? "text-ink-500" : "text-sun-700"
          )}
        >
          {footerHint}
        </span>
      </div>
    </div>
  );
}

function useCalendarPosition(open, anchorRef) {
  const [style, setStyle] = React.useState(null);

  const computeStyle = React.useCallback(() => {
    if (!anchorRef.current) return null;

    const rect = anchorRef.current.getBoundingClientRect();
    const panelWidth = Math.min(720, window.innerWidth - 32);
    const centeredLeft = Math.max(16, (window.innerWidth - panelWidth) / 2);
    const anchoredLeft = Math.max(
      16,
      Math.min(rect.left, window.innerWidth - panelWidth - 16)
    );
    const left = rect.width < 320 ? centeredLeft : anchoredLeft;

    return {
      top: rect.bottom + 8,
      left,
      width: panelWidth,
    };
  }, [anchorRef]);

  React.useLayoutEffect(() => {
    if (!open) {
      setStyle(null);
      return undefined;
    }

    const update = () => {
      setStyle(computeStyle());
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, computeStyle]);

  return style;
}

function TriggerSegment({ caption, value, placeholder }) {
  return (
    <>
      <span className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-400">
        {caption}
      </span>
      <span
        className={cn(
          "truncate text-sm font-semibold leading-tight",
          value ? "text-ink-900" : "text-ink-400"
        )}
      >
        {value ? formatShortDate(value) : placeholder}
      </span>
    </>
  );
}

export default function RealEstateDateRangePicker({
  checkIn = "",
  checkOut = "",
  onChange,
  variant = "default",
  showLabel = false,
  label,
}) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const [viewMonth, setViewMonth] = React.useState(() => getInitialViewMonth(checkIn));
  const wrapperRef = React.useRef(null);
  const panelRef = React.useRef(null);
  const triggerRef = React.useRef(null);
  const panelId = React.useId();
  const minIso = todayIso();

  const fieldLabel = label || t("realestate.dates");

  React.useEffect(() => {
    if (!open) return;
    setViewMonth(getInitialViewMonth(checkIn));
  }, [open, checkIn]);

  React.useEffect(() => {
    if (!open) return undefined;

    const handleOutside = (event) => {
      const target = event.target;
      if (
        wrapperRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  // The panel is portalled to the end of <body>, so Tab from the trigger would
  // otherwise walk the whole page before reaching the calendar.
  React.useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector("button:not([disabled])")?.focus();
  }, [open]);

  const pickDay = (iso) => {
    if (compareIso(iso, minIso) < 0) return;

    if (!checkIn || (checkIn && checkOut)) {
      onChange?.({ checkIn: iso, checkOut: "" });
      return;
    }

    if (compareIso(iso, checkIn) <= 0) {
      onChange?.({ checkIn: iso, checkOut: "" });
      return;
    }

    onChange?.({ checkIn, checkOut: iso });
    setOpen(false);
    triggerRef.current?.focus();
  };

  const isInline = variant === "inline";
  const panelStyle = useCalendarPosition(open, triggerRef);
  const fallbackPanelStyle = React.useMemo(() => {
    if (!open) return null;
    return {
      top: 0,
      left: 16,
      width: Math.min(720, window.innerWidth - 32),
      visibility: "hidden",
    };
  }, [open]);

  const summary = [
    checkIn ? formatShortDate(checkIn) : t("realestate.selectDate"),
    checkOut ? formatShortDate(checkOut) : t("realestate.selectDate"),
  ].join(" — ");

  const calendar = open
    ? createPortal(
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label={fieldLabel}
          className="fixed"
          style={{ ...(panelStyle || fallbackPanelStyle), zIndex: "var(--z-dropdown)" }}
        >
          <CalendarPanel
            checkIn={checkIn}
            checkOut={checkOut}
            viewMonth={viewMonth}
            onViewMonthChange={setViewMonth}
            onPickDay={pickDay}
            minIso={minIso}
            t={t}
          />
        </div>,
        document.body
      )
    : null;

  if (isInline) {
    return (
      <>
        <div ref={wrapperRef} className="flex min-w-0 divide-x divide-ink-200">
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            aria-label={`${t("realestate.checkIn")}: ${
              checkIn ? formatShortDate(checkIn) : t("realestate.selectDate")
            }`}
            onClick={() => setOpen((value) => !value)}
            className={cn(
              "flex min-h-[3.25rem] min-w-0 flex-1 flex-col justify-center px-4 py-3 text-left transition-colors hover:bg-mist-50",
              open && "bg-sun-50"
            )}
          >
            <TriggerSegment
              caption={t("realestate.checkIn")}
              value={checkIn}
              placeholder={t("realestate.selectDate")}
            />
          </button>

          <button
            type="button"
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            aria-label={`${t("realestate.checkOut")}: ${
              checkOut ? formatShortDate(checkOut) : t("realestate.selectDate")
            }`}
            onClick={() => setOpen((value) => !value)}
            className={cn(
              "flex min-h-[3.25rem] min-w-0 flex-1 flex-col justify-center px-4 py-3 text-left transition-colors hover:bg-mist-50",
              open && "bg-sun-50"
            )}
          >
            <TriggerSegment
              caption={t("realestate.checkOut")}
              value={checkOut}
              placeholder={t("realestate.selectDate")}
            />
          </button>
        </div>

        {calendar}
      </>
    );
  }

  return (
    <>
      <div ref={wrapperRef} className="relative min-w-0">
        {showLabel && <span className="field-label">{fieldLabel}</span>}

        <button
          ref={triggerRef}
          type="button"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-label={`${fieldLabel}: ${summary}`}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "flex min-h-[3.25rem] w-full items-stretch rounded-xl border bg-white p-0 text-left text-sm transition-colors",
            open
              ? "border-sun-400 ring-2 ring-sun/25"
              : "border-ink-200 hover:border-ink-300"
          )}
        >
          <span className="flex min-w-0 flex-1 divide-x divide-ink-200">
            <span className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2">
              <TriggerSegment
                caption={t("realestate.checkIn")}
                value={checkIn}
                placeholder={t("realestate.selectDate")}
              />
            </span>

            <span className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2">
              <TriggerSegment
                caption={t("realestate.checkOut")}
                value={checkOut}
                placeholder={t("realestate.selectDate")}
              />
            </span>
          </span>

          <span className="flex w-10 shrink-0 items-center justify-center border-l border-ink-200 text-ink-400">
            <ChevronDown
              size={16}
              className={cn("transition-transform", open && "rotate-180")}
              aria-hidden="true"
            />
          </span>
        </button>
      </div>

      {calendar}
    </>
  );
}
