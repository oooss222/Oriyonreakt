import React from "react";
import { Link } from "react-router-dom";
import { Cookie, ShieldCheck } from "lucide-react";
import {
  CONSENT_EVENT,
  clearAnalyticsData,
  hasConsentDecision,
  readCookieConsent,
  saveCookieConsent,
} from "../lib/cookieConsent";
import { Button, Modal } from "../ui";
import { useI18n } from "../i18n";

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? "bg-sun-500" : "bg-ink-200"
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-xs transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function SettingsModal({ open, analyticsEnabled, onAnalyticsChange, onClose, onSave }) {
  const { t } = useI18n();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("cookie.settingsTitle")}
      description={t("cookie.settingsDesc")}
      size="sm"
      footer={
        <div className="space-y-3">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button onClick={onClose}>{t("common.cancel")}</Button>
            <Button variant="primary" onClick={onSave}>
              {t("cookie.saveChoice")}
            </Button>
          </div>

          <p className="text-xs text-ink-400">
            {t("cookie.privacyPrefix")}{" "}
            <Link
              to="/policy"
              className="font-medium text-sun-700 hover:underline"
              onClick={onClose}
            >
              {t("cookie.privacyLink")}
            </Link>
            .
          </p>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="rounded-xl border border-ink-200 bg-mist-50 p-4">
          <div className="flex items-start gap-3">
            <span className="icon-box-sun mt-0.5 h-9 w-9 shrink-0">
              <ShieldCheck size={17} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-ink-900">
                  {t("cookie.essential")}
                </h3>
                <span className="badge badge-neutral">
                  {t("cookie.essentialAlways")}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-400">
                {t("cookie.essentialDesc")}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`rounded-xl border p-4 transition-colors ${
            analyticsEnabled
              ? "border-sun-300 bg-sun-50"
              : "border-ink-200 bg-white"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="icon-box-sun mt-0.5 h-9 w-9 shrink-0">
              <ShieldCheck size={17} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-ink-900">
                  {t("cookie.personalization")}
                </h3>
                <Toggle
                  checked={analyticsEnabled}
                  onChange={onAnalyticsChange}
                  label={t("cookie.personalizationToggle")}
                />
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-400">
                {t("cookie.personalizationDesc")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function CookieConsent() {
  const { t } = useI18n();
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
          className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--mobile-nav-height)+0.75rem+env(safe-area-inset-bottom,0px))] px-3 sm:px-5 lg:bottom-6"
          style={{ zIndex: "var(--z-sticky-bar)" }}
          role="region"
          aria-label={t("a11y.cookieNotice")}
        >
          <div className="pointer-events-auto mx-auto flex w-full max-w-4xl animate-fade-in-up flex-col gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3.5 shadow-lg sm:flex-row sm:items-center sm:gap-5 sm:px-5">
            <div className="flex min-w-0 items-start gap-3 sm:flex-1 sm:items-center">
              <span className="icon-box-sun h-10 w-10 shrink-0 rounded-full">
                <Cookie size={18} strokeWidth={2.2} aria-hidden />
              </span>

              <p className="text-sm leading-relaxed text-ink-700">
                {t("cookie.banner")}{" "}
                <Link
                  to="/policy"
                  className="font-semibold text-sun-700 underline-offset-2 hover:underline"
                >
                  {t("cookie.learnMore")}
                </Link>
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAnalyticsEnabled(readCookieConsent()?.level === "all");
                  setSettingsOpen(true);
                }}
                className="btn flex-1 sm:min-w-[8rem] sm:flex-none"
              >
                {t("cookie.settings")}
              </button>

              <button
                type="button"
                onClick={handleAccept}
                className="btn btn-primary flex-1 sm:min-w-[8rem] sm:flex-none"
              >
                {t("cookie.accept")}
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
