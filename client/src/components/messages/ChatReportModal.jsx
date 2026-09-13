import React from "react";
import { createPortal } from "react-dom";
import { Flag, X } from "lucide-react";
import { REPORT_REASONS } from "../../data/reportReasons";

export default function ChatReportModal({
  open,
  onClose,
  onSubmit,
  sending,
  t,
}) {
  const [reason, setReason] = React.useState("fraud");
  const [details, setDetails] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setReason("fraud");
    setDetails("");
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const handleSubmit = (event) => {
    event.preventDefault();

    if (reason === "other" && details.trim().length < 5) {
      return;
    }

    onSubmit({ reason, details: details.trim() });
  };

  return createPortal(
    <>
      <button
        type="button"
        aria-label={t("common.close")}
        className="sheet-backdrop sheet-backdrop--top"
        onClick={onClose}
      />

      <div
        className="sheet sheet--top sheet--dialog sheet--dialog-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-report-title"
      >
        <div className="sheet__handle sm:hidden" aria-hidden="true" />

        <div className="sheet__header">
          <div className="flex min-w-0 items-center gap-3">
            <div className="icon-box-sun h-10 w-10 shrink-0">
              <Flag size={18} />
            </div>
            <h3
              id="chat-report-title"
              className="truncate font-display text-lg font-bold text-ink"
            >
              {t("report.title")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost p-2"
            aria-label={t("common.close")}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="sheet__body space-y-2 pb-3">
            {REPORT_REASONS.map((item) => {
              const selected = reason === item.id;

              return (
                <label
                  key={item.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition ${
                    selected
                      ? "border-sun bg-sun-50"
                      : "border-ink/10 hover:bg-mist/70"
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={item.id}
                    checked={selected}
                    onChange={() => setReason(item.id)}
                    className="accent-sun"
                  />
                  <span className="text-sm font-medium text-ink">{item.label}</span>
                </label>
              );
            })}

            {reason === "other" ? (
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                className="input mt-2 w-full resize-none"
                placeholder={t("report.placeholder")}
              />
            ) : null}
          </div>

          <div className="sheet__footer sm:justify-end">
            <button type="button" onClick={onClose} className="btn btn-secondary rounded-xl">
              {t("common.close")}
            </button>
            <button
              type="submit"
              disabled={sending}
              className="btn btn-primary rounded-xl disabled:opacity-60"
            >
              {sending ? t("report.sending") : t("report.send")}
            </button>
          </div>
        </form>
      </div>
    </>,
    document.body
  );
}
