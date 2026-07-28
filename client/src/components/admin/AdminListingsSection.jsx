import React from "react";
import { Link } from "react-router-dom";
import { FileText, Trash2, Archive, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../../lib/api";
import { getId } from "../../lib/adminUtils";
import { getListingThumb } from "../../lib/media";
import { formatPrice } from "../../lib/format";
import { HOME_CATEGORIES } from "../../data/categories";

const PAGE_SIZE = 25;

const STATUS_OPTIONS = [
  { value: "all", label: "Все статусы" },
  { value: "pending", label: "На модерации" },
  { value: "approved", label: "Опубликованы" },
  { value: "rejected", label: "Отклонены" },
  { value: "sold", label: "Продано" },
  { value: "archived", label: "Сняты" },
];

const STATUS_LABELS = {
  pending: "На модерации",
  approved: "Опубликовано",
  rejected: "Отклонено",
  sold: "Продано",
  archived: "Снято",
};

export default function AdminListingsSection({ token }) {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [catFilter, setCatFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [actionLoadingId, setActionLoadingId] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const data = await api.adminListings(token, {
        status: statusFilter,
        q: query.trim(),
        cat: catFilter === "all" ? "" : catFilter,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });

      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Не удалось загрузить объявления");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, statusFilter, query, catFilter, page]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    setPage(1);
  }, [query, statusFilter, catFilter]);

  const removeListing = async (id) => {
    const ok = confirm("Удалить объявление полностью?");
    if (!ok) return;

    try {
      setActionLoadingId(id);
      await api.adminDeleteListing(token, id);
      setItems((prev) => prev.filter((item) => String(getId(item)) !== String(id)));
    } catch (e) {
      alert(e.message || "Не удалось удалить объявление");
    } finally {
      setActionLoadingId("");
    }
  };

  const archiveListing = async (id) => {
    try {
      setActionLoadingId(id);
      const updated = await api.adminSetListingStatus(token, id, "archived");
      setItems((prev) =>
        prev.map((item) => (String(getId(item)) === String(id) ? updated : item))
      );
    } catch (e) {
      alert(e.message || "Не удалось снять объявление");
    } finally {
      setActionLoadingId("");
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-5 animate-pulse h-48" />
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-sm text-sun-700 bg-sun-50 border border-sun-100 rounded-full px-3 py-1 mb-2">
            <FileText className="w-4 h-4" />
            Каталог объявлений
          </div>
          <h2 className="text-xl font-bold">Все объявления</h2>
          <p className="text-sm text-slate-500 mt-1">
            Поиск, фильтры и быстрые действия по любым объявлениям.
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

      <div className="rounded-2xl border bg-slate-50 p-3 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск: название, город, продавец"
          className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40 md:col-span-2"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
        >
          <option value="all">Все категории</option>
          {HOME_CATEGORIES.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-2 text-sm text-slate-500">
        <div>Показано: {items.length}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            Назад
          </button>
          <span>{page}</span>
          <button
            type="button"
            disabled={items.length < PAGE_SIZE}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border disabled:opacity-40"
          >
            Вперёд
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border bg-slate-50 p-8 text-center text-slate-500">
          Объявления не найдены.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((ad) => {
            const id = getId(ad);
            const busy = actionLoadingId === id;

            return (
              <article
                key={id}
                className="rounded-2xl border p-3 md:p-4 grid grid-cols-1 md:grid-cols-[120px_1fr_auto] gap-4"
              >
                <img
                  src={getListingThumb(ad)}
                  alt={ad.title || "Объявление"}
                  className="w-full md:w-28 h-24 rounded-xl object-cover bg-slate-100"
                />

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="inline-flex px-2 py-0.5 text-xs rounded-full border bg-slate-50">
                      {STATUS_LABELS[ad.status] || ad.status}
                    </span>
                    <span className="text-xs text-slate-500">
                      {ad.cat}
                      {ad.subcategory ? ` · ${ad.subcategory}` : ""}
                    </span>
                  </div>

                  <Link
                    to={`/ad/${id}`}
                    className="font-semibold hover:text-sun line-clamp-2"
                  >
                    {ad.title || "Без названия"}
                  </Link>

                  <div className="text-sm font-bold mt-1">
                    {formatPrice(ad.price, { emptyLabel: "—" })}
                  </div>

                  <div className="text-sm text-slate-500 mt-1">
                    {ad.location || "—"} · продавец: {ad.ownerName || ad.ownerEmail || "—"}
                  </div>
                </div>

                <div className="flex md:flex-col gap-2 md:min-w-36">
                  <Link
                    to={`/ad/${id}`}
                    className="inline-flex justify-center px-3 py-2 rounded-lg border hover:bg-slate-50 text-sm"
                  >
                    Открыть
                  </Link>

                  {ad.status === "approved" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => archiveListing(id)}
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border hover:bg-slate-50 text-sm disabled:opacity-60"
                    >
                      <Archive size={16} />
                      Снять
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => removeListing(id)}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border text-red-700 hover:bg-red-50 text-sm disabled:opacity-60"
                  >
                    <Trash2 size={16} />
                    Удалить
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
