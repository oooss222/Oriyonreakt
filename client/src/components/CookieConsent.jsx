import React from "react";
import { Link } from "react-router-dom";
import { Cookie, ShieldCheck, Sparkles, X } from "lucide-react";
import {
  CONSENT_EVENT,
  clearAnalyticsData,
  hasConsentDecision,
  readCookieConsent,
  saveCookieConsent,
} from "../lib/cookieConsent";

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? "bg-lagoon" : "bg-mist-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function SettingsModal({ open, analyticsEnabled, onAnalyticsChange, onClose, onSave }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-ink/45 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-settings-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[1.75rem] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] border border-white/80 overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-lagoon-50 via-white to-sun-50/40 px-5 py-5 sm:px-6 border-b border-mist-200/80">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-lagoon shadow-sm ring-1 ring-lagoon/10">
                <Cookie size={20} />
              </div>
              <div>
                <h2 id="cookie-settings-title" className="font-display text-xl font-bold text-ink">
                  Настройки cookie
                </h2>
                <p className="text-sm text-ink-400 mt-1 leading-relaxed">
                  Управляйте тем, какие данные мы можем сохранять.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="rounded-xl p-2 text-ink-400 hover:bg-white/80 hover:text-ink transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-3">
          <div className="rounded-2xl border border-mist-200 bg-mist-50/80 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-lagoon ring-1 ring-lagoon/10">
                <ShieldCheck size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-ink text-sm">Необходимые</div>
                  <span className="rounded-full bg-lagoon/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-lagoon">
                    Всегда
                  </span>
                </div>
                <p className="text-xs text-ink-400 mt-1.5 leading-relaxed">
                  Вход, безопасность, корзина избранного и базовая работа сайта.
                </p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl border p-4 transition-colors ${
              analyticsEnabled
                ? "border-lagoon/25 bg-lagoon-50/40"
                : "border-mist-200 bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sun ring-1 ring-sun/10">
                <Sparkles size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-ink text-sm">Персонализация</div>
                  <Toggle
                    checked={analyticsEnabled}
                    onChange={onAnalyticsChange}
                    label="Аналитика и персонализация"
                  />
                </div>
                <p className="text-xs text-ink-400 mt-1.5 leading-relaxed">
                  Рекомендации «Подобрано для вас», блок «Вы смотрели» и история
                  интересов.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-3">
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-mist-300 bg-white px-5 text-sm font-semibold text-ink hover:bg-mist-50 transition"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={onSave}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-lagoon px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(14,124,123,0.28)] hover:bg-lagoon-600 transition"
            >
              Сохранить выбор
            </button>
          </div>

          <p className="text-xs text-ink-400 text-center sm:text-left">
            Подробнее — в{" "}
            <Link to="/policy" className="font-medium text-lagoon hover:underline" onClick={onClose}>
              политике конфиденциальности
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CookieConsent() {
  const [visible, setVisible] = React.useState(() => !hasConsentDecision());
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = React.useState(
    () => readCookieConsent()?.level === "all"
  );

  React.useEffect(() => {
    const sync = () => {
      setVisible(!hasConsentDecision());
      setAnalyticsEnabled(readCookieConsent()?.level === "all");
    };

    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  const applyConsent = (level) => {
    if (level !== "all") {
      clearAnalyticsData();
    }

    saveCookieConsent(level);
    setVisible(false);
    setSettingsOpen(false);
  };

  const handleAccept = () => {
    applyConsent("all");
  };

  const handleSaveSettings = () => {
    applyConsent(analyticsEnabled ? "all" : "essential");
  };

  if (!visible && !settingsOpen) {
    return null;
  }

  return (
    <>
      {visible && (
        <div
          className="fixed inset-x-0 z-[60] pointer-events-none bottom-[calc(4.85rem+env(safe-area-inset-bottom))] lg:bottom-6 px-3 sm:px-5"
          role="region"
          aria-label="Уведомление о cookie"
        >
          <div className="pointer-events-auto mx-auto w-full max-w-5xl animate-fade-in-up">
            <div className="relative overflow-hidden rounded-[999px] bg-white p-[3px] shadow-[0_20px_60px_rgba(15,23,42,0.16),0_2px_8px_rgba(15,23,42,0.06)]">
              <div className="absolute inset-0 rounded-[999px] bg-gradient-to-r from-lagoon via-[#1f6feb] to-lagoon-400 opacity-90" />

              <div className="relative flex flex-col gap-4 rounded-[999px] bg-white px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-6 sm:py-3.5">
                <div className="flex min-w-0 items-center gap-3 sm:flex-1">
                  <div className="relative shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-lagoon-50 to-white text-lagoon ring-1 ring-lagoon/15 shadow-sm">
                      <Cookie size={18} strokeWidth={2.2} />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-sun ring-2 ring-white" />
                  </div>

                  <p className="text-[13px] sm:text-sm leading-relaxed text-ink/90">
                    Мы используем cookie для улучшения работы сайта и персональных
                    рекомендаций.{" "}
                    <Link
                      to="/policy"
                      className="font-semibold text-lagoon hover:text-lagoon-600 underline-offset-2 hover:underline"
                    >
                      Подробнее
                    </Link>
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2.5 sm:pl-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAnalyticsEnabled(readCookieConsent()?.level === "all");
                      setSettingsOpen(true);
                    }}
                    className="inline-flex min-h-10 flex-1 sm:flex-none items-center justify-center rounded-full border-2 border-lagoon bg-white px-5 sm:min-w-[128px] text-sm font-bold text-lagoon transition hover:bg-lagoon-50 active:scale-[0.98]"
                  >
                    Настроить
                  </button>

                  <button
                    type="button"
                    onClick={handleAccept}
                    className="inline-flex min-h-10 flex-1 sm:flex-none items-center justify-center rounded-full bg-lagoon px-5 sm:min-w-[128px] text-sm font-bold text-white shadow-[0_8px_22px_rgba(14,124,123,0.28)] transition hover:bg-lagoon-600 active:scale-[0.98]"
                  >
                    Принять
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <SettingsModal
        open={settingsOpen}
        analyticsEnabled={analyticsEnabled}
        onAnalyticsChange={setAnalyticsEnabled}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </>
  );
}
