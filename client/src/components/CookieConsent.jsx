import React from "react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import {
  CONSENT_EVENT,
  clearAnalyticsData,
  hasConsentDecision,
  readCookieConsent,
  saveCookieConsent,
} from "../lib/cookieConsent";

function SettingsModal({ open, analyticsEnabled, onAnalyticsChange, onClose, onSave }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-settings-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-mist-200 p-5 sm:p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="cookie-settings-title" className="font-display text-xl font-bold text-ink">
              Настройки cookie
            </h2>
            <p className="text-sm text-ink-400 mt-1">
              Выберите, какие cookie можно использовать на сайте.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded-xl p-2 text-ink-400 hover:bg-mist-100 hover:text-ink transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-mist-200 bg-mist-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-ink text-sm">Необходимые</div>
                <p className="text-xs text-ink-400 mt-1">
                  Авторизация, безопасность и базовая работа сайта.
                </p>
              </div>
              <span className="text-xs font-semibold text-lagoon shrink-0">Всегда вкл.</span>
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-mist-200 p-4 cursor-pointer hover:border-lagoon/30 transition">
            <input
              type="checkbox"
              checked={analyticsEnabled}
              onChange={(e) => onAnalyticsChange(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-mist-300 text-lagoon focus:ring-lagoon/30"
            />
            <div>
              <div className="font-semibold text-ink text-sm">Аналитика и персонализация</div>
              <p className="text-xs text-ink-400 mt-1">
                История просмотров, рекомендации «Подобрано для вас» и блок «Вы смотрели».
              </p>
            </div>
          </label>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn border bg-white hover:bg-mist-50"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onSave}
            className="btn bg-[#2ea84a] text-white border-[#2ea84a] hover:bg-[#279640]"
          >
            Сохранить
          </button>
        </div>

        <p className="text-xs text-ink-400">
          Подробнее — в{" "}
          <Link to="/policy" className="text-lagoon hover:underline" onClick={onClose}>
            политике конфиденциальности
          </Link>
          .
        </p>
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
          className="fixed inset-x-0 z-[60] px-3 sm:px-4 pointer-events-none bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-5"
          role="region"
          aria-label="Уведомление о cookie"
        >
          <div className="pointer-events-auto mx-auto flex max-w-6xl flex-col gap-3 rounded-[1.75rem] border-[3px] border-[#1f6feb] bg-white px-4 py-4 shadow-[0_12px_40px_rgba(15,23,42,0.12)] sm:flex-row sm:items-center sm:gap-5 sm:px-6 sm:py-4">
            <div className="flex min-w-0 items-start gap-3 sm:flex-1">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mist-50 text-lagoon ring-1 ring-lagoon/15">
                <Cookie size={16} />
              </div>

              <p className="text-sm leading-relaxed text-ink">
                Мы используем cookie-файлы для наилучшего представления нашего сайта.
                Продолжая использовать этот сайт, вы соглашаетесь с использованием
                cookie-файлов.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setAnalyticsEnabled(readCookieConsent()?.level === "all");
                  setSettingsOpen(true);
                }}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border-2 border-[#2ea84a] bg-white px-5 text-sm font-semibold text-[#2ea84a] transition hover:bg-[#f3fbf5] sm:flex-none sm:min-w-[132px]"
              >
                Настроить
              </button>

              <button
                type="button"
                onClick={handleAccept}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#2ea84a] px-5 text-sm font-semibold text-white transition hover:bg-[#279640] sm:flex-none sm:min-w-[132px]"
              >
                Принять
              </button>
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
