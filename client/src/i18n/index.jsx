import React from "react";
import ru from "./locales/ru.js";
import ruExtra from "./locales/extra/ru.js";
import { mergeLocale } from "./helpers.js";

export const LANG_STORAGE_KEY = "oriyon_lang";
export const SUPPORTED_LANGS = ["ru", "tg", "en"];

// Russian stays in the main bundle because it is both the default and the
// fallback for missing keys. The other two are fetched when selected, so most
// visitors never download translations they cannot read.
const BASE_MESSAGES = mergeLocale(ru, ruExtra);

const LOCALE_LOADERS = {
  tg: () =>
    Promise.all([import("./locales/tg.js"), import("./locales/extra/tg.js")]),
  en: () =>
    Promise.all([import("./locales/en.js"), import("./locales/extra/en.js")]),
};

const loadedMessages = { ru: BASE_MESSAGES };

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
  const [messages, setMessages] = React.useState(
    () => loadedMessages[readStoredLang()] || BASE_MESSAGES
  );

  React.useEffect(() => {
    if (loadedMessages[lang]) {
      setMessages(loadedMessages[lang]);
      return undefined;
    }

    let active = true;

    LOCALE_LOADERS[lang]?.()
      .then(([base, extra]) => {
        const merged = mergeLocale(base.default, extra.default);
        loadedMessages[lang] = merged;

        if (active) setMessages(merged);
      })
      .catch(() => {
        // Keep showing the fallback rather than blanking the interface.
      });

    return () => {
      active = false;
    };
  }, [lang]);

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
      const primary = resolvePath(messages, key);
      const fallback = resolvePath(BASE_MESSAGES, key);
      const value = primary ?? fallback ?? key;
      return typeof value === "string" ? interpolate(value, vars) : value;
    },
    [messages]
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

export {
  formatListingTimeAgo,
  formatDayLabel,
  formatNightsLabel,
  getQuickReplies,
  getBusinessBenefits,
  formatPromotionDaysLabel,
  pluralRealEstateListings,
} from "./helpers.js";
