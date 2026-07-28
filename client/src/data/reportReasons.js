export const REPORT_REASONS = [
  { id: "fraud", label: "Мошенничество" },
  { id: "spam", label: "Спам" },
  { id: "prohibited", label: "Запрещённый товар" },
  { id: "wrong_category", label: "Неверная категория" },
  { id: "duplicate", label: "Дубликат" },
  { id: "other", label: "Другое" },
];

export const REPORT_REASON_LABELS = Object.fromEntries(
  REPORT_REASONS.map((item) => [item.id, item.label])
);
