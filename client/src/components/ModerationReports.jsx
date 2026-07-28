import React from "react";
import { Link } from "react-router-dom";
import { Flag, ExternalLink, Trash2, Ban } from "lucide-react";
import { api } from "../lib/api";
import { REPORT_REASON_LABELS } from "../data/reportReasons";

export default function ModerationReports({ token }) {
  const [items, setItems] = React.useState([]);
  const [status, setStatus] = React.useState("pending");
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [actionLoadingId, setActionLoadingId] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const data = await api.moderationReports(token, status);

      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Не удалось загрузить жалобы");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, status]);

  React.useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const handleReview = async (id) => {
    try {
      setActionLoadingId(id);
      await api.moderationReviewReport(token, id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      alert(e.message || "Не удалось обновить жалобу");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleDismiss = async (id) => {
    try {
      setActionLoadingId(id);
      await api.moderationDismissReport(token, id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      alert(e.message || "Не удалось отклонить жалобу");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleDeleteListing = async (item) => {
    const ok = confirm(
      `Удалить объявление «${item.listingTitle || "Без названия"}»? Это действие необратимо.`
    );
    if (!ok) return;

    try {
      setActionLoadingId(item.id);
      await api.moderationReportDeleteListing(token, item.id);
      setItems((prev) => prev.filter((row) => row.id !== item.id));
    } catch (e) {
      alert(e.message || "Не удалось удалить объявление");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleBlockOwner = async (item) => {
    const ownerLabel = item.listingOwnerName || "продавца";
    const ok = confirm(`Заблокировать ${ownerLabel}?`);
    if (!ok) return;

    try {
      setActionLoadingId(item.id);
      await api.moderationReportBlockOwner(token, item.id);
      setItems((prev) => prev.filter((row) => row.id !== item.id));
    } catch (e) {
      alert(e.message || "Не удалось заблокировать продавца");
    } finally {
      setActionLoadingId("");
    }
  };

  const statusLabel = {
    pending: "Новые",
    reviewed: "Рассмотренные",
    dismissed: "Отклонённые",
  };

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-4 md:p-5 text-sm text-slate-500">
        Загрузка жалоб...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-full px-3 py-1 mb-2">
            <Flag className="w-4 h-4" />
            Жалобы пользователей
          </div>

          <h2 className="text-xl font-bold">Жалобы на объявления</h2>

          <p className="text-sm text-slate-500 mt-1">
            Проверяйте жалобы и принимайте решение по объявлениям.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={refreshing}
          className="px-4 py-2 rounded-xl border hover:bg-slate-50 disabled:opacity-60"
        >
          {refreshing ? "Обновляем..." : "Обновить"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {["pending", "reviewed", "dismissed"].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
              status === value
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {statusLabel[value]}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
          Жалоб в этой категории нет.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 p-4 space-y-3"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="font-semibold text-slate-900">
                    {REPORT_REASON_LABELS[item.reason] || item.reason}
                  </div>

                  <div className="text-sm text-slate-600">
                    Объявление:{" "}
                    <Link
                      to={`/ad/${item.listingId}`}
                      className="text-sun hover:text-sun-600 font-medium"
                    >
                      {item.listingTitle || "Без названия"}
                    </Link>
                  </div>

                  <div className="text-sm text-slate-500">
                    От: {item.reporterName || "Пользователь"} ·{" "}
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString("ru-RU")
                      : ""}
                  </div>

                  {item.listingOwnerName && (
                    <div className="text-sm text-slate-500">
                      Продавец: {item.listingOwnerName}
                    </div>
                  )}

                  {item.details && (
                    <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 mt-2">
                      {item.details}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <Link
                    to={`/ad/${item.listingId}`}
                    className="btn py-2 rounded-xl"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Открыть
                  </Link>

                  {status === "pending" && (
                    <>
                      <button
                        type="button"
                        className="btn py-2 rounded-xl disabled:opacity-60 text-red-700 border-red-200 hover:bg-red-50"
                        disabled={actionLoadingId === item.id}
                        onClick={() => handleDeleteListing(item)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Удалить объявление
                      </button>

                      {item.listingOwnerId && (
                        <button
                          type="button"
                          className="btn py-2 rounded-xl disabled:opacity-60 text-red-700 border-red-200 hover:bg-red-50"
                          disabled={actionLoadingId === item.id}
                          onClick={() => handleBlockOwner(item)}
                        >
                          <Ban className="w-4 h-4" />
                          Заблокировать продавца
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn btn-primary py-2 rounded-xl disabled:opacity-60"
                        disabled={actionLoadingId === item.id}
                        onClick={() => handleReview(item.id)}
                      >
                        Рассмотрено
                      </button>

                      <button
                        type="button"
                        className="btn py-2 rounded-xl disabled:opacity-60"
                        disabled={actionLoadingId === item.id}
                        onClick={() => handleDismiss(item.id)}
                      >
                        Отклонить
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
