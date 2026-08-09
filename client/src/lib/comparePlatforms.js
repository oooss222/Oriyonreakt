export const COMPARE_PLATFORMS = [
  { value: "somon", label: "Somon.tj" },
  { value: "paydo", label: "Paydo.tj" },
  { value: "alon", label: "Alon.tj" },
  { value: "savdo", label: "Savdo.tj" },
  { value: "other", label: "Другая площадка" },
];

export function getPlatformLabel(platform = "") {
  const key = String(platform || "").trim();
  return COMPARE_PLATFORMS.find((row) => row.value === key)?.label || "Другая площадка";
}
