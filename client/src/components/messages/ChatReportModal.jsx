import React from "react";
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

  if (!open) return null;

  const handleSubmit = (event) => {
    event.preventDefault();

    if (reason === "other" && details.trim().length < 5) {
      return;
    }

    onSubmit({ reason, details: details.trim() });
  };

  return (
    <div className="fixed inset-0 z-[130] grid place-items-center p-4 bg-ink/45 backdrop-blur-[2px]">
      <div
        className="w-full max-w-md overflow-hidden rounded-[1.35rem] bg-white shadow-lift border border-ink/8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-report-title"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-ink/8 bg-gradient-to-r from-sun-50/80 to-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-sun/10 text-sun shrink-0">
              <Flag size={18} />
            </div>
            <h3
              id="chat-report-title"
              className="font-display font-bold text-lg text-ink truncate"
            >
              {t("report.title")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-ink/8 bg-white text-ink-500 hover:bg-mist"
            aria-label={t("common.close")}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-2">
            {REPORT_REASONS.map((item) => {
              const selected = reason === item.id;

              return (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 cursor-pointer transition ${
                    selected
                      ? "border-sun/30 bg-sun-50"
                      : "border-ink/8 hover:bg-mist/70"
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={item.id}
                    checked={selected}
                    onChange={() => setReason(item.id)}
                    className="accent-[#ff6a00]"
                  />
                  <span className="text-sm font-medium text-ink">{item.label}</span>
                </label>
              );
            })}
          </div>

          {reason === "other" ? (
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              className="input w-full resize-none rounded-2xl"
              placeholder={t("report.placeholder")}
            />
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn rounded-xl"
            >
              {t("common.close")}
            </button>
            <button
              type="submit"
              disabled={sending}
              className="btn btn-primary rounded-xl"
            >
              {sending ? t("report.sending") : t("report.send")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
