import React from "react";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import BusinessProfileSection from "../BusinessProfileSection";
import BusinessPromoBanner from "../BusinessPromoBanner";
import EmailBadge from "./EmailBadge";
import { USER_KEY } from "../../lib/auth";

export default function ProfileSettingsPanel({
  me,
  role,
  form,
  setForm,
  emailStatus,
  sendingEmail,
  onRequestVerifyEmail,
  token,
  onUpdated,
}) {
  return (
    <div className="space-y-5">
      <BusinessPromoBanner sellerType={me?.sellerType} />

      <div className="rounded-3xl border bg-white p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold">Настройки профиля</h2>
            <p className="text-sm text-slate-500 mt-1">Информация обновляется автоматически.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
            <CheckCircle2 size={16} />
            Автосохранение
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <div className="text-sm font-medium mb-2">Имя пользователя</div>
            <input
              className="mobile-control"
              value={form.name}
              onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
              placeholder="Введите имя"
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium mb-2">Email</div>
            <input className="mobile-control bg-slate-50" type="email" value={form.email} readOnly />
          </label>

          <label className="block md:col-span-2">
            <div className="text-sm font-medium mb-2">Телефон</div>
            <input
              className="mobile-control"
              placeholder="+992 ..."
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium mb-2">WhatsApp</div>
            <input
              className="mobile-control"
              placeholder="992901234567"
              value={form.whatsapp}
              onChange={(e) => setForm((prev) => ({ ...prev, whatsapp: e.target.value }))}
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium mb-2">Telegram</div>
            <input
              className="mobile-control"
              placeholder="@username или https://t.me/username"
              value={form.telegram}
              onChange={(e) => setForm((prev) => ({ ...prev, telegram: e.target.value }))}
            />
          </label>
        </div>
      </div>

      <BusinessProfileSection
        token={token}
        me={me}
        onUpdated={(user) => {
          onUpdated?.(user);
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        }}
      />

      <div className="rounded-3xl border bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Безопасность аккаунта</h2>
            <p className="text-sm text-slate-500 mt-1">
              Подтверждение электронной почты и защита аккаунта.
            </p>
          </div>
          <EmailBadge status={emailStatus} />
        </div>

        {emailStatus === "verified" ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white grid place-items-center">
              <ShieldCheck className="text-emerald-600" />
            </div>
            <div>
              <div className="font-semibold text-emerald-700">Почта подтверждена</div>
              <div className="text-sm text-emerald-600">Ваш аккаунт успешно защищён.</div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-slate-50 p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white grid place-items-center border">
                <Mail className="text-sun" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Подтвердите адрес электронной почты</div>
                <p className="text-sm text-slate-500 mt-1">
                  После подтверждения аккаунт станет более защищённым.
                </p>
                <button
                  onClick={onRequestVerifyEmail}
                  disabled={sendingEmail || emailStatus === "pending"}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sun text-white hover:bg-sun-600 transition disabled:opacity-60"
                >
                  <Mail size={18} />
                  {emailStatus === "pending"
                    ? "Письмо отправлено"
                    : sendingEmail
                      ? "Отправляем..."
                      : "Отправить письмо"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 rounded-xl border bg-slate-50 p-3 text-sm text-slate-600">
          Роль аккаунта: <span className="font-semibold text-slate-900">{role}</span>
        </div>
      </div>
    </div>
  );
}
