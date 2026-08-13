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

const FIELD_LABEL =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500";

function MonthGrid({ year, month, checkIn, checkOut, minIso, onPickDay }) {
  const cells = buildMonthGrid(year, month, minIso);

  return (
    <div className="min-w-0">
      <div className="mb-3 text-center text-sm font-semibold text-slate-800">
        {getMonthLabel(year, month)}
      </div>

      <div className="mb-1 grid grid-cols-7 gap-y-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((cell, index) => {
          if (!cell) {
            return <div key={`empty-${index}`} className="h-10" />;
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
              className={`relative h-10 ${
                inRange ? "bg-sun-50" : ""
              } ${isStart && inRange ? "rounded-l-xl bg-sun-50" : ""} ${
                isEnd && inRange ? "rounded-r-xl bg-sun-50" : ""
              }`}
            >
              <button
                type="button"
                disabled={cell.disabled}
                onClick={() => onPickDay(cell.iso)}
                className={`absolute inset-0 mx-auto flex h-10 w-10 items-center justify-center text-sm font-medium transition disabled:cursor-not-allowed disabled:text-slate-300 ${
                  selected
                    ? "rounded-xl bg-sun text-white shadow-sm"
                    : inSelection
                      ? "text-sun-800"
                      : cell.disabled
                        ? "text-slate-300"
                        : "rounded-xl text-slate-800 hover:bg-sun-50 hover:text-sun-800"
                }`}
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
}) {
  const rightMonth = addMonths(viewMonth.year, viewMonth.month, 1);
  const minMonth = getInitialViewMonth();
  const nights = countNights(checkIn, checkOut);
  const canGoPrev =
    viewMonth.year > minMonth.year ||
    (viewMonth.year === minMonth.year && viewMonth.month > minMonth.month);

  const footerHint =
    checkIn && !checkOut
      ? "Выберите дату выезда"
      : formatNightsLabel(nights);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl ring-1 ring-black/5">
      <div className="relative mb-2">
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => onViewMonthChange(addMonths(viewMonth.year, viewMonth.month, -1))}
          className="absolute left-0 top-0 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft size={18} />
        </button>

        <button
          type="button"
          onClick={() => onViewMonthChange(addMonths(viewMonth.year, viewMonth.month, 1))}
          className="absolute right-0 top-0 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          aria-label="Следующий месяц"
        >
          <ChevronRight size={18} />
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

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-dashed border-slate-200 pt-4 text-sm">
        <span className="font-medium text-slate-600">Длительность проживания</span>
        <span
          className={`font-semibold ${
            checkIn && !checkOut ? "text-slate-500" : "text-sun-700"
          }`}
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

function DateRangeTrigger({
  triggerRef,
  open,
  checkIn,
  checkOut,
  onToggle,
  className = "",
}) {
  return (
    <button
      ref={triggerRef}
      type="button"
      aria-expanded={open}
      aria-haspopup="dialog"
      onClick={onToggle}
      className={`flex min-h-[52px] w-full items-stretch rounded-xl border bg-white p-0 text-left text-sm outline-none transition ${
        open
          ? "border-sun ring-2 ring-sun/20"
          : "border-slate-200/90 hover:border-slate-300 focus:border-sun/50 focus:ring-2 focus:ring-sun/20"
      } ${className}`}
    >
      <span className="flex min-w-0 flex-1 divide-x divide-slate-200">
        <span className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Заезд
          </span>
          <span
            className={`truncate text-sm font-semibold leading-tight ${
              checkIn ? "text-slate-900" : "text-slate-400"
            }`}
          >
            {checkIn ? formatShortDate(checkIn) : "Дата"}
          </span>
        </span>

        <span className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Выезд
          </span>
          <span
            className={`truncate text-sm font-semibold leading-tight ${
              checkOut ? "text-slate-900" : "text-slate-400"
            }`}
          >
            {checkOut ? formatShortDate(checkOut) : "Дата"}
          </span>
        </span>
      </span>

      <span className="flex w-10 shrink-0 items-center justify-center border-l border-slate-200 text-slate-400">
        <ChevronDown
          size={16}
          className={`transition ${open ? "rotate-180" : ""}`}
        />
      </span>
    </button>
  );
}

export default function RealEstateDateRangePicker({
  checkIn = "",
  checkOut = "",
  onChange,
  variant = "default",
  showLabel = false,
  label = "Даты проживания",
}) {
  const [open, setOpen] = React.useState(false);
  const [viewMonth, setViewMonth] = React.useState(() => getInitialViewMonth(checkIn));
  const wrapperRef = React.useRef(null);
  const panelRef = React.useRef(null);
  const triggerRef = React.useRef(null);
  const minIso = todayIso();

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
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
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

  const calendar =
    open
      ? createPortal(
          <div
            ref={panelRef}
            className="fixed z-[300]"
            style={panelStyle || fallbackPanelStyle}
          >
            <CalendarPanel
              checkIn={checkIn}
              checkOut={checkOut}
              viewMonth={viewMonth}
              onViewMonthChange={setViewMonth}
              onPickDay={pickDay}
              minIso={minIso}
            />
          </div>,
          document.body
        )
      : null;

  if (isInline) {
    return (
      <>
        <div ref={wrapperRef} className="flex min-w-0 divide-x divide-slate-200">
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={open}
            aria-haspopup="dialog"
            onClick={() => setOpen((value) => !value)}
            className={`flex min-w-0 flex-1 flex-col px-4 py-3.5 text-left transition hover:bg-slate-50/80 ${
              open ? "bg-sun-50/60" : ""
            }`}
          >
            <span className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Заезд
            </span>
            <span
              className={`truncate text-sm font-semibold leading-tight ${
                checkIn ? "text-slate-900" : "text-slate-400"
              }`}
            >
              {checkIn ? formatShortDate(checkIn) : "Выберите"}
            </span>
          </button>

          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className={`flex min-w-0 flex-1 flex-col px-4 py-3.5 text-left transition hover:bg-slate-50/80 ${
              open ? "bg-sun-50/60" : ""
            }`}
          >
            <span className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Выезд
            </span>
            <span
              className={`truncate text-sm font-semibold leading-tight ${
                checkOut ? "text-slate-900" : "text-slate-400"
              }`}
            >
              {checkOut ? formatShortDate(checkOut) : "Выберите"}
            </span>
          </button>
        </div>

        {calendar}
      </>
    );
  }

  return (
    <>
      <div ref={wrapperRef} className="relative min-w-0">
        {showLabel && <span className={FIELD_LABEL}>{label}</span>}

        <DateRangeTrigger
          triggerRef={triggerRef}
          open={open}
          checkIn={checkIn}
          checkOut={checkOut}
          onToggle={() => setOpen((value) => !value)}
        />
      </div>

      {calendar}
    </>
  );
}
