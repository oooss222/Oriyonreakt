import React from "react";
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  BarChart3,
  Image as ImageIcon,
} from "lucide-react";
import { api } from "../../lib/api";
import { getId } from "../../lib/adminUtils";
import {
  AD_FORMATS,
  AD_PLACEMENTS,
  FORMAT_LABELS,
  PLACEMENT_LABELS,
} from "../../lib/adPlacements";
import { formatAdCtr } from "../../lib/adFeed";
import { HOME_CATEGORIES } from "../../data/categories";

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
      setError(e.message || "Не удалось загрузить рекламу");
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
        throw new Error("Не удалось загрузить изображение");
      }

      setForm((prev) => ({ ...prev, imageUrl: url }));
    } catch (e) {
      setError(e.message || "Не удалось загрузить изображение");
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
        active: form.active,
        startsAt: fromLocalInput(form.startsAt),
        endsAt: fromLocalInput(form.endsAt),
      };

      if (!payload.title) {
        throw new Error("Укажите название кампании");
      }

      if (editingId) {
        await api.adminUpdateAd(token, editingId, payload);
      } else {
        await api.adminCreateAd(token, payload);
      }

      closeEditor();
      await load();
    } catch (e) {
      setError(e.message || "Не удалось сохранить рекламу");
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (id) => {
    const ok = confirm("Удалить рекламную кампанию?");

    if (!ok) return;

    try {
      setError("");
      await api.adminDeleteAd(token, id);
      setItems((prev) => prev.filter((item) => String(getId(item)) !== String(id)));
      await load();
    } catch (e) {
      setError(e.message || "Не удалось удалить рекламу");
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-sm text-slate-500">
        Загрузка рекламных кампаний...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-white p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="text-sun" size={22} />
              Реклама
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Управление баннерами, native-блоками и HTML-кодом рекламных сетей.
            </p>
          </div>

          <button type="button" className="btn btn-primary rounded-xl" onClick={openCreate}>
            <Plus size={18} />
            Новая кампания
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
            <div className="rounded-2xl border bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Кампаний</div>
              <div className="text-2xl font-bold text-slate-900">{stats.total || 0}</div>
            </div>
            <div className="rounded-2xl border bg-emerald-50 p-4">
              <div className="text-xs text-emerald-700">Активных</div>
              <div className="text-2xl font-bold text-emerald-900">{stats.active || 0}</div>
            </div>
            <div className="rounded-2xl border bg-white p-4">
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <BarChart3 size={14} />
                Показы
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {Number(stats.impressions || 0).toLocaleString("ru-RU")}
              </div>
            </div>
            <div className="rounded-2xl border bg-white p-4">
              <div className="text-xs text-slate-500">CTR</div>
              <div className="text-2xl font-bold text-slate-900">
                {formatAdCtr(stats.clicks, stats.impressions)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {Number(stats.clicks || 0).toLocaleString("ru-RU")} кликов
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

      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Кампания</th>
                <th className="text-left px-4 py-3 font-medium">Зона</th>
                <th className="text-left px-4 py-3 font-medium">Формат</th>
                <th className="text-left px-4 py-3 font-medium">Статистика</th>
                <th className="text-left px-4 py-3 font-medium">Статус</th>
                <th className="text-right px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Рекламных кампаний пока нет.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={getId(item)} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{item.title}</div>
                      <div className="text-xs text-slate-500">
                        {item.advertiser || "Без рекламодателя"}
                        {item.cat ? ` · ${item.cat}` : " · все категории"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {PLACEMENT_LABELS[item.placement] || item.placement}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {FORMAT_LABELS[item.format] || item.format}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{Number(item.impressions || 0).toLocaleString("ru-RU")} показов</div>
                      <div className="text-xs text-slate-400">
                        {Number(item.clicks || 0).toLocaleString("ru-RU")} кликов ·{" "}
                        {formatAdCtr(item.clicks, item.impressions)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.active ? "Активна" : "Выключена"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="p-2 rounded-xl border hover:bg-slate-50"
                          onClick={() => openEdit(item)}
                          aria-label="Редактировать"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => removeItem(getId(item))}
                          aria-label="Удалить"
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
        <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center p-0 md:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Закрыть"
            onClick={closeEditor}
          />

          <form
            onSubmit={submit}
            className="relative w-full md:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-3xl md:rounded-3xl bg-white p-5 md:p-6 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingId ? "Редактировать кампанию" : "Новая рекламная кампания"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block space-y-1">
                <span className="text-sm text-slate-600">Название кампании</span>
                <input
                  className="input w-full"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm text-slate-600">Рекламодатель</span>
                <input
                  className="input w-full"
                  value={form.advertiser}
                  onChange={(e) => setForm((prev) => ({ ...prev, advertiser: e.target.value }))}
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm text-slate-600">Зона показа</span>
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

              <label className="block space-y-1">
                <span className="text-sm text-slate-600">Формат</span>
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

              <label className="block space-y-1">
                <span className="text-sm text-slate-600">Категория (опционально)</span>
                <select
                  className="input w-full"
                  value={form.cat}
                  onChange={(e) => setForm((prev) => ({ ...prev, cat: e.target.value }))}
                >
                  <option value="">Все категории</option>
                  {HOME_CATEGORIES.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-sm text-slate-600">Приоритет</span>
                <input
                  type="number"
                  className="input w-full"
                  value={form.priority}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, priority: Number(e.target.value || 0) }))
                  }
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm text-slate-600">Старт</span>
                <input
                  type="datetime-local"
                  className="input w-full"
                  value={form.startsAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))}
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm text-slate-600">Окончание</span>
                <input
                  type="datetime-local"
                  className="input w-full"
                  value={form.endsAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, endsAt: e.target.value }))}
                />
              </label>
            </div>

            {form.format !== "html" && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block space-y-1 md:col-span-2">
                  <span className="text-sm text-slate-600">Заголовок для пользователя</span>
                  <input
                    className="input w-full"
                    value={form.headline}
                    onChange={(e) => setForm((prev) => ({ ...prev, headline: e.target.value }))}
                  />
                </label>

                <label className="block space-y-1 md:col-span-2">
                  <span className="text-sm text-slate-600">Описание</span>
                  <textarea
                    className="input w-full min-h-[90px]"
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </label>

                <label className="block space-y-1 md:col-span-2">
                  <span className="text-sm text-slate-600">Ссылка</span>
                  <input
                    className="input w-full"
                    value={form.linkUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, linkUrl: e.target.value }))}
                    placeholder="https://"
                  />
                </label>

                <label className="block space-y-1 md:col-span-2">
                  <span className="text-sm text-slate-600">URL изображения</span>
                  <input
                    className="input w-full"
                    value={form.imageUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </label>

                <div className="md:col-span-2">
                  <label className="inline-flex items-center gap-2 btn rounded-xl cursor-pointer">
                    <ImageIcon size={16} />
                    {uploading ? "Загрузка..." : "Загрузить баннер"}
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
                      className="mt-3 max-h-40 rounded-2xl border object-cover"
                    />
                  ) : null}
                </div>
              </div>
            )}

            {form.format === "html" && (
              <label className="block space-y-1 mt-4">
                <span className="text-sm text-slate-600">HTML / код рекламной сети</span>
                <textarea
                  className="input w-full min-h-[160px] font-mono text-xs"
                  value={form.htmlCode}
                  onChange={(e) => setForm((prev) => ({ ...prev, htmlCode: e.target.value }))}
                  placeholder="<script>...</script> или iframe"
                />
              </label>
            )}

            <label className="mt-4 inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
              />
              Кампания активна
            </label>

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button type="button" className="btn rounded-xl" onClick={closeEditor}>
                Отмена
              </button>
              <button type="submit" className="btn btn-primary rounded-xl" disabled={saving}>
                {saving ? "Сохраняем..." : editingId ? "Сохранить" : "Создать"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
