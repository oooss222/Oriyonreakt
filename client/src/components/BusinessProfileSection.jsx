import React from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Building2,
  Clock3,
  Crown,
  Eye,
  Globe,
  Instagram,
  LayoutGrid,
  MapPin,
  MessageCircle,
  RefreshCw,
  Upload,
} from "lucide-react";
import { api } from "../lib/api";
import { openBusinessSupportChat } from "../lib/openBusinessSupportChat";
import BusinessBadge from "./BusinessBadge";
import {
  Alert,
  Button,
  Checkbox,
  Field,
  Input,
  SectionCard,
  Skeleton,
  Textarea,
  useToast,
} from "../ui";
import { useI18n, getBusinessBenefits } from "../i18n";
import {
  formatAutoBumpInterval,
  isCompanyAccount,
  MAX_AUTO_BUMP_INTERVAL_HOURS,
  MIN_AUTO_BUMP_INTERVAL_HOURS,
  normalizeAutoBumpIntervalHours,
} from "../lib/businessAccount";

function formatDateTime(value, t) {
  if (!value || Number.isNaN(Date.parse(value))) return t("business.neverRun");

  return new Date(value).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatTile({ icon: Icon, label, value, loading }) {
  return (
    <div className="surface-muted p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-ink-400">
        <Icon size={14} aria-hidden="true" />
        {label}
      </p>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-20" />
      ) : (
        <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-ink-900">
          {value}
        </p>
      )}
    </div>
  );
}

export default function BusinessProfileSection({ token, me, onUpdated }) {
  const { t } = useI18n();
  const nav = useNavigate();
  const { showToast } = useToast();
  const [stats, setStats] = React.useState(null);
  const [loadingStats, setLoadingStats] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [savingAutoBump, setSavingAutoBump] = React.useState(false);
  const [bumpingAll, setBumpingAll] = React.useState(false);
  const [contactLoading, setContactLoading] = React.useState(false);
  const [uploadingLogo, setUploadingLogo] = React.useState(false);
  const [nameError, setNameError] = React.useState("");

  const isCompany = isCompanyAccount(me);

  const [form, setForm] = React.useState({
    companyName: me?.companyName || "",
    companyDescription: me?.companyDescription || "",
    companyLogo: me?.companyLogo || "",
    companyAddress: me?.companyAddress || "",
    companyWebsite: me?.companyWebsite || "",
    companyInstagram: me?.companyInstagram || "",
  });

  const [autoBumpForm, setAutoBumpForm] = React.useState({
    enabled: Boolean(me?.listingAutoBumpEnabled),
    intervalHours: Number(me?.listingAutoBumpIntervalHours || 24),
  });

  React.useEffect(() => {
    setForm({
      companyName: me?.companyName || "",
      companyDescription: me?.companyDescription || "",
      companyLogo: me?.companyLogo || "",
      companyAddress: me?.companyAddress || "",
      companyWebsite: me?.companyWebsite || "",
      companyInstagram: me?.companyInstagram || "",
    });
    setAutoBumpForm({
      enabled: Boolean(me?.listingAutoBumpEnabled),
      intervalHours: Number(me?.listingAutoBumpIntervalHours || 24),
    });
  }, [me]);

  const setField = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const reloadStats = React.useCallback(() => {
    if (!token) return;

    setLoadingStats(true);

    api
      .businessStats(token)
      .then((data) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
  }, [token]);

  React.useEffect(() => {
    reloadStats();
  }, [reloadStats, me?.sellerType]);

  const activeListings = stats?.activeListings ?? 0;
  const totalViews = stats?.totalViews ?? 0;

  const saveBusinessProfile = async () => {
    if (!isCompany) return;

    if (!form.companyName.trim()) {
      setNameError(t("business.companyRequired"));
      return;
    }

    setNameError("");
    setSaving(true);

    try {
      const updated = await api.updateMe(token, {
        companyName: form.companyName.trim(),
        companyDescription: form.companyDescription.trim(),
        companyLogo: form.companyLogo.trim(),
        companyAddress: form.companyAddress.trim(),
        companyWebsite: form.companyWebsite.trim(),
        companyInstagram: form.companyInstagram.trim(),
      });

      onUpdated?.(updated);
      showToast(t("business.profileSaved"), "success");
    } catch (e) {
      showToast(e.message || t("business.saveFailed"), "error");
    } finally {
      setSaving(false);
    }
  };

  const saveAutoBumpSettings = async () => {
    if (!isCompany) return;

    setSavingAutoBump(true);

    try {
      const intervalHours = normalizeAutoBumpIntervalHours(autoBumpForm.intervalHours);

      const updated = await api.updateMe(token, {
        listingAutoBumpEnabled: autoBumpForm.enabled,
        listingAutoBumpIntervalHours: intervalHours,
      });

      onUpdated?.(updated);
      reloadStats();
      showToast(
        autoBumpForm.enabled
          ? t("business.autoBumpOn", {
              interval: formatAutoBumpInterval(autoBumpForm.intervalHours),
            })
          : t("business.autoBumpOff"),
        "success"
      );
    } catch (e) {
      showToast(e.message || t("business.autoBumpSaveFailed"), "error");
    } finally {
      setSavingAutoBump(false);
    }
  };

  const bumpAllListingsNow = async () => {
    if (!isCompany) return;

    setBumpingAll(true);

    try {
      const result = await api.bumpAllListings(token);
      reloadStats();
      showToast(
        result?.updatedCount
          ? t("business.bumpedCount", { count: result.updatedCount })
          : t("business.noActiveToBump"),
        "success"
      );
    } catch (e) {
      showToast(e.message || t("business.bumpFailed"), "error");
    } finally {
      setBumpingAll(false);
    }
  };

  const contactAdmin = async () => {
    setContactLoading(true);

    try {
      await openBusinessSupportChat({ nav, token });
    } catch (e) {
      showToast(e.message || t("business.chatFailed"), "error");
    } finally {
      setContactLoading(false);
    }
  };

  const uploadLogo = async (event) => {
    const file = event.target.files?.[0];

    if (!file || !token) return;

    setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append("images", file);

      const urls = await api.uploadImages(token, formData);

      if (!urls?.[0]) {
        throw new Error(t("business.logoUploadFailed"));
      }

      setField("companyLogo", urls[0]);
    } catch (e) {
      showToast(e.message || t("business.logoUploadError"), "error");
    } finally {
      setUploadingLogo(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title={t("business.premiumAccount")}
        description={t("business.premiumDesc")}
        icon={Crown}
        action={
          isCompany ? (
            <BusinessBadge
              sellerType={me?.sellerType}
              businessVerified={me?.businessVerified}
              size="lg"
            />
          ) : null
        }
        bodyClassName="space-y-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <StatTile
            icon={LayoutGrid}
            label={t("business.activeListings")}
            value={activeListings.toLocaleString("ru-RU")}
            loading={loadingStats}
          />
          <StatTile
            icon={Eye}
            label={t("business.listingViews")}
            value={totalViews.toLocaleString("ru-RU")}
            loading={loadingStats}
          />
        </div>

        {!isCompany && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-ink-900">
                {t("business.benefitsTitle")}
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-ink-600">
                {getBusinessBenefits(t).map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <BadgeCheck
                      size={16}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-info-600"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <Alert tone="info" live={false}>
              {t("business.adminConnect")}
            </Alert>

            <Button
              variant="primary"
              icon={MessageCircle}
              loading={contactLoading}
              onClick={contactAdmin}
            >
              {contactLoading ? t("business.openingChat") : t("business.contactAdmin")}
            </Button>
          </div>
        )}

        {isCompany &&
          (me?.businessVerified ? (
            <Alert tone="success" live={false}>
              {t("business.verified")}
            </Alert>
          ) : (
            <Alert tone="warning" live={false}>
              {t("business.fillProfile")}
            </Alert>
          ))}
      </SectionCard>

      {isCompany && (
        <SectionCard
          title={t("business.profileTitle")}
          description={t("business.profileDesc")}
          icon={Building2}
          bodyClassName="space-y-4"
        >
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border border-ink-200 bg-mist-50">
              {form.companyLogo ? (
                <img
                  src={form.companyLogo}
                  alt={t("business.logoAlt")}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 size={32} className="text-ink-300" aria-hidden="true" />
              )}
            </div>

            <div className="flex-1 space-y-3">
              <Field
                label={t("business.companyNameLabel")}
                required
                error={nameError}
              >
                {(field) => (
                  <Input
                    {...field}
                    value={form.companyName}
                    onChange={(e) => {
                      setField("companyName", e.target.value);
                      if (nameError) setNameError("");
                    }}
                    placeholder="Oriyon Estate"
                  />
                )}
              </Field>

              <label className="btn inline-flex cursor-pointer focus-within:ring-2 focus-within:ring-sun/50 focus-within:ring-offset-2">
                <Upload size={16} aria-hidden="true" />
                {uploadingLogo ? t("business.uploading") : t("business.uploadLogo")}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={uploadLogo}
                  disabled={uploadingLogo}
                />
              </label>
            </div>
          </div>

          <Field label={t("business.aboutCompany")}>
            {(field) => (
              <Textarea
                {...field}
                value={form.companyDescription}
                onChange={(e) => setField("companyDescription", e.target.value)}
                placeholder="Агентство недвижимости, работаем с 2015 года…"
              />
            )}
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              className="md:col-span-2"
              label={
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={15} aria-hidden="true" />
                  {t("business.storeAddresses")}
                </span>
              }
              hint={t("business.addressesHint")}
            >
              {(field) => (
                <Textarea
                  {...field}
                  value={form.companyAddress}
                  onChange={(e) => setField("companyAddress", e.target.value)}
                  className="min-h-[6rem]"
                  placeholder={"ул. Рудаки 95, Душанбе\nпр. Рудаки 44, Душанбе"}
                />
              )}
            </Field>

            <Field
              label={
                <span className="inline-flex items-center gap-1.5">
                  <Globe size={15} aria-hidden="true" />
                  {t("business.website")}
                </span>
              }
            >
              {(field) => (
                <Input
                  {...field}
                  value={form.companyWebsite}
                  onChange={(e) => setField("companyWebsite", e.target.value)}
                  placeholder="oriyon.tj"
                />
              )}
            </Field>

            <Field
              label={
                <span className="inline-flex items-center gap-1.5">
                  <Instagram size={15} aria-hidden="true" />
                  Instagram
                </span>
              }
            >
              {(field) => (
                <Input
                  {...field}
                  value={form.companyInstagram}
                  onChange={(e) => setField("companyInstagram", e.target.value)}
                  placeholder="@oriyon_estate"
                />
              )}
            </Field>
          </div>

          <Button variant="primary" loading={saving} onClick={saveBusinessProfile}>
            {saving ? t("business.saving") : t("business.saveProfile")}
          </Button>
        </SectionCard>
      )}

      {isCompany && (
        <SectionCard
          title={t("business.autoBumpTitle")}
          description={t("business.autoBumpDesc")}
          icon={RefreshCw}
          bodyClassName="space-y-4"
        >
          <Checkbox
            label={t("business.autoBumpEnable")}
            checked={autoBumpForm.enabled}
            onChange={(e) =>
              setAutoBumpForm((current) => ({ ...current, enabled: e.target.checked }))
            }
          />

          <Field
            label={
              <span className="inline-flex items-center gap-1.5">
                <Clock3 size={15} aria-hidden="true" />
                {t("business.bumpInterval")}
              </span>
            }
            hint={t("business.bumpIntervalHint", {
              min: MIN_AUTO_BUMP_INTERVAL_HOURS,
              max: MAX_AUTO_BUMP_INTERVAL_HOURS,
            })}
            className="max-w-xs"
          >
            {(field) => (
              <Input
                {...field}
                type="number"
                min={MIN_AUTO_BUMP_INTERVAL_HOURS}
                max={MAX_AUTO_BUMP_INTERVAL_HOURS}
                step={1}
                value={autoBumpForm.intervalHours}
                disabled={!autoBumpForm.enabled}
                onChange={(e) =>
                  setAutoBumpForm((current) => ({
                    ...current,
                    intervalHours: e.target.value,
                  }))
                }
              />
            )}
          </Field>

          <p className="text-xs text-ink-400">
            {t("business.lastBump")}{" "}
            {formatDateTime(stats?.listingAutoBumpLastAt || me?.listingAutoBumpLastAt, t)}
            {autoBumpForm.enabled &&
              t("business.schedule", {
                interval: formatAutoBumpInterval(autoBumpForm.intervalHours),
              })}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" loading={savingAutoBump} onClick={saveAutoBumpSettings}>
              {savingAutoBump ? t("business.saving") : t("business.saveSchedule")}
            </Button>

            <Button icon={RefreshCw} loading={bumpingAll} onClick={bumpAllListingsNow}>
              {bumpingAll ? t("business.bumping") : t("business.bumpAllNow")}
            </Button>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
