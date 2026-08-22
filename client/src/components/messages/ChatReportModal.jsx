import React from "react";
import { X } from "lucide-react";
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

  if (!open) return null;

  const handleSubmit = (event) => {
    event.preventDefault();

    if (reason === "other" && details.trim().length < 5) {
      return;
    }

    onSubmit({ reason, details: details.trim() });
  };

  return (
    <div className="fixed inset-0 z-[130] grid place-items-center p-4 bg-ink/40">
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-lift border border-ink/10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-report-title"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-ink/10">
          <h3 id="chat-report-title" className="font-display font-bold text-lg text-ink">
            {t("report.title")}
          </h3>
          <button type="button" onClick={onClose} className="btn p-2" aria-label={t("common.close")}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-2">
            {REPORT_REASONS.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-ink/10 px-3 py-2.5 cursor-pointer hover:bg-mist/70"
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={item.id}
                  checked={reason === item.id}
                  onChange={() => setReason(item.id)}
                />
                <span className="text-sm text-ink">{item.label}</span>
              </label>
            ))}
          </div>

          {reason === "other" ? (
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              className="input w-full resize-none"
              placeholder={t("report.placeholder")}
            />
          ) : null}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn">
              {t("common.close")}
            </button>
            <button type="submit" disabled={sending} className="btn btn-primary">
              {sending ? t("report.sending") : t("report.send")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
