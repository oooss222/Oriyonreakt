import React from "react";
import { Check } from "lucide-react";
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
  const triggerRef = React.useRef(null);
  const menuId = React.useId();

  React.useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    // Escape has to return focus to the trigger, otherwise a keyboard user is
    // dropped back at the top of the document.
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;

      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-11 min-w-[2.75rem] items-center justify-center rounded-xl px-2 text-xs font-bold tracking-wide text-ink-600 transition-colors hover:bg-mist-100 hover:text-ink-900"
        aria-label={t("lang.switch")}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
      >
        {LANG_LABELS[lang] || "RU"}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={t("lang.switch")}
          className="absolute right-0 top-[calc(100%+0.35rem)] min-w-[9rem] overflow-hidden rounded-xl border border-ink-200 bg-white py-1 text-ink-900 shadow-lg"
          style={{ zIndex: "var(--z-dropdown)" }}
        >
          {SUPPORTED_LANGS.map((code) => {
            const active = code === lang;

            return (
              <button
                key={code}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                aria-current={active ? "true" : undefined}
                onClick={() => {
                  setLang(code);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                className={`flex min-h-[2.5rem] w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                  active
                    ? "bg-sun-50 font-semibold text-sun-700"
                    : "text-ink-700 hover:bg-mist-50"
                }`}
              >
                <Check
                  size={14}
                  aria-hidden="true"
                  className={`shrink-0 ${active ? "opacity-100" : "opacity-0"}`}
                />
                <span className="flex-1">{t(`lang.${code}`)}</span>
                <span className={`text-xs font-bold ${active ? "text-sun-700" : "text-ink-400"}`}>
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
