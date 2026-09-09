import React from "react";
import { Modal, Radio, Textarea } from "../../ui";
import { REPORT_REASONS } from "../../data/reportReasons";

const DETAILS_MIN_LENGTH = 5;

export default function ChatReportModal({ open, onClose, onSubmit, sending, t }) {
  const [reason, setReason] = React.useState("fraud");
  const [details, setDetails] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setReason("fraud");
    setDetails("");
  }, [open]);

  const needsDetails = reason === "other" && details.trim().length < DETAILS_MIN_LENGTH;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (needsDetails) return;

    onSubmit({ reason, details: details.trim() });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("report.title")}
      description={t("report.subtitle")}
      size="sm"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn">
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            form="chat-report-form"
            disabled={sending || needsDetails}
            className="btn btn-primary"
          >
            {sending ? t("report.sending") : t("report.send")}
          </button>
        </div>
      }
    >
      <form id="chat-report-form" onSubmit={handleSubmit}>
        <fieldset className="space-y-2">
          <legend className="field-label">{t("report.reasonLegend")}</legend>
          {REPORT_REASONS.map((item) => (
            <Radio
              key={item.id}
              name="chat-report-reason"
              value={item.id}
              checked={reason === item.id}
              onChange={() => setReason(item.id)}
              label={item.label}
              boxed
            />
          ))}
        </fieldset>

        {reason === "other" ? (
          <Textarea
            className="mt-3"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={4}
            placeholder={t("report.placeholder")}
            aria-label={t("report.describe")}
          />
        ) : null}
      </form>
    </Modal>
  );
}
