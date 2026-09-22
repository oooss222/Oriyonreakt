import React from "react";
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  BarChart3,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { api } from "../../lib/api";
import AdminAdPlacements from "./AdminAdPlacements";
import { getId } from "../../lib/adminUtils";
import {
  AD_FORMATS,
  AD_PLACEMENTS,
  FORMAT_LABELS,
  PLACEMENT_LABELS,
} from "../../lib/adPlacements";
import { formatAdCtr } from "../../lib/adFeed";
import { HOME_CATEGORIES } from "../../data/categories";
import { useI18n } from "../../i18n";

const EMPTY_FORM = {
  title: "",
  advertiser: "",
  placement: "listing_top",
  format: "banner",
  imageUrl: "",
  linkUrl: "",
  headline: "",
  description: "",
  htmlCode: "",
  cat: "",
  priority: 0,
  platforms: "web",
  keywords: "",
  cities: "",
  frequencyCap: 0,
  active: true,
  startsAt: "",
  endsAt: "",
};

function toLocalInput(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (num) => String(num).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export default function AdminAdsSection({ token }) {
  const { t } = useI18n();
  const [items, setItems] = React.useState([]);
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState("");
  const [form, setForm] = React.useState(EMPTY_FORM);

  const load = React.useCallback(async () => {
    try {
      setError("");

      const [list, summary] = await Promise.all([
        api.adminAds(token),
        api.adminAdStats(token),
      ]);

      setItems(Array.isArray(list) ? list : []);
      setStats(summary || null);
    } catch (e) {
      setError(e.message || t("admin.ads.loadError"));
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId("");
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(getId(item));
    setForm({
      title: item.title || "",
      advertiser: item.advertiser || "",
      placement: item.placement || "listing_top",
      format: item.format || "banner",
      imageUrl: item.imageUrl || "",
      linkUrl: item.linkUrl || "",
      headline: item.headline || "",
      description: item.description || "",
      htmlCode: item.htmlCode || "",
      cat: item.cat || "",
      priority: Number(item.priority || 0),
      platforms: Array.isArray(item.platforms) ? item.platforms.join(", ") : "web",
      keywords: Array.isArray(item.keywords) ? item.keywords.join(", ") : "",
      cities: Array.isArray(item.cities) ? item.cities.join(", ") : "",
      frequencyCap: Number(item.frequencyCap || 0),
      active: item.active !== false,
      startsAt: toLocalInput(item.startsAt),
      endsAt: toLocalInput(item.endsAt),
    });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingId("");
    setForm(EMPTY_FORM);
  };

  const uploadBanner = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("images", file);

      const result = await api.uploadImages(token, formData);
      const url = Array.isArray(result?.urls) ? result.urls[0] : "";

      if (!url) {
        throw new Error(t("admin.ads.uploadError"));
      }

      setForm((prev) => ({ ...prev, imageUrl: url }));
    } catch (e) {
      setError(e.message || t("admin.ads.uploadError"));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        title: form.title.trim(),
        advertiser: form.advertiser.trim(),
        placement: form.placement,
        format: form.format,
        imageUrl: form.imageUrl.trim(),
        linkUrl: form.linkUrl.trim(),
        headline: form.headline.trim(),
        description: form.description.trim(),
        htmlCode: form.htmlCode.trim(),
        cat: form.cat,
        priority: Number(form.priority || 0),
        platforms: String(form.platforms || "web")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        keywords: String(form.keywords || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        cities: String(form.cities || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        frequencyCap: Number(form.frequencyCap || 0),
        active: form.active,
        startsAt: fromLocalInput(form.startsAt),
        endsAt: fromLocalInput(form.endsAt),
      };

      if (!payload.title) {
        throw new Error(t("admin.ads.titleRequired"));
      }

      if (editingId) {
        await api.adminUpdateAd(token, editingId, payload);
      } else {
        await api.adminCreateAd(token, payload);
      }

      closeEditor();
      await load();
    } catch (e) {
      setError(e.message || t("admin.ads.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (id) => {
    const ok = confirm(t("admin.ads.deleteConfirm"));

    if (!ok) return;

    try {
      setError("");
      await api.adminDeleteAd(token, id);
      setItems((prev) => prev.filter((item) => String(getId(item)) !== String(id)));
      await load();
    } catch (e) {
      setError(e.message || t("admin.ads.deleteError"));
    }
  };

  if (loading) {
    return (
      <div className="admin-panel p-6 text-sm text-ink-500">
        {t("admin.ads.loading")}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="admin-panel p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-ink-900 flex items-center gap-2">
              <Megaphone className="text-sun" size={22} />
              {t("admin.ads.title")}
            </h2>
            <p className="text-sm text-ink-500 mt-1">
              {t("admin.ads.subtitle")}
            </p>
          </div>

          <button type="button" className="btn btn-primary rounded-xl" onClick={openCreate}>
            <Plus size={18} />
            {t("admin.ads.newCampaign")}
          </button>
        </div>

        <AdminAdPlacements token={token} />

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
            <div className="admin-stat">
              <div className="admin-stat__label">{t("admin.ads.stats.total")}</div>
              <div className="admin-stat__value">{stats.total || 0}</div>
            </div>
            <div className="admin-stat border-emerald-200/80 bg-emerald-50/90">
              <div className="admin-stat__label text-emerald-700">{t("admin.ads.stats.active")}</div>
              <div className="admin-stat__value text-emerald-900">{stats.active || 0}</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat__label flex items-center gap-1">
                <BarChart3 size={14} />
                {t("admin.ads.stats.impressions")}
              </div>
              <div className="admin-stat__value">
                {Number(stats.impressions || 0).toLocaleString("ru-RU")}
              </div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat__label">CTR</div>
              <div className="admin-stat__value">
                {formatAdCtr(stats.clicks, stats.impressions)}
              </div>
              <div className="text-xs text-ink-400">
                {t("admin.ads.clicksCount", {
                  count: Number(stats.clicks || 0).toLocaleString("ru-RU"),
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="admin-panel overflow-hidden">
        <div className="admin-table-wrap border-0 rounded-none">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t("admin.ads.col.campaign")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("admin.ads.col.zone")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("admin.ads.col.format")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("admin.ads.col.stats")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("admin.ads.col.status")}</th>
                <th className="text-right px-4 py-3 font-medium">{t("admin.ads.col.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-500">
                    {t("admin.ads.empty")}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={getId(item)} className="border-t border-mist-100">
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink-900">{item.title}</div>
                      <div className="text-xs text-ink-500">
                        {item.advertiser || t("admin.ads.noAdvertiser")}
                        {item.cat ? ` · ${item.cat}` : t("admin.ads.allCategoriesSuffix")}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {PLACEMENT_LABELS[item.placement] || item.placement}
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {FORMAT_LABELS[item.format] || item.format}
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      <div>{t("admin.ads.impressionsCount", {
                        count: Number(item.impressions || 0).toLocaleString("ru-RU"),
                      })}</div>
                      <div className="text-xs text-ink-400">
                        {t("admin.ads.clicksCount", {
                          count: Number(item.clicks || 0).toLocaleString("ru-RU"),
                        })}{" · "}
                        {formatAdCtr(item.clicks, item.impressions)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-mist-100 text-ink-500"
                        }`}
                      >
                        {item.active ? t("admin.ads.active") : t("admin.ads.inactive")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-xl border px-2 py-1 text-xs font-semibold"
                          onClick={async () => {
                            await api.adminSetAdStatus(
                              token,
                              getId(item),
                              item.active ? "paused" : "active"
                            );
                            await load();
                          }}
                        >
                          {item.active ? "Пауза" : "Включить"}
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-xl border hover:bg-mist-50"
                          onClick={() => openEdit(item)}
                          aria-label={t("admin.ads.edit")}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => removeItem(getId(item))}
                          aria-label={t("a11y.delete")}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editorOpen && (
        <>
          <button
            type="button"
            className="sheet-backdrop sheet-backdrop--top"
            aria-label={t("common.close")}
            onClick={closeEditor}
          />

          <form
            onSubmit={submit}
            className="sheet sheet--top sheet--dialog sheet--dialog-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-ads-modal-title"
          >
            <div className="sheet__handle sm:hidden" aria-hidden="true" />

            <div className="sheet__header">
              <h3 id="admin-ads-modal-title" className="text-lg font-bold text-ink">
                {editingId ? t("admin.ads.editTitle") : t("admin.ads.newTitle")}
              </h3>
              <button
                type="button"
                className="btn-ghost p-2"
                aria-label={t("common.close")}
                onClick={closeEditor}
              >
                <X size={18} />
              </button>
            </div>

            <div className="sheet__body space-y-4 pb-3">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="field">
                <span className="field__label">{t("admin.ads.form.title")}</span>
                <input
                  className="input w-full"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </label>

              <label className="field">
                <span className="field__label">{t("admin.ads.form.advertiser")}</span>
                <input
                  className="input w-full"
                  value={form.advertiser}
                  onChange={(e) => setForm((prev) => ({ ...prev, advertiser: e.target.value }))}
                />
              </label>

              <label className="field">
                <span className="field__label">{t("admin.ads.form.zone")}</span>
                <select
                  className="input w-full"
                  value={form.placement}
                  onChange={(e) => setForm((prev) => ({ ...prev, placement: e.target.value }))}
                >
                  {AD_PLACEMENTS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="field__label">{t("admin.ads.col.format")}</span>
                <select
                  className="input w-full"
                  value={form.format}
                  onChange={(e) => setForm((prev) => ({ ...prev, format: e.target.value }))}
                >
                  {AD_FORMATS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="field__label">{t("admin.ads.form.category")}</span>
                <select
                  className="input w-full"
                  value={form.cat}
                  onChange={(e) => setForm((prev) => ({ ...prev, cat: e.target.value }))}
                >
                  <option value="">{t("admin.ads.allCategoriesOption")}</option>
                  {HOME_CATEGORIES.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="field__label">{t("admin.ads.form.priority")}</span>
                <input
                  type="number"
                  className="input w-full"
                  value={form.priority}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, priority: Number(e.target.value || 0) }))
                  }
                />
              </label>

              <label className="field">
                <span className="field__label">Платформы: web, ios, android</span>
                <input
                  className="input w-full"
                  value={form.platforms}
                  onChange={(e) => setForm((prev) => ({ ...prev, platforms: e.target.value }))}
                />
              </label>

              <label className="field">
                <span className="field__label">Ключевые слова</span>
                <input
                  className="input w-full"
                  value={form.keywords}
                  onChange={(e) => setForm((prev) => ({ ...prev, keywords: e.target.value }))}
                />
              </label>

              <label className="field">
                <span className="field__label">Города</span>
                <input
                  className="input w-full"
                  value={form.cities}
                  onChange={(e) => setForm((prev) => ({ ...prev, cities: e.target.value }))}
                />
              </label>

              <label className="field">
                <span className="field__label">Показов одному зрителю в сутки, 0 = без лимита</span>
                <input
                  type="number"
                  className="input w-full"
                  value={form.frequencyCap}
                  onChange={(e) => setForm((prev) => ({ ...prev, frequencyCap: Number(e.target.value || 0) }))}
                />
              </label>

              <label className="field">
                <span className="field__label">{t("admin.ads.form.startsAt")}</span>
                <input
                  type="datetime-local"
                  className="input w-full"
                  value={form.startsAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))}
                />
              </label>

              <label className="field">
                <span className="field__label">{t("admin.ads.form.endsAt")}</span>
                <input
                  type="datetime-local"
                  className="input w-full"
                  value={form.endsAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, endsAt: e.target.value }))}
                />
              </label>
            </div>

            {form.format !== "html" && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="field md:col-span-2">
                  <span className="field__label">{t("admin.ads.form.headline")}</span>
                  <input
                    className="input w-full"
                    value={form.headline}
                    onChange={(e) => setForm((prev) => ({ ...prev, headline: e.target.value }))}
                  />
                </label>

                <label className="field md:col-span-2">
                  <span className="field__label">{t("admin.ads.form.description")}</span>
                  <textarea
                    className="input w-full min-h-[90px]"
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </label>

                <label className="field md:col-span-2">
                  <span className="field__label">{t("admin.ads.form.link")}</span>
                  <input
                    className="input w-full"
                    value={form.linkUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, linkUrl: e.target.value }))}
                    placeholder="https://"
                  />
                </label>

                <label className="field md:col-span-2">
                  <span className="field__label">{t("admin.ads.form.imageUrl")}</span>
                  <input
                    className="input w-full"
                    value={form.imageUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </label>

                <div className="md:col-span-2">
                  <label className="btn btn-secondary inline-flex cursor-pointer items-center gap-2">
                    <ImageIcon size={16} />
                    {uploading ? t("admin.ads.form.uploading") : t("admin.ads.form.uploadBanner")}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={uploadBanner}
                      disabled={uploading}
                    />
                  </label>

                  {form.imageUrl ? (
                    <img
                      src={form.imageUrl}
                      alt="Preview"
                      className="mt-3 max-h-40 rounded-2xl border border-ink/10 object-cover"
                    />
                  ) : null}
                </div>
              </div>
            )}

            {form.format === "html" && (
              <label className="field">
                <span className="field__label">{t("admin.ads.form.htmlCode")}</span>
                <textarea
                  className="input w-full min-h-[160px] font-mono text-xs"
                  value={form.htmlCode}
                  onChange={(e) => setForm((prev) => ({ ...prev, htmlCode: e.target.value }))}
                  placeholder={t("admin.ads.form.htmlPlaceholder")}
                />
              </label>
            )}

            <label className="inline-flex items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
              />
              {t("admin.ads.form.activeLabel")}
            </label>
            </div>

            <div className="sheet__footer sm:justify-end">
              <button type="button" className="btn btn-secondary rounded-xl" onClick={closeEditor}>
                {t("common.cancel")}
              </button>
              <button type="submit" className="btn btn-primary rounded-xl" disabled={saving}>
                {saving ? t("admin.ads.form.saving") : editingId ? t("common.save") : t("admin.ads.form.create")}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
