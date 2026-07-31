import React from "react";
import {
  BadgeCheck,
  Building2,
  Globe,
  Instagram,
  MapPin,
  Sparkles,
  Upload,
  User,
} from "lucide-react";
import { api } from "../lib/api";
import BusinessBadge from "./BusinessBadge";
import {
  BUSINESS_BENEFITS,
  COMPANY_LISTING_LIMIT,
  PRIVATE_LISTING_LIMIT,
  getListingLimit,
  isCompanyAccount,
} from "../lib/businessAccount";

export default function BusinessProfileSection({ token, me, onUpdated }) {
  const [stats, setStats] = React.useState(null);
  const [loadingStats, setLoadingStats] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploadingLogo, setUploadingLogo] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const [form, setForm] = React.useState({
    sellerType: me?.sellerType || "private",
    companyName: me?.companyName || "",
    companyDescription: me?.companyDescription || "",
    companyLogo: me?.companyLogo || "",
    companyAddress: me?.companyAddress || "",
    companyWebsite: me?.companyWebsite || "",
    companyInstagram: me?.companyInstagram || "",
  });

  React.useEffect(() => {
    setForm({
      sellerType: me?.sellerType || "private",
      companyName: me?.companyName || "",
      companyDescription: me?.companyDescription || "",
      companyLogo: me?.companyLogo || "",
      companyAddress: me?.companyAddress || "",
      companyWebsite: me?.companyWebsite || "",
      companyInstagram: me?.companyInstagram || "",
    });
  }, [me]);

  React.useEffect(() => {
    if (!token) return;

    let alive = true;

    setLoadingStats(true);

    api
      .businessStats(token)
      .then((data) => {
        if (alive) setStats(data);
      })
      .catch(() => {
        if (alive) setStats(null);
      })
      .finally(() => {
        if (alive) setLoadingStats(false);
      });

    return () => {
      alive = false;
    };
  }, [token, me?.sellerType]);

  const listingLimit = stats?.listingLimit ?? getListingLimit(me);
  const activeListings = stats?.activeListings ?? 0;
  const remainingListings =
    stats?.remainingListings ?? Math.max(0, listingLimit - activeListings);

  const saveBusinessProfile = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      if (form.sellerType === "company" && !form.companyName.trim()) {
        throw new Error("Укажите название компании");
      }

      const updated = await api.updateMe(token, {
        sellerType: form.sellerType,
        companyName: form.companyName.trim(),
        companyDescription: form.companyDescription.trim(),
        companyLogo: form.companyLogo.trim(),
        companyAddress: form.companyAddress.trim(),
        companyWebsite: form.companyWebsite.trim(),
        companyInstagram: form.companyInstagram.trim(),
      });

      onUpdated?.(updated);
      setSuccess("Бизнес-профиль сохранён");
    } catch (e) {
      setError(e.message || "Не удалось сохранить");
    } finally {
      setSaving(false);
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
              Oriyon Бизнес
            </div>
            <h2 className="text-xl font-bold mt-2">Бизнес-аккаунт</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Расширенный профиль для агентств, девелоперов и компаний. Больше
              объявлений, бренд-страница и доверие покупателей.
            </p>
          </div>

          {isCompanyAccount(me) && (
            <BusinessBadge
              sellerType={me?.sellerType}
              businessVerified={me?.businessVerified}
              size="lg"
            />
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-2xl border bg-slate-50 p-4">
            <div className="text-xs text-slate-500">Активные объявления</div>
            <div className="text-2xl font-bold mt-1">
              {loadingStats ? "…" : activeListings}
            </div>
          </div>

          <div className="rounded-2xl border bg-blue-50 p-4">
            <div className="text-xs text-blue-700">Лимит</div>
            <div className="text-2xl font-bold text-blue-700 mt-1">
              {listingLimit}
            </div>
          </div>

          <div className="rounded-2xl border bg-emerald-50 p-4">
            <div className="text-xs text-emerald-700">Осталось слотов</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {loadingStats ? "…" : remainingListings}
            </div>
          </div>
        </div>

        {!isCompanyAccount({ sellerType: form.sellerType }) && (
          <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-4">
            <div className="font-semibold text-slate-900">
              Что даёт бизнес-аккаунт
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {BUSINESS_BENEFITS.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <BadgeCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 mt-3">
              Частный аккаунт: до {PRIVATE_LISTING_LIMIT} активных объявлений.
              Бизнес: до {COMPANY_LISTING_LIMIT}.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() =>
              setForm((current) => ({
                ...current,
                sellerType: "private",
              }))
            }
            className={`rounded-2xl border p-4 text-left transition ${
              form.sellerType === "private"
                ? "border-sun bg-sun text-white shadow-sm"
                : "bg-white hover:border-slate-300"
            }`}
          >
            <div className="inline-flex items-center gap-2 font-semibold">
              <User size={18} />
              Частное лицо
            </div>
            <div
              className={`text-sm mt-2 ${
                form.sellerType === "private"
                  ? "text-white/80"
                  : "text-slate-500"
              }`}
            >
              До {PRIVATE_LISTING_LIMIT} объявлений
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setForm((current) => ({
                ...current,
                sellerType: "company",
                companyName: current.companyName || me?.name || "",
              }))
            }
            className={`rounded-2xl border p-4 text-left transition ${
              form.sellerType === "company"
                ? "border-blue-600 bg-blue-600 text-white"
                : "bg-white hover:border-blue-200"
            }`}
          >
            <div className="inline-flex items-center gap-2 font-semibold">
              <Building2 size={18} />
              Компания
            </div>
            <div
              className={`text-sm mt-2 ${
                form.sellerType === "company"
                  ? "text-white/80"
                  : "text-slate-500"
              }`}
            >
              До {COMPANY_LISTING_LIMIT} объявлений + бренд-страница
            </div>
          </button>
        </div>

        {form.sellerType === "company" && (
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
              <label className="block">
                <div className="text-sm font-medium mb-2 inline-flex items-center gap-1">
                  <MapPin size={15} />
                  Адрес офиса
                </div>
                <input
                  className="h-12 rounded-2xl border px-4 w-full outline-none focus:ring-2 focus:ring-blue-300"
                  value={form.companyAddress}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      companyAddress: e.target.value,
                    }))
                  }
                  placeholder="ул. Рудаки 95, Душанбе"
                />
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

              <label className="block md:col-span-2">
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

            {me?.businessVerified ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                Компания прошла проверку модератором Oriyon.
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Заполните профиль компании — после проверки модератор выдаст
                бейдж «Проверенный бизнес».
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

        <button
          type="button"
          onClick={saveBusinessProfile}
          disabled={saving}
          className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
        >
          {saving ? "Сохранение…" : "Сохранить бизнес-профиль"}
        </button>
      </div>
    </div>
  );
}
