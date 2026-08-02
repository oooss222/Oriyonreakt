import React from "react";
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
const FIELD_CONTROL =
  "h-11 w-full rounded-xl border border-slate-200/90 bg-white text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

function MonthGrid({ year, month, checkIn, checkOut, minIso, onPickDay }) {
  const cells = buildMonthGrid(year, month, minIso);

  return (
    <div className="min-w-0">
      <div className="mb-3 text-center text-sm font-semibold text-slate-800">
        {getMonthLabel(year, month)}
      </div>

      <div className="grid grid-cols-7 gap-y-1 mb-1">
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
                inRange ? "bg-emerald-50" : ""
              } ${isStart && inRange ? "rounded-l-xl bg-emerald-50" : ""} ${
                isEnd && inRange ? "rounded-r-xl bg-emerald-50" : ""
              }`}
            >
              <button
                type="button"
                disabled={cell.disabled}
                onClick={() => onPickDay(cell.iso)}
                className={`absolute inset-0 mx-auto flex h-10 w-10 items-center justify-center text-sm font-medium transition disabled:cursor-not-allowed disabled:text-slate-300 ${
                  selected
                    ? "rounded-xl bg-emerald-500 text-white shadow-sm"
                    : inSelection
                      ? "text-emerald-700"
                      : cell.disabled
                        ? "text-slate-300"
                        : "rounded-xl text-slate-800 hover:bg-emerald-50 hover:text-emerald-700"
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
  const canGoPrev =
    viewMonth.year > minMonth.year ||
    (viewMonth.year === minMonth.year && viewMonth.month > minMonth.month);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 pt-1">
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
        <span className="font-semibold text-emerald-600">
          {formatNightsLabel(countNights(checkIn, checkOut))}
        </span>
      </div>
    </div>
  );
}

export default function RealEstateDateRangePicker({
  checkIn = "",
  checkOut = "",
  onChange,
  compact = false,
  label = "Заезд — выезд",
}) {
  const [open, setOpen] = React.useState(false);
  const [viewMonth, setViewMonth] = React.useState(() => getInitialViewMonth(checkIn));
  const rootRef = React.useRef(null);
  const minIso = todayIso();

  React.useEffect(() => {
    if (!open) return;
    setViewMonth(getInitialViewMonth(checkIn));
  }, [open, checkIn]);

  React.useEffect(() => {
    if (!open) return undefined;

    const handleOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
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

  const openCalendar = () => setOpen(true);

  const calendar = open ? (
    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 md:left-auto md:right-0 md:w-[min(720px,calc(100vw-2rem))]">
      <CalendarPanel
        checkIn={checkIn}
        checkOut={checkOut}
        viewMonth={viewMonth}
        onViewMonthChange={setViewMonth}
        onPickDay={pickDay}
        minIso={minIso}
      />
    </div>
  ) : null;

  return (
    <div ref={rootRef} className="relative min-w-0">
      {!compact && <span className={FIELD_LABEL}>{label}</span>}

      <button
        type="button"
        aria-expanded={open}
        onClick={openCalendar}
        className={`${FIELD_CONTROL} flex h-11 items-stretch overflow-hidden p-0 text-left`}
      >
        <span className="flex min-w-0 flex-1 divide-x divide-slate-200">
          <span className="flex min-w-0 flex-1 flex-col justify-center px-3 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Заезд
            </span>
            <span
              className={`truncate text-sm font-medium ${
                checkIn ? "text-slate-900" : "text-slate-400"
              }`}
            >
              {checkIn ? formatShortDate(checkIn) : "Дата"}
            </span>
          </span>

          <span className="flex min-w-0 flex-1 flex-col justify-center px-3 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Выезд
            </span>
            <span
              className={`truncate text-sm font-medium ${
                checkOut ? "text-slate-900" : "text-slate-400"
              }`}
            >
              {checkOut ? formatShortDate(checkOut) : "Дата"}
            </span>
          </span>
        </span>

        <span className="flex w-9 shrink-0 items-center justify-center border-l border-slate-200 text-slate-400">
          <ChevronDown size={15} />
        </span>
      </button>

      {calendar}
    </div>
  );
}
