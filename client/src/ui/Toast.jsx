import React from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "./cn";
import { useI18n } from "../i18n";

const ToastContext = React.createContext(null);

const TONES = {
  info: { icon: Info, className: "border-ink-700 bg-ink-900 text-white", iconClass: "text-white/70" },
  success: {
    icon: CheckCircle2,
    className: "border-success-200 bg-success-50 text-success-800",
    iconClass: "text-success-600",
  },
  error: {
    icon: AlertTriangle,
    className: "border-danger-200 bg-danger-50 text-danger-800",
    iconClass: "text-danger-600",
  },
};

let nextId = 0;

/**
 * App-wide toasts.
 *
 * One polite live region holds every message, so screen readers announce them
 * in order instead of each caller inventing its own region.
 */
export function ToastProvider({ children, duration = 3600 }) {
  const [toasts, setToasts] = React.useState([]);
  const timers = React.useRef(new Map());

  const dismiss = React.useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));

    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = React.useCallback(
    (message, tone = "info", options = {}) => {
      if (!message) return null;

      const id = ++nextId;
      const ttl = options.duration ?? duration;

      setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), ttl)
      );

      return id;
    },
    [dismiss, duration]
  );

  React.useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const value = React.useMemo(() => ({ showToast, dismiss }), [showToast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts, onDismiss }) {
  const { t } = useI18n();

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--mobile-nav-height)+1rem)] flex flex-col items-center gap-2 px-4 sm:bottom-6 lg:bottom-6"
      style={{ zIndex: "var(--z-toast)" }}
      role="region"
      aria-label={t("a11y.notifications")}
    >
      <div aria-live="polite" aria-atomic="false" className="contents">
        {toasts.map((toast) => {
          const tone = TONES[toast.tone] || TONES.info;
          const Icon = tone.icon;

          return (
            <div
              key={toast.id}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border px-3.5 py-3 shadow-lg animate-fade-in-up",
                tone.className
              )}
            >
              <Icon size={17} className={cn("mt-px shrink-0", tone.iconClass)} aria-hidden="true" />
              <p className="min-w-0 flex-1 text-sm font-medium break-anywhere">{toast.message}</p>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="-mr-1 -mt-0.5 shrink-0 rounded-md p-1 opacity-60 transition hover:opacity-100"
                aria-label={t("a11y.dismissNotification")}
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);

  // Components can render outside the provider in tests and isolated previews.
  return context || { showToast: () => null, dismiss: () => {} };
}

export default ToastProvider;
