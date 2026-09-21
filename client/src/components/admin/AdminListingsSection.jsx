import React from "react";
import { Link } from "react-router-dom";
import { FileText, Trash2, Archive, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../../lib/api";
import { useI18n } from "../../i18n";
import { getId } from "../../lib/adminUtils";
import { getListingThumb } from "../../lib/media";
import { formatPrice } from "../../lib/format";
import { HOME_CATEGORIES } from "../../data/categories";

const PAGE_SIZE = 25;

function CatalogImport({ token, onImported }) {
  const { t } = useI18n();
  const [url, setUrl] = React.useState("");
  const [cat, setCat] = React.useState("phones");
  const [preview, setPreview] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState("");

  const check = async () => {
    try {
      setBusy("preview");
      setError("");
      setResult(null);
      setPreview(await api.adminImportPreview(token, url.trim()));
    } catch (e) {
      setPreview(null);
      setError(e.message || t("admin.listings.loadError"));
    } finally {
      setBusy("");
    }
  };

  const run = async () => {
    try {
      setBusy("import");
      setError("");
      const data = await api.adminImportCatalog(token, url.trim(), cat);
      setResult(data);
      setPreview(data);
      if (onImported) onImported();
    } catch (e) {
      setError(e.message || t("admin.listings.loadError"));
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="rounded-2xl border border-sun-100 bg-sun-50/40 p-4 space-y-3">
      <div>
        <h3 className="font-bold">{t("admin.listings.importTitle")}</h3>
        <p className="text-sm text-ink-500 mt-1">{t("admin.listings.importHint")}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto_auto] gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://"
          className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40 bg-white"
        />
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40 bg-white"
        >
          {HOME_CATEGORIES.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={check}
          disabled={!url.trim() || Boolean(busy)}
          className="btn btn-secondary disabled:opacity-60"
        >
          {busy === "preview" ? t("admin.listings.importPreviewing") : t("admin.listings.importPreview")}
        </button>
        <button
          type="button"
          onClick={run}
          disabled={!preview || Boolean(busy)}
          className="btn btn-primary disabled:opacity-60"
        >
          {busy === "import" ? t("admin.listings.importRunning") : t("admin.listings.importRun")}
        </button>
      </div>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
          {error}
        </div>
      )}
      {preview && (
        <div className="space-y-2">
          <div className="text-sm text-ink-600">
            {preview.seller?.name} · {preview.kind === "listing" ? t("admin.listings.importKindListing") : t("admin.listings.importKindCatalog")} · {t("admin.listings.importFound", { count: preview.total })}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(preview.items || []).map((item) => (
              <div key={item.url} className="rounded-xl border bg-white p-2 text-xs">
                {item.image ? (
                  <img src={getListingThumb({ images: [item.image] })} alt="" className="h-16 w-full object-cover rounded-lg mb-1" />
                ) : null}
                <div className="font-semibold line-clamp-2">{item.title}</div>
                <div className="text-sun-700">{item.price ? formatPrice(item.price) : ""}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {result && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 p-3 text-sm space-y-1">
          <div>{t("admin.listings.importDone", { inserted: result.inserted, updated: result.updated })}</div>
          {result.sellerEmail ? <div>{t("admin.listings.importSeller", { email: result.sellerEmail })}</div> : null}
          {result.sellerPassword ? <div>{t("admin.listings.importPassword", { password: result.sellerPassword })}</div> : null}
        </div>
      )}
    </div>
  );
}

const STATUS_OPTION_KEYS = [
  { value: "all", key: "admin.listings.statusAll" },
  { value: "pending", key: "admin.listings.statusPending" },
  { value: "approved", key: "admin.listings.statusApproved" },
  { value: "rejected", key: "admin.listings.statusRejected" },
  { value: "sold", key: "admin.listings.statusSold" },
  { value: "archived", key: "admin.listings.statusArchived" },
];

const STATUS_LABEL_KEYS = {
  pending: "admin.listings.statusPending",
  approved: "admin.listings.statusApprovedShort",
  rejected: "admin.listings.statusRejectedShort",
  sold: "admin.listings.statusSold",
  archived: "admin.listings.statusArchivedShort",
};

export default function AdminListingsSection({ token }) {
  const { t } = useI18n();
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
      setError(e.message || t("admin.listings.loadError"));
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
    const ok = confirm(t("admin.listings.deleteConfirm"));
    if (!ok) return;

    try {
      setActionLoadingId(id);
      await api.adminDeleteListing(token, id);
      setItems((prev) => prev.filter((item) => String(getId(item)) !== String(id)));
    } catch (e) {
      alert(e.message || t("admin.listings.deleteError"));
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
      alert(e.message || t("admin.listings.archiveError"));
    } finally {
      setActionLoadingId("");
    }
  };

  if (loading) {
    return (
      <div className="admin-panel p-5 animate-pulse h-48" />
    );
  }

  return (
    <div className="admin-panel p-4 md:p-5 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-sm text-sun-700 bg-sun-50 border border-sun-100 rounded-full px-3 py-1 mb-2">
            <FileText className="w-4 h-4" />
            {t("admin.listings.badge")}
          </div>
          <h2 className="text-xl font-bold">{t("admin.listings.title")}</h2>
          <p className="text-sm text-ink-500 mt-1">
            {t("admin.listings.hint")}
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={refreshing}
          className="btn btn-secondary disabled:opacity-60"
        >
          {refreshing ? t("admin.users.refreshing") : t("admin.users.refresh")}
        </button>
      </div>

      <CatalogImport token={token} onImported={load} />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3">
          {error}
        </div>
      )}

      <div className="rounded-2xl border bg-mist-50 p-3 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("admin.listings.searchPlaceholder")}
          className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40 md:col-span-2"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
        >
          {STATUS_OPTION_KEYS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.key)}
            </option>
          ))}
        </select>

        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
        >
          <option value="all">{t("admin.listings.allCategories")}</option>
          {HOME_CATEGORIES.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-2 text-sm text-ink-500">
        <div>{t("admin.listings.shown", { count: items.length })}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            {t("admin.users.back")}
          </button>
          <span>{page}</span>
          <button
            type="button"
            disabled={items.length < PAGE_SIZE}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border disabled:opacity-40"
          >
            {t("admin.users.next")}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border bg-mist-50 p-8 text-center text-ink-500">
          {t("admin.listings.notFound")}
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
                  alt={ad.title || t("admin.listings.untitledAlt")}
                  className="w-full md:w-28 h-24 rounded-xl object-cover bg-mist-100"
                />

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="inline-flex px-2 py-0.5 text-xs rounded-full border bg-mist-50">
                      {(STATUS_LABEL_KEYS[ad.status] && t(STATUS_LABEL_KEYS[ad.status])) || ad.status}
                    </span>
                    <span className="text-xs text-ink-500">
                      {ad.cat}
                      {ad.subcategory ? ` · ${ad.subcategory}` : ""}
                    </span>
                  </div>

                  <Link
                    to={`/ad/${id}`}
                    className="font-semibold hover:text-sun line-clamp-2"
                  >
                    {ad.title || t("admin.listings.untitled")}
                  </Link>

                  <div className="text-sm font-bold mt-1">
                    {formatPrice(ad.price, { emptyLabel: "—" })}
                  </div>

                  <div className="text-sm text-ink-500 mt-1">
                    {ad.location || "—"} · {t("admin.listings.sellerPrefix")}: {ad.ownerName || ad.ownerEmail || "—"}
                  </div>
                </div>

                <div className="flex md:flex-col gap-2 md:min-w-36">
                  <Link
                    to={`/ad/${id}`}
                    className="inline-flex justify-center px-3 py-2 rounded-lg border hover:bg-mist-50 text-sm"
                  >
                    {t("admin.listings.open")}
                  </Link>

                  {ad.status === "approved" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => archiveListing(id)}
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border hover:bg-mist-50 text-sm disabled:opacity-60"
                    >
                      <Archive size={16} />
                      {t("admin.listings.archive")}
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => removeListing(id)}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border text-red-700 hover:bg-red-50 text-sm disabled:opacity-60"
                  >
                    <Trash2 size={16} />
                    {t("admin.listings.delete")}
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
