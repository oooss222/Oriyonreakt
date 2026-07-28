import React from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck } from "lucide-react";
import { api } from "../../lib/api";
import { getId } from "../../lib/adminUtils";
import { getListingThumb } from "../../lib/media";
import { formatPrice } from "../../lib/format";
import ListingGridSkeleton from "../ListingGridSkeleton";
import ModerationReports from "../ModerationReports";

export default function ModerationListingsPanel({ token, embedded = false }) {
  const [panelMode, setPanelMode] = React.useState("listings");
  const [items, setItems] = React.useState([]);
  const [status, setStatus] = React.useState("pending");
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");

  const [rejectTarget, setRejectTarget] = React.useState(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [actionLoadingId, setActionLoadingId] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const data = await api.moderationListings(token, status);

      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Ошибка загрузки модерации");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, status]);

  React.useEffect(() => {
    let alive = true;

    setLoading(true);
    setError("");

    api
      .moderationListings(token, status)
      .then((data) => {
        if (alive) {
          setItems(Array.isArray(data) ? data : []);
        }
      })
      .catch((e) => {
        if (alive) {
          setError(e.message || "Ошибка загрузки модерации");
        }
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [token, status]);

  const filteredItems = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return items;

    return items.filter((ad) => {
      const title = String(ad.title || "").toLowerCase();
      const description = String(ad.description || "").toLowerCase();
      const location = String(ad.location || "").toLowerCase();
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
  }, [items, query]);

  const stats = React.useMemo(() => {
    return {
      loaded: items.length,
      filtered: filteredItems.length,
      withImages: items.filter((ad) => ad?.images?.length).length,
      withoutImages: items.filter((ad) => !ad?.images?.length).length,
    };
  }, [items, filteredItems]);

  const approve = React.useCallback(
    async (id) => {
      const ok = confirm("Принять это объявление и опубликовать его?");
      if (!ok) return;

      try {
        setActionLoadingId(id);

        await api.moderationApproveListing(token, id);

        setItems((arr) =>
          arr.filter((item) => String(getId(item)) !== String(id))
        );
      } catch (e) {
        alert(e.message || "Ошибка принятия объявления");
      } finally {
        setActionLoadingId("");
      }
    },
    [token]
  );

  const removeListing = React.useCallback(
    async (id) => {
      const ok = confirm("Удалить объявление полностью?");

      if (!ok) return;

      try {
        setActionLoadingId(id);

        await api.adminDeleteListing(token, id);

        setItems((arr) =>
          arr.filter((item) => String(getId(item)) !== String(id))
        );
      } catch (e) {
        alert(e.message || "Ошибка удаления");
      } finally {
        setActionLoadingId("");
      }
    },
    [token]
  );

  const openReject = React.useCallback((ad) => {
    setRejectTarget(ad);
    setRejectReason("");
  }, []);

  const closeReject = React.useCallback(() => {
    setRejectTarget(null);
    setRejectReason("");
  }, []);

  const submitReject = React.useCallback(async () => {
    if (!rejectTarget) return;

    const id = getId(rejectTarget);
    const reason = rejectReason.trim();

    if (reason.length < 5) {
      alert("Причина должна быть не короче 5 символов");
      return;
    }

    try {
      setActionLoadingId(id);

      await api.moderationRejectListing(token, id, reason);

      setItems((arr) =>
        arr.filter((item) => String(getId(item)) !== String(id))
      );

      closeReject();
    } catch (e) {
      alert(e.message || "Ошибка отклонения объявления");
    } finally {
      setActionLoadingId("");
    }
  }, [token, rejectTarget, rejectReason, closeReject]);

  const statusLabel = {
    pending: "На проверке",
    approved: "Принятые",
    rejected: "Отклонённые",
  };

  const statusBadgeClass = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };

  const modeSwitch = (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setPanelMode("listings")}
        className={`px-4 py-2 rounded-xl border text-sm font-medium ${
          panelMode === "listings"
            ? "bg-slate-900 text-white border-slate-900"
            : "bg-white"
        }`}
      >
        Объявления
      </button>
      <button
        type="button"
        onClick={() => setPanelMode("reports")}
        className={`px-4 py-2 rounded-xl border text-sm font-medium ${
          panelMode === "reports"
            ? "bg-slate-900 text-white border-slate-900"
            : "bg-white"
        }`}
      >
        Жалобы
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {!embedded && modeSwitch}

        {panelMode === "reports" ? (
          <ModerationReports token={token} />
        ) : (
          <div className="rounded-2xl border bg-white p-4 md:p-5">
            <ListingGridSkeleton count={6} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
          </div>
        )}
      </div>
    );
  }

  if (panelMode === "reports") {
    return (
      <div className="space-y-4">
        {!embedded && modeSwitch}
        <ModerationReports token={token} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!embedded && modeSwitch}

      <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-sun-700 bg-sun-50 border border-sun-100 rounded-full px-3 py-1 mb-2">
              <ClipboardCheck className="w-4 h-4" />
              Панель модератора
            </div>

            <h2 className="text-xl font-bold">Модерация объявлений</h2>

            <p className="text-sm text-slate-500 mt-1">
              Проверка, публикация и отклонение объявлений пользователей.
            </p>
          </div>

          <button
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setStatus("pending")}
            className={`text-left rounded-2xl border p-4 transition ${
              status === "pending"
                ? "bg-amber-50 border-amber-200"
                : "bg-slate-50 hover:bg-slate-100"
            }`}
          >
            <div className="text-xs text-slate-500">Текущий раздел</div>
            <div className="text-lg font-bold">На проверке</div>
          </button>

          <button
            type="button"
            onClick={() => setStatus("approved")}
            className={`text-left rounded-2xl border p-4 transition ${
              status === "approved"
                ? "bg-emerald-50 border-emerald-200"
                : "bg-slate-50 hover:bg-slate-100"
            }`}
          >
            <div className="text-xs text-slate-500">Текущий раздел</div>
            <div className="text-lg font-bold">Принятые</div>
          </button>

          <button
            type="button"
            onClick={() => setStatus("rejected")}
            className={`text-left rounded-2xl border p-4 transition ${
              status === "rejected"
                ? "bg-red-50 border-red-200"
                : "bg-slate-50 hover:bg-slate-100"
            }`}
          >
            <div className="text-xs text-slate-500">Текущий раздел</div>
            <div className="text-lg font-bold">Отклонённые</div>
          </button>

          <div className="rounded-2xl border bg-sun-50 p-4">
            <div className="text-xs text-sun-700">Показано</div>
            <div className="text-2xl font-bold text-sun-700">{stats.filtered}</div>
            <div className="text-xs text-sun-700">из {stats.loaded}</div>
          </div>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск: название, описание, город, категория"
            className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40 md:col-span-2"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
          >
            <option value="pending">На проверке</option>
            <option value="approved">Принятые</option>
            <option value="rejected">Отклонённые</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl border bg-slate-50 p-3">
            <div className="text-slate-500">С фото</div>
            <div className="font-bold">{stats.withImages}</div>
          </div>

          <div className="rounded-xl border bg-slate-50 p-3">
            <div className="text-slate-500">Без фото</div>
            <div className="font-bold">{stats.withoutImages}</div>
          </div>

          <div className="rounded-xl border bg-slate-50 p-3">
            <div className="text-slate-500">Статус</div>
            <div
              className={`inline-flex mt-1 px-2 py-0.5 text-xs rounded-full border ${
                statusBadgeClass[status]
              }`}
            >
              {statusLabel[status]}
            </div>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border bg-slate-50 p-8 text-center text-slate-500">
            Объявления не найдены.
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredItems.map((ad) => {
              const id = getId(ad);
              const img = getListingThumb(ad);
              const isBusy = actionLoadingId === id;

              return (
                <article
                  key={id}
                  className="rounded-2xl border bg-white p-3 md:p-4 grid grid-cols-1 md:grid-cols-[160px_1fr_auto] gap-4 hover:shadow-md transition"
                >
                  <Link
                    to={`/ad/${id}`}
                    onClick={() =>
                      sessionStorage.setItem("ad_preview", JSON.stringify(ad))
                    }
                    className="block"
                  >
                    <img
                      src={img}
                      alt={ad.title || "Объявление"}
                      className="w-full md:w-40 h-36 md:h-28 rounded-xl object-cover bg-slate-100"
                      loading="lazy"
                    />
                  </Link>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs rounded-full border ${
                          statusBadgeClass[ad.status || status]
                        }`}
                      >
                        {statusLabel[ad.status || status] || ad.status}
                      </span>

                      <span className="text-xs text-slate-500">
                        ID: {String(id).slice(0, 8)}...
                      </span>
                    </div>

                    <Link
                      to={`/ad/${id}`}
                      onClick={() =>
                        sessionStorage.setItem("ad_preview", JSON.stringify(ad))
                      }
                      className="font-semibold text-slate-900 hover:text-sun line-clamp-2"
                    >
                      {ad.title || "Без названия"}
                    </Link>

                    <div className="text-sm text-slate-500 mt-1">
                      {ad.location || "Локация не указана"} · {ad.cat || "—"}
                      {ad.subcategory ? ` · ${ad.subcategory}` : ""}
                    </div>

                    <div className="text-sm font-bold mt-1">
                      {formatPrice(ad.price, { emptyLabel: "—" })}
                    </div>

                    {ad.description && (
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                        {ad.description}
                      </p>
                    )}

                    {ad.rejectionReason && (
                      <div className="mt-3 rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
                        <b>Причина отклонения:</b> {ad.rejectionReason}
                      </div>
                    )}
                  </div>

                  <div className="flex md:flex-col gap-2 md:min-w-36">
                    <Link
                      to={`/ad/${id}`}
                      onClick={() =>
                        sessionStorage.setItem("ad_preview", JSON.stringify(ad))
                      }
                      className="inline-flex justify-center px-3 py-2 rounded-lg border hover:bg-slate-50"
                    >
                      Открыть
                    </Link>

                    {status === "pending" && (
                      <>
                        <button
                          onClick={() => approve(id)}
                          disabled={isBusy}
                          className="inline-flex justify-center px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {isBusy ? "..." : "Принять"}
                        </button>

                        <button
                          onClick={() => openReject(ad)}
                          disabled={isBusy}
                          className="inline-flex justify-center px-3 py-2 rounded-lg border text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          Отклонить
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => removeListing(id)}
                      disabled={isBusy}
                      className="inline-flex justify-center px-3 py-2 rounded-lg border text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      Удалить
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {rejectTarget && (
          <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border p-5 space-y-4">
              <div>
                <h3 className="text-lg font-bold">Отклонить объявление</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Укажите понятную причину, чтобы пользователь мог исправить объявление.
                </p>
              </div>

              <div className="rounded-xl border bg-slate-50 p-3">
                <div className="text-sm font-semibold">
                  {rejectTarget.title || "Без названия"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  ID: {String(getId(rejectTarget)).slice(0, 8)}...
                </div>
              </div>

              <label className="block">
                <div className="text-sm font-medium mb-1">Причина отклонения</div>

                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={5}
                  placeholder="Например: недостаточно информации, запрещённый товар, некорректная категория..."
                  className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-sun/40 resize-y"
                />
              </label>

              <div className="text-xs text-slate-500">
                Минимум 5 символов. Сейчас: {rejectReason.trim().length}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeReject}
                  className="px-4 py-2 rounded-xl border hover:bg-slate-50"
                >
                  Отмена
                </button>

                <button
                  type="button"
                  onClick={submitReject}
                  disabled={
                    rejectReason.trim().length < 5 ||
                    actionLoadingId === getId(rejectTarget)
                  }
                  className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {actionLoadingId === getId(rejectTarget)
                    ? "Отклоняем..."
                    : "Отклонить"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
