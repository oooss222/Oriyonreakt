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
import { useI18n } from "../i18n";

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
  const { t } = useI18n();
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
      setError(t("compare.pasteUrl"));
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
        setNotice(t("compare.importSuccess"));
      }
    } catch (err) {
      setError(err?.message || t("compare.importFailed"));
    } finally {
      setImporting(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();

    if (full) {
      setError(t("compare.maxReached", { max: COMPARE_MAX }));
      return;
    }

    const title = form.title.trim();
    const price = form.price.trim();

    if (!title || !price) {
      setError(t("compare.titlePriceRequired"));
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
          <h2 className="text-base font-bold text-ink">
            {t("compare.externalTitle")}
          </h2>
          <p className="text-sm text-ink-400 mt-1">
            {t("compare.externalHint")}
          </p>
        </div>

        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={full}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-mist/70 disabled:opacity-50"
          >
            <Plus size={16} />
            {t("compare.add")}
          </button>
        )}
      </div>

      {full && (
        <p className="text-sm text-sun-700 bg-sun-50 border border-sun/15 rounded-xl px-3 py-2">
          {t("compare.listFull", { count: COMPARE_MAX, max: COMPARE_MAX })}
        </p>
      )}

      {open && (
        <form onSubmit={submit} className="space-y-4 border-t pt-4">
          <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
            <label className="space-y-1.5 block">
              <span className="text-sm font-medium text-ink-600">
                {t("compare.urlLabel")}
              </span>
              <div className="relative">
                <Link2
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
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
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-mist/70 disabled:opacity-50"
            >
              {importing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {t("compare.import")}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <label className="space-y-1.5 block">
              <span className="text-sm font-medium text-ink-600">{t("compare.platform")}</span>
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
              <span className="text-sm font-medium text-ink-600">{t("compare.city")}</span>
              <input
                type="text"
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="Душанбе"
                className="input w-full"
              />
            </label>

            <label className="space-y-1.5 block md:col-span-2">
              <span className="text-sm font-medium text-ink-600">
                {t("compare.nameLabel")} <span className="text-red-500">*</span>
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
              <span className="text-sm font-medium text-ink-600">
                {t("compare.priceLabel")} <span className="text-red-500">*</span>
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
                  <span className="text-sm font-medium text-ink-600">
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
            <p className="text-sm text-lagoon-700 bg-lagoon/5 border border-lagoon/15 rounded-xl px-3 py-2">
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
              {t("compare.addToCompare")}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-mist/70"
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
