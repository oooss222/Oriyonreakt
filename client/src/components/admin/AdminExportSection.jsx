import React from "react";
import { Download, FileSpreadsheet, CalendarRange, Mail } from "lucide-react";
import { api } from "../../lib/api";
import { getExportTypesForRole } from "../../lib/adminUtils";
import { useI18n } from "../../i18n";

function getExportMeta(t) {
  return {
    users: {
      title: t("admin.export.users.title"),
      description: t("admin.export.users.description"),
      dateFilter: true,
    },
    listings: {
      title: t("admin.export.listings.title"),
      description: t("admin.export.listings.description"),
      dateFilter: false,
    },
    transactions: {
      title: t("admin.export.transactions.title"),
      description: t("admin.export.transactions.description"),
      dateFilter: true,
    },
  };
}

export default function AdminExportSection({ token, role = "admin" }) {
  const { t } = useI18n();
  const [loadingType, setLoadingType] = React.useState("");
  const [sendingReport, setSendingReport] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [reportEmail, setReportEmail] = React.useState("");

  const exportTypes = getExportTypesForRole(role);
  const exportMeta = getExportMeta(t);
  const exportItems = exportTypes.map((type) => ({
    type,
    ...exportMeta[type],
  }));

  const download = async (type) => {
    try {
      setLoadingType(type);
      setError("");
      setSuccess("");

      const params = {};

      if (from) params.from = from;
      if (to) params.to = to;

      await api.adminExport(token, type, params);
    } catch (e) {
      setError(e.message || t("admin.export.downloadError"));
    } finally {
      setLoadingType("");
    }
  };

  const sendReport = async () => {
    try {
      setSendingReport(true);
      setError("");
      setSuccess("");

      const result = await api.adminFinanceSendReport(token, {
        from,
        to,
        email: reportEmail.trim(),
      });

      setSuccess(
        t("admin.export.reportSent", {
          sentTo: result.sentTo,
          count: result.transactions,
        })
      );
    } catch (e) {
      setError(e.message || t("admin.export.sendError"));
    } finally {
      setSendingReport(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-5">
      <div>
        <div className="inline-flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1 mb-2">
          <FileSpreadsheet className="w-4 h-4" />
          {t("admin.export.badge")}
        </div>
        <h2 className="text-xl font-bold">{t("admin.export.title")}</h2>
        <p className="text-sm text-slate-500 mt-1">
          {role === "accountant"
            ? t("admin.export.subtitleAccountant")
            : t("admin.export.subtitleDefault")}
        </p>
      </div>

      <div className="rounded-2xl border bg-slate-50 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <CalendarRange size={16} />
          {t("admin.export.periodLabel")}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="text-slate-500 block mb-1">{t("admin.finance.period.from")}</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-11 w-full rounded-xl border px-3 bg-white"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-500 block mb-1">{t("admin.finance.period.to")}</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-11 w-full rounded-xl border px-3 bg-white"
            />
          </label>
        </div>
        <p className="text-xs text-slate-500">
          {t("admin.export.periodHint")}
        </p>
      </div>

      <div className="rounded-2xl border bg-blue-50 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
          <Mail size={16} />
          {t("admin.export.emailSectionTitle")}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          <input
            type="email"
            value={reportEmail}
            onChange={(e) => setReportEmail(e.target.value)}
            placeholder={t("admin.export.emailPlaceholder")}
            className="h-11 rounded-xl border px-3 bg-white"
          />
          <button
            type="button"
            disabled={sendingReport}
            onClick={sendReport}
            className="h-11 px-4 rounded-xl bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {sendingReport ? t("admin.export.sending") : t("admin.export.sendButton")}
          </button>
        </div>
        <p className="text-xs text-blue-700">
          {t("admin.export.smtpHint")}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 p-3">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {exportItems.map((item) => (
          <div key={item.type} className="rounded-2xl border p-4 space-y-3 bg-slate-50">
            <div>
              <div className="font-semibold">{item.title}</div>
              <div className="text-sm text-slate-500 mt-1">{item.description}</div>
              {item.dateFilter && (from || to) && (
                <div className="text-xs text-emerald-700 mt-2">
                  {t("admin.export.periodWillInclude")}
                  {from ? t("admin.export.fromSuffix", { from }) : ""}
                  {to ? t("admin.export.toSuffix", { to }) : ""}
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={loadingType === item.type}
              onClick={() => download(item.type)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border hover:bg-slate-100 disabled:opacity-60"
            >
              <Download size={16} />
              {loadingType === item.type ? t("admin.export.preparing") : t("admin.export.downloadButton")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
