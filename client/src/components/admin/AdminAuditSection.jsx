import React from "react";
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../../lib/api";
import { getAuditActionLabels } from "../../lib/adminUtils";
import { useI18n } from "../../i18n";

const PAGE_SIZE = 50;

function formatDetails(item, t, numberLocale) {
  const details = item.details || {};
  const parts = [];

  if (details.email) parts.push(details.email);
  if (details.title) parts.push(t("admin.audit.detailTitle", { title: details.title }));
  if (details.status) parts.push(t("admin.audit.detailStatus", { status: details.status }));
  if (details.role) parts.push(t("admin.audit.detailRole", { role: details.role }));
  if (details.amount !== undefined) {
    parts.push(`${Number(details.amount).toLocaleString(numberLocale)} TJS`);
  }
  if (details.reason) parts.push(details.reason);
  if (details.ownerEmail) parts.push(t("admin.audit.detailSeller", { email: details.ownerEmail }));

  return parts.join(" · ") || "—";
}

export default function AdminAuditSection({ token }) {
  const { t, lang } = useI18n();
  const numberLocale = lang === "en" ? "en-US" : lang === "tg" ? "tg-TJ" : "ru-RU";
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState("");
  const [page, setPage] = React.useState(1);

  const ACTION_FILTER_OPTIONS = [
    { value: "", label: t("admin.audit.allActions") },
    ...Object.entries(getAuditActionLabels()).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  const load = React.useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const data = await api.adminAuditLog(token, {
        action: actionFilter,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });

      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || t("admin.audit.loadError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, actionFilter, page]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    setPage(1);
  }, [actionFilter]);

  if (loading) {
    return (
      <div className="admin-panel p-5 animate-pulse h-48" />
    );
  }

  return (
    <div className="admin-panel p-4 md:p-5 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 mb-2">
            <ScrollText className="w-4 h-4" />
            Audit log
          </div>
          <h2 className="text-xl font-bold">{t("admin.audit.title")}</h2>
          <p className="text-sm text-ink-500 mt-1">
            {t("admin.audit.subtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={refreshing}
          className="btn btn-secondary disabled:opacity-60"
        >
          {refreshing ? t("admin.common.refreshing") : t("admin.common.refresh")}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40 max-w-md"
        >
          {ACTION_FILTER_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 text-sm text-ink-500">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            {t("admin.pagination.back")}
          </button>
          <span>{page}</span>
          <button
            type="button"
            disabled={items.length < PAGE_SIZE}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border disabled:opacity-40"
          >
            {t("admin.pagination.next")}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border bg-mist-50 p-8 text-center text-ink-500">
          {t("admin.audit.empty")}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr className="border-b text-left text-ink-500">
                <th className="py-3 px-3">{t("admin.finance.col.when")}</th>
                <th className="py-3 px-3">{t("admin.finance.col.who")}</th>
                <th className="py-3 px-3">{t("admin.finance.col.action")}</th>
                <th className="py-3 px-3">{t("admin.finance.col.details")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="py-3 px-3 text-ink-500 whitespace-nowrap">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString("ru-RU")
                      : "—"}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium">{item.actorName || "—"}</div>
                    <div className="text-xs text-ink-500">{item.actorEmail}</div>
                  </td>
                  <td className="py-3 px-3">
                    {getAuditActionLabels()[item.action] || item.action}
                  </td>
                  <td className="py-3 px-3 text-ink-600">
                    {formatDetails(item, t, numberLocale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
