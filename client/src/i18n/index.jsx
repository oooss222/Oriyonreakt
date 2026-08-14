import React from "react";
import ru from "./locales/ru.js";
import en from "./locales/en.js";
import tg from "./locales/tg.js";

export const LANG_STORAGE_KEY = "oriyon_lang";
export const SUPPORTED_LANGS = ["ru", "tg", "en"];

const MESSAGES = { ru, tg, en };

function resolvePath(obj, path) {
  return String(path || "")
    .split(".")
    .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function interpolate(template, vars = {}) {
  return String(template || "").replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : ""
  );
}

function normalizeLang(value) {
  const lang = String(value || "").trim().toLowerCase();
  return SUPPORTED_LANGS.includes(lang) ? lang : "ru";
}

function readStoredLang() {
  try {
    return normalizeLang(localStorage.getItem(LANG_STORAGE_KEY));
  } catch {
    return "ru";
  }
}

const I18nContext = React.createContext({
  lang: "ru",
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }) {
  const [lang, setLangState] = React.useState(readStoredLang);

  const setLang = React.useCallback((nextLang) => {
    const normalized = normalizeLang(nextLang);
    setLangState(normalized);

    try {
      localStorage.setItem(LANG_STORAGE_KEY, normalized);
    } catch {
      /* ignore */
    }

    document.documentElement.lang = normalized === "tg" ? "tg" : normalized;
  }, []);

  React.useEffect(() => {
    document.documentElement.lang = lang === "tg" ? "tg" : lang;
  }, [lang]);

  const t = React.useCallback(
    (key, vars) => {
      const primary = resolvePath(MESSAGES[lang], key);
      const fallback = resolvePath(MESSAGES.ru, key);
      const value = primary ?? fallback ?? key;
      return typeof value === "string" ? interpolate(value, vars) : value;
    },
    [lang]
  );

  const value = React.useMemo(
    () => ({
      lang,
      setLang,
      t,
    }),
    [lang, setLang, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return React.useContext(I18nContext);
}

export function getCategoryLabel(cat, t) {
  const key = String(cat || "").trim();
  return t(`categories.${key}`, {}) !== `categories.${key}`
    ? t(`categories.${key}`)
    : key;
}
