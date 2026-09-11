const LANG_STORAGE_KEY = "oriyon_lang";
const OTHER_PLATFORM_LABELS = {
  ru: "Другая площадка",
  en: "Other platform",
  tg: "Платформаи дигар",
};

function otherPlatformLabel() {
  try {
    const lang = String(localStorage.getItem(LANG_STORAGE_KEY) || "").toLowerCase();
    return OTHER_PLATFORM_LABELS[lang] || OTHER_PLATFORM_LABELS.ru;
  } catch {
    return OTHER_PLATFORM_LABELS.ru;
  }
}

export const COMPARE_PLATFORMS = [
  { value: "somon", label: "Somon.tj" },
  { value: "paydo", label: "Paydo.tj" },
  { value: "alon", label: "Alon.tj" },
  { value: "savdo", label: "Savdo.tj" },
  { value: "other", get label() { return otherPlatformLabel(); } },
];

export function getPlatformLabel(platform = "") {
  const key = String(platform || "").trim();
  return COMPARE_PLATFORMS.find((row) => row.value === key)?.label || otherPlatformLabel();
}
