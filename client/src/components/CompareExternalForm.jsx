import React from "react";
import { Plus, Link2, Download, Loader2 } from "lucide-react";
import {
  addExternalCompareEntry,
  readCompareCount,
  COMPARE_MAX,
} from "../lib/compareListings";
import { COMPARE_PLATFORMS } from "../lib/comparePlatforms";
import { getCompareConfig } from "../lib/compareConfig";
import { api } from "../lib/api";

const EMPTY_FORM = {
  platform: "somon",
  url: "",
  title: "",
  price: "",
  location: "",
  specs: {},
};

function detectPlatformFromUrl(url = "") {
  const value = String(url).toLowerCase();
  if (value.includes("somon.tj")) return "somon";
  if (value.includes("paydo.tj")) return "paydo";
  if (value.includes("alon.tj")) return "alon";
  if (value.includes("savdo.tj")) return "savdo";
  return "other";
}

function specsArrayToMap(specs = []) {
  return Object.fromEntries(
    specs
      .filter((row) => row?.name && row?.value)
      .map((row) => [String(row.name).trim(), String(row.value).trim()])
  );
}

export default function CompareExternalForm({ cat, onAdded }) {
  const config = getCompareConfig(cat);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [importing, setImporting] = React.useState(false);
  const count = readCompareCount(cat);
  const full = count >= COMPARE_MAX;

  if (!config) return null;

  const specFields = config.manualSpecFields || [];

  const updateField = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "url") {
        next.platform = detectPlatformFromUrl(value) || prev.platform;
      }
      return next;
    });
    setError("");
    setNotice("");
  };

  const updateSpec = (name, value) => {
    setForm((prev) => ({
      ...prev,
      specs: { ...prev.specs, [name]: value },
    }));
    setError("");
    setNotice("");
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setError("");
    setNotice("");
  };

  const importFromUrl = async () => {
    const url = form.url.trim();
    if (!url) {
      setError("Вставьте ссылку на объявление");
      return;
    }

    setImporting(true);
    setError("");
    setNotice("");

    try {
      const result = await api.compareImport({ url, cat });
      const snapshot = result?.snapshot || {};

      setForm((prev) => ({
        ...prev,
        platform: result?.platform || detectPlatformFromUrl(url) || prev.platform,
        url: result?.url || url,
        title: snapshot.title || prev.title,
        price: snapshot.price || prev.price,
        location: snapshot.location || prev.location,
        specs: {
          ...prev.specs,
          ...specsArrayToMap(snapshot.specs),
        },
      }));

      if (Array.isArray(result?.warnings) && result.warnings.length) {
        setNotice(result.warnings.join(" "));
      } else {
        setNotice("Данные загружены. Проверьте поля и нажмите «Добавить в сравнение».");
      }
    } catch (err) {
      setError(err?.message || "Не удалось загрузить объявление по ссылке");
    } finally {
      setImporting(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();

    if (full) {
      setError(`Максимум ${COMPARE_MAX} объявления в сравнении`);
      return;
    }

    const title = form.title.trim();
    const price = form.price.trim();

    if (!title || !price) {
      setError("Укажите название и цену");
      return;
    }

    const specs = specFields
      .map((field) => ({
        name: field.name,
        value: String(form.specs[field.name] || "").trim(),
      }))
      .filter((row) => row.value);

    addExternalCompareEntry(cat, {
      platform: form.platform,
      url: form.url.trim(),
      title,
      price,
      location: form.location.trim(),
      specs,
    });

    resetForm();
    setOpen(false);
    onAdded?.();
  };

  return (
    <section className="rounded-2xl border bg-white p-4 md:p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Объявление с другой площадки
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Вставьте ссылку с Somon или Paydo — поля заполнятся автоматически
          </p>
        </div>

        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={full}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            <Plus size={16} />
            Добавить
          </button>
        )}
      </div>

      {full && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          Список сравнения заполнен ({COMPARE_MAX}/{COMPARE_MAX}). Удалите объявление, чтобы добавить новое.
        </p>
      )}

      {open && (
        <form onSubmit={submit} className="space-y-4 border-t pt-4">
          <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
            <label className="space-y-1.5 block">
              <span className="text-sm font-medium text-slate-700">
                Ссылка на объявление
              </span>
              <div className="relative">
                <Link2
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => updateField("url", e.target.value)}
                  placeholder="https://somon.tj/adv/..."
                  className="input w-full pl-9"
                />
              </div>
            </label>

            <button
              type="button"
              onClick={importFromUrl}
              disabled={importing || !form.url.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              {importing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Загрузить
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <label className="space-y-1.5 block">
              <span className="text-sm font-medium text-slate-700">Площадка</span>
              <select
                value={form.platform}
                onChange={(e) => updateField("platform", e.target.value)}
                className="input w-full"
              >
                {COMPARE_PLATFORMS.map((row) => (
                  <option key={row.value} value={row.value}>
                    {row.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 block">
              <span className="text-sm font-medium text-slate-700">Город</span>
              <input
                type="text"
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="Душанбе"
                className="input w-full"
              />
            </label>

            <label className="space-y-1.5 block md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Название <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Toyota Camry 2018"
                className="input w-full"
                required
              />
            </label>

            <label className="space-y-1.5 block">
              <span className="text-sm font-medium text-slate-700">
                Цена <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                value={form.price}
                onChange={(e) => updateField("price", e.target.value)}
                placeholder="85000"
                className="input w-full"
                required
              />
            </label>
          </div>

          {specFields.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {specFields.map((field) => (
                <label key={field.name} className="space-y-1.5 block">
                  <span className="text-sm font-medium text-slate-700">
                    {field.label}
                  </span>
                  <input
                    type="text"
                    value={form.specs[field.name] || ""}
                    onChange={(e) => updateSpec(field.name, e.target.value)}
                    className="input w-full"
                  />
                </label>
              ))}
            </div>
          )}

          {notice && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
              {notice}
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn btn-primary">
              Добавить в сравнение
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Отмена
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
