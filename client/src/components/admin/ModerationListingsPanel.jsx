import React from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck } from "lucide-react";
import { api } from "../../lib/api";
import { useI18n } from "../../i18n";
import { getId } from "../../lib/adminUtils";
import { getListingThumb } from "../../lib/media";
import { formatPrice } from "../../lib/format";
import ListingGridSkeleton from "../ListingGridSkeleton";
import ModerationReports from "../ModerationReports";
import ModerationStatsPanel from "./ModerationStatsPanel";
import { subscribeModerationQueue } from "../../lib/moderationSocket";

export default function ModerationListingsPanel({ token, embedded = false }) {
  const { t } = useI18n();
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
      setError(e.message || t("admin.moderation.loadError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, status]);

  React.useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

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

  React.useEffect(() => {
    return subscribeModerationQueue(() => {
      load();
    });
  }, [load]);

  const approveAppeal = React.useCallback(
    async (id) => {
      const ok = confirm(t("admin.moderation.approveAppealConfirm"));
      if (!ok) return;

      try {
        setActionLoadingId(id);
        await api.moderationApproveAppeal(token, id);
        setItems((arr) =>
          arr.filter((item) => String(getId(item)) !== String(id))
        );
      } catch (e) {
        alert(e.message || t("admin.moderation.approveAppealError"));
      } finally {
        setActionLoadingId("");
      }
    },
    [token, t]
  );

  const approve = React.useCallback(
    async (id) => {
      const ok = confirm(t("admin.moderation.approveConfirm"));
      if (!ok) return;

      try {
        setActionLoadingId(id);

        await api.moderationApproveListing(token, id);

        setItems((arr) =>
          arr.filter((item) => String(getId(item)) !== String(id))
        );
      } catch (e) {
        alert(e.message || t("admin.moderation.approveError"));
      } finally {
        setActionLoadingId("");
      }
    },
    [token, t]
  );

  const removeListing = React.useCallback(
    async (id) => {
      const ok = confirm(t("admin.listings.deleteConfirm"));

      if (!ok) return;

      try {
        setActionLoadingId(id);

        await api.adminDeleteListing(token, id);

        setItems((arr) =>
          arr.filter((item) => String(getId(item)) !== String(id))
        );
      } catch (e) {
        alert(e.message || t("admin.moderation.deleteError"));
      } finally {
        setActionLoadingId("");
      }
    },
    [token, t]
  );

  const openReject = React.useCallback((ad) => {
    setRejectTarget({ item: ad, kind: "listing" });
    setRejectReason("");
  }, []);

  const openRejectAppeal = React.useCallback((ad) => {
    setRejectTarget({ item: ad, kind: "appeal" });
    setRejectReason("");
  }, []);

  const closeReject = React.useCallback(() => {
    setRejectTarget(null);
    setRejectReason("");
  }, []);

  const submitReject = React.useCallback(async () => {
    if (!rejectTarget) return;

    const { item, kind } = rejectTarget;
    const id = getId(item);
    const reason = rejectReason.trim();

    if (reason.length < 5) {
      alert(t("admin.moderation.reasonTooShort"));
      return;
    }

    try {
      setActionLoadingId(id);

      if (kind === "appeal") {
        await api.moderationRejectAppeal(token, id, reason);
      } else {
        await api.moderationRejectListing(token, id, reason);
      }

      setItems((arr) =>
        arr.filter((entry) => String(getId(entry)) !== String(id))
      );

      closeReject();
    } catch (e) {
      alert(
        e.message ||
          t(
            kind === "appeal"
              ? "admin.moderation.rejectAppealError"
              : "admin.moderation.rejectError"
          )
      );
    } finally {
      setActionLoadingId("");
    }
  }, [token, rejectTarget, rejectReason, closeReject, t]);

  const statusLabel = {
    pending: t("admin.moderation.statusPending"),
    approved: t("admin.moderation.statusApproved"),
    rejected: t("admin.moderation.statusRejected"),
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
        {t("admin.sections.listings")}
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
        {t("admin.sections.reports")}
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

      <ModerationStatsPanel token={token} />

      <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-sun-700 bg-sun-50 border border-sun-100 rounded-full px-3 py-1 mb-2">
              <ClipboardCheck className="w-4 h-4" />
              {t("admin.moderation.badge")}
            </div>

            <h2 className="text-xl font-bold">{t("admin.moderation.title")}</h2>

            <p className="text-sm text-slate-500 mt-1">
              {t("admin.moderation.hint")}
            </p>
          </div>

          <button
            onClick={load}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl border hover:bg-slate-50 disabled:opacity-60"
          >
            {refreshing ? t("admin.users.refreshing") : t("admin.users.refresh")}
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
            <div className="text-xs text-slate-500">{t("admin.moderation.currentSection")}</div>
            <div className="text-lg font-bold">{t("admin.moderation.statusPending")}</div>
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
            <div className="text-xs text-slate-500">{t("admin.moderation.currentSection")}</div>
            <div className="text-lg font-bold">{t("admin.moderation.statusApproved")}</div>
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
            <div className="text-xs text-slate-500">{t("admin.moderation.currentSection")}</div>
            <div className="text-lg font-bold">{t("admin.moderation.statusRejected")}</div>
          </button>

          <div className="rounded-2xl border bg-sun-50 p-4">
            <div className="text-xs text-sun-700">{t("admin.moderation.shownLabel")}</div>
            <div className="text-2xl font-bold text-sun-700">{stats.filtered}</div>
            <div className="text-xs text-sun-700">{t("admin.moderation.ofTotal", { total: stats.loaded })}</div>
          </div>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("admin.moderation.searchPlaceholder")}
            className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40 md:col-span-2"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
          >
            <option value="pending">{t("admin.moderation.statusPending")}</option>
            <option value="approved">{t("admin.moderation.statusApproved")}</option>
            <option value="rejected">{t("admin.moderation.statusRejected")}</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl border bg-slate-50 p-3">
            <div className="text-slate-500">{t("admin.moderation.withImages")}</div>
            <div className="font-bold">{stats.withImages}</div>
          </div>

          <div className="rounded-xl border bg-slate-50 p-3">
            <div className="text-slate-500">{t("admin.moderation.withoutImages")}</div>
            <div className="font-bold">{stats.withoutImages}</div>
          </div>

          <div className="rounded-xl border bg-slate-50 p-3">
            <div className="text-slate-500">{t("admin.moderation.statusLabel")}</div>
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
            {t("admin.listings.notFound")}
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
                      alt={ad.title || t("admin.listings.untitledAlt")}
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

                      {ad.ownerTrustLevel === "trusted" && (
                        <span className="inline-flex px-2 py-0.5 text-xs rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                          {t("admin.moderation.trusted")}
                        </span>
                      )}

                      {Number(ad.reportCount || 0) > 0 && (
                        <span className="inline-flex px-2 py-0.5 text-xs rounded-full border bg-red-50 text-red-700 border-red-200">
                          {t("admin.moderation.reportsCount", { count: ad.reportCount })}
                        </span>
                      )}

                      {ad.appealStatus === "pending" && (
                        <span className="inline-flex px-2 py-0.5 text-xs rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
                          {t("admin.moderation.appeal")}
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/ad/${id}`}
                      onClick={() =>
                        sessionStorage.setItem("ad_preview", JSON.stringify(ad))
                      }
                      className="font-semibold text-slate-900 hover:text-sun line-clamp-2"
                    >
                      {ad.title || t("admin.listings.untitled")}
                    </Link>

                    <div className="text-sm text-slate-500 mt-1">
                      {ad.location || t("admin.moderation.noLocation")} · {ad.cat || "—"}
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

                    {Array.isArray(ad.moderationFlags) && ad.moderationFlags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {ad.moderationFlags.map((flag) => (
                          <span
                            key={`${id}-${flag.code}`}
                            className="inline-flex px-2 py-0.5 text-[11px] rounded-full border bg-amber-50 text-amber-800 border-amber-200"
                          >
                            {flag.message}
                          </span>
                        ))}
                      </div>
                    )}

                    {Array.isArray(ad.contentDiff) && ad.contentDiff.length > 0 && (
                      <div className="mt-3 rounded-xl border bg-slate-50 p-3 text-xs space-y-1">
                        <div className="font-semibold text-slate-700">{t("admin.moderation.changes")}</div>
                        {ad.contentDiff.map((change) => (
                          <div key={`${id}-${change.field}`} className="text-slate-600">
                            <b>{change.label}:</b> {change.before} → {change.after}
                          </div>
                        ))}
                      </div>
                    )}

                    {ad.appealText && (
                      <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
                        <b>{t("admin.moderation.appeal")}:</b> {ad.appealText}
                      </div>
                    )}

                    {ad.autoModerationReason && (
                      <div className="mt-2 text-xs text-slate-500">
                        {t("admin.moderation.autoCheck")}: {ad.autoModerationReason}
                      </div>
                    )}

                    {ad.rejectionReason && (
                      <div className="mt-3 rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
                        <b>{t("admin.moderation.rejectionReasonLabel")}:</b> {ad.rejectionReason}
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
                      {t("admin.listings.open")}
                    </Link>

                    {status === "pending" && (
                      <>
                        {ad.appealStatus === "pending" ? (
                          <>
                            <button
                              onClick={() => approveAppeal(id)}
                              disabled={isBusy}
                              className="inline-flex justify-center px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                            >
                              {t("admin.moderation.approveAppeal")}
                            </button>

                            <button
                              onClick={() => openRejectAppeal(ad)}
                              disabled={isBusy}
                              className="inline-flex justify-center px-3 py-2 rounded-lg border text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
                            >
                              {t("admin.moderation.rejectAppeal")}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => approve(id)}
                              disabled={isBusy}
                              className="inline-flex justify-center px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {isBusy ? "..." : t("admin.moderation.approve")}
                            </button>

                            <button
                              onClick={() => openReject(ad)}
                              disabled={isBusy}
                              className="inline-flex justify-center px-3 py-2 rounded-lg border text-red-600 hover:bg-red-50 disabled:opacity-60"
                            >
                              {t("admin.moderation.reject")}
                            </button>
                          </>
                        )}
                      </>
                    )}

                    <button
                      onClick={() => removeListing(id)}
                      disabled={isBusy}
                      className="inline-flex justify-center px-3 py-2 rounded-lg border text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      {t("admin.listings.delete")}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {rejectTarget && (
          <div
            className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="moderation-reject-modal-title"
          >
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border p-5 space-y-4">
              <div>
                <h3 id="moderation-reject-modal-title" className="text-lg font-bold">
                  {rejectTarget.kind === "appeal"
                    ? t("admin.moderation.rejectAppealModalTitle")
                    : t("admin.moderation.rejectModalTitle")}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {rejectTarget.kind === "appeal"
                    ? t("admin.moderation.rejectAppealModalHint")
                    : t("admin.moderation.rejectModalHint")}
                </p>
              </div>

              <div className="rounded-xl border bg-slate-50 p-3">
                <div className="text-sm font-semibold">
                  {rejectTarget.item.title || t("admin.listings.untitled")}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  ID: {String(getId(rejectTarget.item)).slice(0, 8)}...
                </div>
              </div>

              <label className="block">
                <div className="text-sm font-medium mb-1">{t("admin.moderation.rejectReasonLabel")}</div>

                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={5}
                  placeholder={t("admin.moderation.rejectReasonPlaceholder")}
                  className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-sun/40 resize-y"
                />
              </label>

              <div className="text-xs text-slate-500">
                {t("admin.moderation.reasonMinLength", { count: rejectReason.trim().length })}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeReject}
                  className="px-4 py-2 rounded-xl border hover:bg-slate-50"
                >
                  {t("common.cancel")}
                </button>

                <button
                  type="button"
                  onClick={submitReject}
                  disabled={
                    rejectReason.trim().length < 5 ||
                    actionLoadingId === getId(rejectTarget.item)
                  }
                  className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {actionLoadingId === getId(rejectTarget.item)
                    ? t("admin.moderation.rejecting")
                    : t("admin.moderation.reject")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
