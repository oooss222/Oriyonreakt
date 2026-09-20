/**
 * Travel category: specs, price presets, quick chips, and template resolver.
 * Tuned for Tajikistan (local routes, abroad tours, guides, gear).
 */

export const TRAVEL_PRICE_PRESETS = [
  { label: "Любая", from: "", to: "" },
  { label: "до 200 с.", from: "", to: "200" },
  { label: "200–500 с.", from: "200", to: "500" },
  { label: "500–1 500 с.", from: "500", to: "1500" },
  { label: "1 500–5 000 с.", from: "1500", to: "5000" },
  { label: "от 5 000 с.", from: "5000", to: "" },
];

export const TRAVEL_DURATIONS = [
  "1 день",
  "2–3 дня",
  "4–7 дней",
  "Больше недели",
];

export const TRAVEL_DIRECTIONS_TJ = [
  "Фанские горы",
  "Памир и Хорог",
  "Искандеркуль",
  "Семь озёр",
  "Худжанд и Согд",
  "Другое по РТ",
];

export const TRAVEL_DIRECTIONS_ABROAD = [
  "Узбекистан",
  "Турция",
  "ОАЭ",
  "Россия",
  "Другое",
];

export const TRAVEL_TOUR_SPECS = [
  {
    name: "Направление",
    type: "select",
    options: [...TRAVEL_DIRECTIONS_TJ, ...TRAVEL_DIRECTIONS_ABROAD],
  },
  { name: "Длительность", type: "select", options: TRAVEL_DURATIONS },
  {
    name: "Формат",
    type: "select",
    options: ["Групповой", "Индивидуальный", "Семейный"],
  },
];

export const TRAVEL_LOCAL_TOUR_SPECS = [
  { name: "Направление", type: "select", options: TRAVEL_DIRECTIONS_TJ },
  { name: "Длительность", type: "select", options: TRAVEL_DURATIONS },
  {
    name: "Формат",
    type: "select",
    options: ["Групповой", "Индивидуальный", "Семейный"],
  },
];

export const TRAVEL_ABROAD_SPECS = [
  { name: "Направление", type: "select", options: TRAVEL_DIRECTIONS_ABROAD },
  { name: "Длительность", type: "select", options: TRAVEL_DURATIONS },
  {
    name: "Формат",
    type: "select",
    options: ["Групповой", "Индивидуальный", "Семейный"],
  },
];

export const TRAVEL_GUIDE_SPECS = [
  {
    name: "Формат",
    type: "select",
    options: ["Гид", "Групповая экскурсия", "Индивидуальная", "Горный маршрут"],
  },
  { name: "Длительность", type: "select", options: TRAVEL_DURATIONS },
];

export const TRAVEL_BASE_SPECS = [
  {
    name: "Тип размещения",
    type: "select",
    options: ["База отдыха", "Горный домик", "Кемпинг / глэмпинг", "Другое"],
  },
  {
    name: "Питание",
    type: "select",
    options: ["С питанием", "Без питания", "По запросу"],
  },
];

export const TRAVEL_TRANSPORT_SPECS = [
  {
    name: "Тип услуги",
    type: "select",
    options: [
      "Аренда авто",
      "Авто с водителем",
      "Трансфер",
      "Авиа / ж/д билеты",
      "Другое",
    ],
  },
];

export const TRAVEL_GEAR_SPECS = [
  {
    name: "Тип",
    type: "select",
    options: ["Палатка / спальник", "Рюкзак", "Альпинизм", "Другое"],
  },
];

export function resolveTravelSpecTemplate(subcategory = "") {
  const sub = String(subcategory || "").trim();
  const group = sub.includes(" — ") ? sub.split(" — ")[0] : sub;

  if (group === "Туры по Таджикистану") return TRAVEL_LOCAL_TOUR_SPECS;
  if (group === "Туры за границу") return TRAVEL_ABROAD_SPECS;
  if (group === "Экскурсии и гиды") return TRAVEL_GUIDE_SPECS;
  if (group === "Базы отдыха") return TRAVEL_BASE_SPECS;
  if (group === "Транспорт и билеты") return TRAVEL_TRANSPORT_SPECS;
  if (group === "Снаряжение") return TRAVEL_GEAR_SPECS;
  if (group === "Другое") return TRAVEL_GEAR_SPECS;
  return TRAVEL_TOUR_SPECS;
}

export const TRAVEL_QUICK_FILTERS = [
  {
    label: "Фанские горы",
    to:
      "/listing?cat=travel&subcategory=" +
      encodeURIComponent("Туры по Таджикистану — Фанские горы"),
  },
  {
    label: "Памир",
    to:
      "/listing?cat=travel&subcategory=" +
      encodeURIComponent("Туры по Таджикистану — Памир и Хорог"),
  },
  {
    label: "Искандеркуль",
    to:
      "/listing?cat=travel&subcategory=" +
      encodeURIComponent("Туры по Таджикистану — Искандеркуль"),
  },
  {
    label: "За границу",
    to:
      "/listing?cat=travel&subcategory=" +
      encodeURIComponent("Туры за границу"),
  },
  {
    label: "Гиды",
    to:
      "/listing?cat=travel&subcategory=" +
      encodeURIComponent("Экскурсии и гиды"),
  },
  {
    label: "Базы отдыха",
    to: "/listing?cat=travel&subcategory=" + encodeURIComponent("Базы отдыха"),
  },
  {
    label: "до 500 с.",
    to: "/listing?cat=travel&priceTo=500",
  },
];
