import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "./cn";
import { useBodyScrollLock } from "./useBodyScrollLock";
import { useFocusTrap } from "./useFocusTrap";
import { useI18n } from "../i18n";

const SIZES = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
  full: "sm:max-w-6xl",
};

/**
 * Accessible dialog: portal, labelled `role="dialog"`, focus trap, Escape to
 * close, scroll lock and focus restore.
 *
 * On small screens it becomes a bottom sheet (`sheet`, the default) because a
 * centred box is awkward to reach one-handed.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  sheet = true,
  closeOnBackdrop = true,
  hideCloseButton = false,
  footer,
  className = "",
  bodyClassName = "",
  children,
}) {
  const panelRef = React.useRef(null);
  const labelId = React.useId();
  const descriptionId = React.useId();
  const { t } = useI18n();

  useBodyScrollLock(open);
  useFocusTrap(panelRef, open);

  React.useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose?.();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4"
      style={{ zIndex: "var(--z-modal)" }}
    >
      <div
        className="absolute inset-0 bg-ink-950/50 animate-fade-in"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? labelId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "relative flex w-full flex-col overflow-hidden bg-white shadow-xl outline-none",
          "max-h-[92vh] sm:max-h-[85vh]",
          sheet
            ? "rounded-t-3xl animate-slide-up sm:rounded-2xl sm:animate-scale-in"
            : "rounded-2xl animate-scale-in",
          SIZES[size] || SIZES.md,
          className
        )}
      >
        {sheet && (
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-ink-200 sm:hidden" />
        )}

        {(title || !hideCloseButton) && (
          <div className="flex shrink-0 items-start gap-3 border-b border-ink-200 px-4 py-3.5 sm:px-5">
            <div className="min-w-0 flex-1">
              {title && (
                <h2 id={labelId} className="text-lg font-bold text-ink-900">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descriptionId} className="mt-1 text-sm text-ink-500">
                  {description}
                </p>
              )}
            </div>

            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost btn-icon-sm -mr-1.5 shrink-0"
                aria-label={t("a11y.close")}
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5", bodyClassName)}>
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-ink-200 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:px-5 sm:pb-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
