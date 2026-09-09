import React from "react";
import { Plus, Link2, Download } from "lucide-react";
import {
  addExternalCompareEntry,
  readCompareCount,
  COMPARE_MAX,
} from "../lib/compareListings";
import { COMPARE_PLATFORMS } from "../lib/comparePlatforms";
import { getCompareConfig } from "../lib/compareConfig";
import { api } from "../lib/api";
import { useI18n } from "../i18n";
import { TOKEN_KEY } from "../lib/auth";
import { Alert, Button, Field, Input, SectionCard, Select } from "../ui";

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
  const [fieldErrors, setFieldErrors] = React.useState({});
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
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
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
    setFieldErrors({});
    setNotice("");
  };

  const importFromUrl = async () => {
    const url = form.url.trim();
    if (!url) {
      setFieldErrors((prev) => ({ ...prev, url: t("compare.pasteUrl") }));
      return;
    }

    setImporting(true);
    setError("");
    setNotice("");

    try {
      const token = localStorage.getItem(TOKEN_KEY) || "";
      if (!token) {
        setError(t("compare.importNeedAuth"));
        return;
      }

      const result = await api.compareImport({ url, cat }, token);
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
      setFieldErrors({
        title: title ? "" : t("compare.titleRequired"),
        price: price ? "" : t("compare.priceRequired"),
      });
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
    <SectionCard
      title={t("compare.externalTitle")}
      description={t("compare.externalHint")}
      icon={Link2}
      action={
        !open && (
          <Button icon={Plus} disabled={full} onClick={() => setOpen(true)}>
            {t("compare.add")}
          </Button>
        )
      }
      bodyClassName="space-y-4"
    >
      {full && (
        <Alert tone="warning">
          {t("compare.listFull", { count: COMPARE_MAX, max: COMPARE_MAX })}
        </Alert>
      )}

      {!open && !full && (
        <p className="text-sm text-ink-400">{t("compare.urlHint")}</p>
      )}

      {open && (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-2.5">
            <Field label={t("compare.urlLabel")} error={fieldErrors.url}>
              {(props) => (
                <Input
                  {...props}
                  type="url"
                  iconLeft={Link2}
                  invalid={Boolean(fieldErrors.url)}
                  value={form.url}
                  onChange={(e) => updateField("url", e.target.value)}
                  placeholder="https://somon.tj/adv/..."
                />
              )}
            </Field>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Button
                icon={Download}
                loading={importing}
                disabled={!form.url.trim()}
                onClick={importFromUrl}
              >
                {t("compare.import")}
              </Button>
              <p className="text-xs text-ink-400">{t("compare.urlHint")}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label={t("compare.platform")}>
              {(props) => (
                <Select
                  {...props}
                  value={form.platform}
                  onChange={(e) => updateField("platform", e.target.value)}
                  options={COMPARE_PLATFORMS}
                />
              )}
            </Field>

            <Field label={t("compare.city")}>
              {(props) => (
                <Input
                  {...props}
                  value={form.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  placeholder={t("compare.cityPlaceholder")}
                />
              )}
            </Field>

            <Field
              label={t("compare.nameLabel")}
              required
              error={fieldErrors.title}
              className="md:col-span-2"
            >
              {(props) => (
                <Input
                  {...props}
                  invalid={Boolean(fieldErrors.title)}
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Toyota Camry 2018"
                />
              )}
            </Field>

            <Field label={t("compare.priceLabel")} required error={fieldErrors.price}>
              {(props) => (
                <Input
                  {...props}
                  inputMode="numeric"
                  invalid={Boolean(fieldErrors.price)}
                  value={form.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  placeholder="85000"
                />
              )}
            </Field>
          </div>

          {specFields.length > 0 && (
            <fieldset className="space-y-3">
              <legend className="field-label">{t("compare.specsTitle")}</legend>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {specFields.map((field) => (
                  <Field key={field.name} label={field.label}>
                    {(props) => (
                      <Input
                        {...props}
                        value={form.specs[field.name] || ""}
                        onChange={(e) => updateSpec(field.name, e.target.value)}
                      />
                    )}
                  </Field>
                ))}
              </div>
            </fieldset>
          )}

          {notice && <Alert tone="success">{notice}</Alert>}
          {error && <Alert tone="danger">{error}</Alert>}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary">
              {t("compare.addToCompare")}
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      )}
    </SectionCard>
  );
}
