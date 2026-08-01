const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

export function todayIso() {
  const now = new Date();
  return toIsoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
}

export function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(iso = "") {
  if (!iso) return null;
  const date = new Date(`${iso}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function addMonths(year, month, delta) {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function compareIso(a = "", b = "") {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function formatShortDate(iso = "") {
  const date = parseIsoDate(iso);
  if (!date) return "";
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function formatNightsLabel(nights = 0) {
  if (!nights) return "0 ночей";
  const mod10 = nights % 10;
  const mod100 = nights % 100;
  if (mod10 === 1 && mod100 !== 11) return `${nights} ночь`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${nights} ночи`;
  }
  return `${nights} ночей`;
}

export function getMonthLabel(year, month) {
  return `${MONTHS[month]} ${year}`;
}

export function buildMonthGrid(year, month, minIso = "") {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = toIsoDate(new Date(year, month, day));
    cells.push({
      iso,
      day,
      disabled: minIso ? compareIso(iso, minIso) < 0 : false,
    });
  }

  return cells;
}

export function getInitialViewMonth(checkIn = "") {
  const min = todayIso();
  const base = parseIsoDate(checkIn) || parseIsoDate(min);
  return { year: base.getFullYear(), month: base.getMonth() };
}

export function getDayRangeState(iso, checkIn = "", checkOut = "") {
  if (!checkIn) {
    return { isStart: false, isEnd: false, inRange: false };
  }

  if (!checkOut) {
    return {
      isStart: iso === checkIn,
      isEnd: iso === checkIn,
      inRange: false,
    };
  }

  const afterStart = compareIso(iso, checkIn) > 0;
  const beforeEnd = compareIso(iso, checkOut) < 0;

  return {
    isStart: iso === checkIn,
    isEnd: iso === checkOut,
    inRange: afterStart && beforeEnd,
  };
}

export { WEEKDAYS, MONTHS };
