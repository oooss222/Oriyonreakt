import React from "react";
import { Link } from "react-router-dom";
import { PlusCircle, CheckSquare, Square } from "lucide-react";
import ListingGridSkeleton from "../ListingGridSkeleton";
import ProfileListingsGrid from "./ProfileListingsGrid";
import { getId } from "./profileUtils";

export default function MyListingsPanel({
  items,
  loading,
  canManage,
  onRemove,
  onStatusAction,
  onAppeal,
  onBulkAction,
}) {
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [view, setView] = React.useState("grid");
  const [selectMode, setSelectMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState(() => new Set());

  const stats = React.useMemo(() => {
    return items.reduce(
      (acc, ad) => {
        const status = ad.status || "pending";
        acc.total += 1;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0, sold: 0, archived: 0 }
    );
  }, [items]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((ad) => {
      const status = ad.status || "pending";
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!q) return true;

      const title = String(ad.title || "").toLowerCase();
      const description = String(ad.description || "").toLowerCase();
      const location = String(ad.location || ad.city || "").toLowerCase();
      const cat = String(ad.cat || "").toLowerCase();
      const subcategory = String(ad.subcategory || "").toLowerCase();

      return (
        title.includes(q) ||
        description.includes(q) ||
        location.includes(q) ||
        cat.includes(q) ||
        subcategory.includes(q)
      );
    });
  }, [items, query, statusFilter]);

  const toggleSelect = React.useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const key = String(id);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleSelectAll = React.useCallback(() => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(filtered.map((ad) => String(getId(ad)))));
  }, [filtered, selectedIds.size]);

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
    setSelectMode(false);
  }, []);

  const handleBulk = React.useCallback(
    async (action) => {
      const ids = Array.from(selectedIds);
      if (!ids.length) return;
      await onBulkAction?.(action, ids);
      clearSelection();
    },
    [selectedIds, onBulkAction, clearSelection]
  );

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-4 md:p-5">
        <ListingGridSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border bg-white p-4 md:p-5 space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Мои объявления</h2>
            <p className="text-sm text-slate-500 mt-1">
              Управляйте объявлениями, отслеживайте модерацию и статус публикации.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setSelectMode((v) => !v);
                  setSelectedIds(new Set());
                }}
                className={`mobile-btn border ${selectMode ? "bg-sun text-white border-sun" : "bg-white hover:bg-slate-50"}`}
              >
                {selectMode ? <CheckSquare size={18} /> : <Square size={18} />}
                Выбор
              </button>
            )}

            <Link
              to="/add"
              className="mobile-btn bg-sun text-white hover:bg-sun-600 lg:w-auto shrink-0"
            >
              <PlusCircle size={18} />
              Подать объявление
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["all", "Всего", stats.total, "bg-sun-50 border-sun-200"],
            ["approved", "Опубликовано", stats.approved, "bg-emerald-50 border-emerald-200"],
            ["pending", "На модерации", stats.pending, "bg-amber-50 border-amber-200"],
            ["rejected", "Отклонено", stats.rejected, "bg-red-50 border-red-200"],
          ].map(([key, label, count, activeClass]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`text-left rounded-2xl border p-4 transition ${
                statusFilter === key ? activeClass : "bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <div className="text-xs text-slate-500">{label}</div>
              <div className="text-2xl font-extrabold">{count}</div>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border bg-slate-50 p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto] gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию, описанию, категории или городу"
            className="mobile-control sm:col-span-2 lg:col-span-1"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mobile-control"
          >
            <option value="all">Все статусы</option>
            <option value="approved">Опубликованные</option>
            <option value="pending">На модерации</option>
            <option value="rejected">Отклонённые</option>
            <option value="sold">Проданные</option>
            <option value="archived">Снятые</option>
          </select>

          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            className="mobile-control"
          >
            <option value="grid">Сетка</option>
            <option value="compact">Компактно</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
          <div>
            Показано: <span className="font-medium text-slate-800">{filtered.length}</span> из{" "}
            <span className="font-medium text-slate-800">{items.length}</span>
          </div>

          {selectMode && (
            <button type="button" className="text-sun font-semibold" onClick={toggleSelectAll}>
              {selectedIds.size === filtered.length && filtered.length > 0
                ? "Снять выделение"
                : "Выбрать все"}
            </button>
          )}
        </div>
      </div>

      {selectMode && selectedIds.size > 0 && (
        <div className="sticky top-2 z-20 rounded-2xl border bg-white shadow-lg p-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-700 mr-auto">
            Выбрано: {selectedIds.size}
          </span>
          <button
            type="button"
            className="mobile-btn border hover:bg-slate-50"
            onClick={() => handleBulk("sold")}
          >
            Продано
          </button>
          <button
            type="button"
            className="mobile-btn border hover:bg-slate-50"
            onClick={() => handleBulk("archive")}
          >
            Снять
          </button>
          <button
            type="button"
            className="mobile-btn border text-red-600 hover:bg-red-50"
            onClick={() => handleBulk("delete")}
          >
            Удалить
          </button>
          <button type="button" className="mobile-btn border" onClick={clearSelection}>
            Отмена
          </button>
        </div>
      )}

      <ProfileListingsGrid
        items={filtered}
        tab="my"
        canManage={canManage}
        onRemove={onRemove}
        onStatusAction={onStatusAction}
        compact={view === "compact"}
        onAppeal={onAppeal}
        selectable={selectMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
      />
    </div>
  );
}
