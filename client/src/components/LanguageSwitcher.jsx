import React from "react";
import { useI18n, SUPPORTED_LANGS } from "../i18n";

const LANG_LABELS = {
  ru: "RU",
  tg: "TJ",
  en: "EN",
};

export default function LanguageSwitcher({ className = "" }) {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-11 min-w-[2.75rem] items-center justify-center rounded-xl px-2 text-xs font-bold tracking-wide text-ink-600 transition-colors hover:bg-mist-100 hover:text-ink-900"
        aria-label={t("lang.switch")}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {LANG_LABELS[lang] || "RU"}
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={t("lang.switch")}
          className="absolute right-0 top-[calc(100%+0.35rem)] min-w-[9rem] overflow-hidden rounded-xl border border-ink-200 bg-white text-ink-900 shadow-lg"
          style={{ zIndex: "var(--z-dropdown)" }}
        >
          {SUPPORTED_LANGS.map((code) => {
            const active = code === lang;

            return (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setLang(code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-sun-50 text-sun-700 font-semibold"
                    : "hover:bg-slate-50"
                }`}
              >
                <span>{t(`lang.${code}`)}</span>
                <span className="text-xs font-bold text-slate-400">
                  {LANG_LABELS[code]}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
