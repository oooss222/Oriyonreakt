import React from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Building2,
  Clock3,
  Globe,
  Instagram,
  MapPin,
  MessageCircle,
  RefreshCw,
  Sparkles,
  Upload,
} from "lucide-react";
import { api } from "../lib/api";
import { openBusinessSupportChat } from "../lib/openBusinessSupportChat";
import BusinessBadge from "./BusinessBadge";
import {
  BUSINESS_BENEFITS,
  formatAutoBumpInterval,
  isCompanyAccount,
  MAX_AUTO_BUMP_INTERVAL_HOURS,
  MIN_AUTO_BUMP_INTERVAL_HOURS,
  normalizeAutoBumpIntervalHours,
} from "../lib/businessAccount";

function formatDateTime(value) {
  if (!value || Number.isNaN(Date.parse(value))) return "ещё не выполнялось";

  return new Date(value).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BusinessProfileSection({ token, me, onUpdated }) {
  const nav = useNavigate();
  const [stats, setStats] = React.useState(null);
  const [loadingStats, setLoadingStats] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [savingAutoBump, setSavingAutoBump] = React.useState(false);
  const [bumpingAll, setBumpingAll] = React.useState(false);
  const [contactLoading, setContactLoading] = React.useState(false);
  const [uploadingLogo, setUploadingLogo] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

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

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      if (!form.companyName.trim()) {
        throw new Error("Укажите название компании");
      }

      const updated = await api.updateMe(token, {
        companyName: form.companyName.trim(),
        companyDescription: form.companyDescription.trim(),
        companyLogo: form.companyLogo.trim(),
        companyAddress: form.companyAddress.trim(),
        companyWebsite: form.companyWebsite.trim(),
        companyInstagram: form.companyInstagram.trim(),
      });

      onUpdated?.(updated);
      setSuccess("Премиум-профиль сохранён");
    } catch (e) {
      setError(e.message || "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const saveAutoBumpSettings = async () => {
    if (!isCompany) return;

    setError("");
    setSuccess("");
    setSavingAutoBump(true);

    try {
      const intervalHours = normalizeAutoBumpIntervalHours(
        autoBumpForm.intervalHours
      );

      const updated = await api.updateMe(token, {
        listingAutoBumpEnabled: autoBumpForm.enabled,
        listingAutoBumpIntervalHours: intervalHours,
      });

      onUpdated?.(updated);
      reloadStats();
      setSuccess(
        autoBumpForm.enabled
          ? `Автообновление включено: ${formatAutoBumpInterval(autoBumpForm.intervalHours)}`
          : "Автообновление отключено"
      );
    } catch (e) {
      setError(e.message || "Не удалось сохранить настройки обновления");
    } finally {
      setSavingAutoBump(false);
    }
  };

  const bumpAllListingsNow = async () => {
    if (!isCompany) return;

    setError("");
    setSuccess("");
    setBumpingAll(true);

    try {
      const result = await api.bumpAllListings(token);
      reloadStats();
      setSuccess(
        result?.updatedCount
          ? `Обновлено объявлений: ${result.updatedCount}`
          : "Нет активных объявлений для обновления"
      );
    } catch (e) {
      setError(e.message || "Не удалось обновить объявления");
    } finally {
      setBumpingAll(false);
    }
  };

  const contactAdmin = async () => {
    setError("");
    setContactLoading(true);

    try {
      await openBusinessSupportChat({ nav, token });
    } catch (e) {
      setError(e.message || "Не удалось открыть чат");
    } finally {
      setContactLoading(false);
    }
  };

  const uploadLogo = async (event) => {
    const file = event.target.files?.[0];

    if (!file || !token) return;

    setUploadingLogo(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("images", file);

      const urls = await api.uploadImages(token, formData);

      if (!urls?.[0]) {
        throw new Error("Не удалось загрузить логотип");
      }

      setForm((current) => ({
        ...current,
        companyLogo: urls[0],
      }));
    } catch (e) {
      setError(e.message || "Ошибка загрузки логотипа");
    } finally {
      setUploadingLogo(false);
      event.target.value = "";
    }
  };

  return (
    <div className="rounded-3xl border bg-white overflow-hidden">
      <div className="px-5 py-5 border-b bg-gradient-to-r from-slate-50 to-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-sun-700 font-semibold">
              <Sparkles size={18} />
              Oriyon Premium
            </div>
            <h2 className="text-xl font-bold mt-2">Премиум-аккаунт</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Бренд-профиль компании, контакты магазина и автообновление дат
              объявлений в каталоге.
            </p>
          </div>

          {isCompany && (
            <BusinessBadge
              sellerType={me?.sellerType}
              businessVerified={me?.businessVerified}
              size="lg"
            />
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-2xl border bg-slate-50 p-4">
            <div className="text-xs text-slate-500">Активные объявления</div>
            <div className="text-2xl font-bold mt-1">
              {loadingStats ? "…" : activeListings}
            </div>
          </div>

          <div className="rounded-2xl border bg-blue-50 p-4">
            <div className="text-xs text-blue-700">Просмотры объявлений</div>
            <div className="text-2xl font-bold text-blue-700 mt-1">
              {loadingStats ? "…" : totalViews.toLocaleString("ru-RU")}
            </div>
          </div>
        </div>

        {!isCompany && (
          <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-4 space-y-4">
            <div>
              <div className="font-semibold text-slate-900">
                Что даёт премиум-аккаунт
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {BUSINESS_BENEFITS.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <BadgeCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Подключение премиум-аккаунта выполняет администратор Oriyon.
              Напишите в чат — обсудим условия и подключим профиль компании.
            </div>

            <button
              type="button"
              onClick={contactAdmin}
              disabled={contactLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 transition disabled:opacity-60"
            >
              <MessageCircle size={18} />
              {contactLoading ? "Открываем чат…" : "Написать администратору"}
            </button>
          </div>
        )}

        {isCompany && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-24 h-24 rounded-2xl border bg-slate-50 overflow-hidden grid place-items-center shrink-0">
                {form.companyLogo ? (
                  <img
                    src={form.companyLogo}
                    alt="Логотип"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="text-slate-300" size={32} />
                )}
              </div>

              <div className="flex-1 space-y-3">
                <label className="block">
                  <div className="text-sm font-medium mb-2">
                    Название компании *
                  </div>
                  <input
                    className="h-12 rounded-2xl border px-4 w-full outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.companyName}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        companyName: e.target.value,
                      }))
                    }
                    placeholder="Oriyon Estate"
                  />
                </label>

                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer hover:bg-slate-50 transition">
                  <Upload size={16} />
                  {uploadingLogo ? "Загрузка…" : "Загрузить логотип"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={uploadLogo}
                    disabled={uploadingLogo}
                  />
                </label>
              </div>
            </div>

            <label className="block">
              <div className="text-sm font-medium mb-2">О компании</div>
              <textarea
                className="min-h-[110px] rounded-2xl border px-4 py-3 w-full outline-none focus:ring-2 focus:ring-blue-300"
                value={form.companyDescription}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    companyDescription: e.target.value,
                  }))
                }
                placeholder="Агентство недвижимости, работаем с 2015 года…"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block md:col-span-2">
                <div className="text-sm font-medium mb-2 inline-flex items-center gap-1">
                  <MapPin size={15} />
                  Адреса магазинов
                </div>
                <textarea
                  className="min-h-[96px] rounded-2xl border px-4 py-3 w-full outline-none focus:ring-2 focus:ring-blue-300"
                  value={form.companyAddress}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      companyAddress: e.target.value,
                    }))
                  }
                  placeholder={"ул. Рудаки 95, Душанбе\nпр. Рудаки 44, Душанбе"}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Один адрес на строку — все будут показаны на странице компании.
                </p>
              </label>

              <label className="block">
                <div className="text-sm font-medium mb-2 inline-flex items-center gap-1">
                  <Globe size={15} />
                  Сайт
                </div>
                <input
                  className="h-12 rounded-2xl border px-4 w-full outline-none focus:ring-2 focus:ring-blue-300"
                  value={form.companyWebsite}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      companyWebsite: e.target.value,
                    }))
                  }
                  placeholder="oriyon.tj"
                />
              </label>

              <label className="block">
                <div className="text-sm font-medium mb-2 inline-flex items-center gap-1">
                  <Instagram size={15} />
                  Instagram
                </div>
                <input
                  className="h-12 rounded-2xl border px-4 w-full outline-none focus:ring-2 focus:ring-blue-300"
                  value={form.companyInstagram}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      companyInstagram: e.target.value,
                    }))
                  }
                  placeholder="@oriyon_estate"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 space-y-4">
              <div>
                <div className="font-semibold text-slate-900 inline-flex items-center gap-2">
                  <RefreshCw size={18} className="text-blue-600" />
                  Автообновление дат объявлений
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Все активные объявления поднимутся в каталоге — дата
                  обновления изменится автоматически по выбранному расписанию.
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={autoBumpForm.enabled}
                  onChange={(e) =>
                    setAutoBumpForm((current) => ({
                      ...current,
                      enabled: e.target.checked,
                    }))
                  }
                />
                <span className="text-sm text-slate-700">
                  Включить автообновление для всех моих объявлений
                </span>
              </label>

              <label className="block">
                <div className="text-sm font-medium mb-2 inline-flex items-center gap-1">
                  <Clock3 size={15} />
                  Период обновления (в часах)
                </div>
                <input
                  type="number"
                  min={MIN_AUTO_BUMP_INTERVAL_HOURS}
                  max={MAX_AUTO_BUMP_INTERVAL_HOURS}
                  step={1}
                  className="h-12 rounded-2xl border px-4 w-full outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  value={autoBumpForm.intervalHours}
                  disabled={!autoBumpForm.enabled}
                  onChange={(e) =>
                    setAutoBumpForm((current) => ({
                      ...current,
                      intervalHours: e.target.value,
                    }))
                  }
                />
                <p className="text-xs text-slate-500 mt-1">
                  Укажите свой интервал: от {MIN_AUTO_BUMP_INTERVAL_HOURS} часа до{" "}
                  {MAX_AUTO_BUMP_INTERVAL_HOURS} ч. (30 дней). Например, 1 — каждый
                  час, 24 — раз в сутки.
                </p>
              </label>

              <p className="text-xs text-slate-500">
                Последнее обновление:{" "}
                {formatDateTime(
                  stats?.listingAutoBumpLastAt || me?.listingAutoBumpLastAt
                )}
                {autoBumpForm.enabled &&
                  ` · расписание: ${formatAutoBumpInterval(autoBumpForm.intervalHours)}`}
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveAutoBumpSettings}
                  disabled={savingAutoBump}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {savingAutoBump ? "Сохранение…" : "Сохранить расписание"}
                </button>

                <button
                  type="button"
                  onClick={bumpAllListingsNow}
                  disabled={bumpingAll}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
                >
                  <RefreshCw size={16} />
                  {bumpingAll ? "Обновляем…" : "Обновить все сейчас"}
                </button>
              </div>
            </div>

            {me?.businessVerified ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                Премиум-аккаунт прошёл проверку модератором Oriyon.
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Заполните профиль компании — после проверки модератор выдаст
                бейдж «Проверенный премиум».
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {isCompany && (
          <button
            type="button"
            onClick={saveBusinessProfile}
            disabled={saving}
            className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
          >
            {saving ? "Сохранение…" : "Сохранить премиум-профиль"}
          </button>
        )}
      </div>
    </div>
  );
}
