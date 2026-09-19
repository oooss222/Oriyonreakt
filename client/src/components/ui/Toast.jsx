import React from "react";
import { createPortal } from "react-dom";

/**
 * Lightweight toast for success/error feedback.
 * Usage: <Toast open message="..." tone="success|error" onClose={...} />
 */
export default function Toast({
  open = false,
  message = "",
  tone = "default",
  onClose,
  durationMs = 3200,
}) {
  React.useEffect(() => {
    if (!open || !onClose) return undefined;
    const id = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(id);
  }, [open, onClose, durationMs]);

  if (!open || !message || typeof document === "undefined") return null;

  const toneClass =
    tone === "success"
      ? "toast toast--success"
      : tone === "error"
        ? "toast toast--error"
        : "toast";

  return createPortal(
    <div
      className={`${toneClass}`}
      role="status"
      aria-live="polite"
      onClick={onClose}
      style={{ "--toast-ms": `${durationMs}ms` }}
    >
      {message}
      <span className="toast__progress" />
    </div>,
    document.body
  );
}
