import React from "react";
import {
  CheckCircle2,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  MessageCircle,
} from "lucide-react";
import BusinessProfileSection from "../BusinessProfileSection";
import BusinessPromoBanner from "../BusinessPromoBanner";
import EmailBadge from "./EmailBadge";
import { USER_KEY } from "../../lib/auth";
import { isStaffRole } from "./profileUtils";

function SectionCard({ icon: Icon, title, description, action, children, className = "" }) {
  return (
    <section className={`rounded-2xl border bg-white overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-white border grid place-items-center shrink-0">
              <Icon size={18} className="text-sun" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {description && (
              <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{description}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-slate-700 mb-1.5">{label}</div>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1.5">{hint}</p>}
    </label>
  );
}

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
    <div className="space-y-6 max-w-6xl">
      <BusinessPromoBanner sellerType={me?.sellerType} className="rounded-2xl" />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-6">
        <SectionCard
          icon={UserRound}
          title="Контактные данные"
          description="Имя и контакты видят покупатели в объявлениях. Изменения сохраняются автоматически."
          action={
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full shrink-0">
              <CheckCircle2 size={14} />
              Автосохранение
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Имя пользователя">
              <input
                className="mobile-control"
                value={form.name}
                onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
                placeholder="Как вас видят покупатели"
              />
            </Field>

            <Field label="Email">
              <input
                className="mobile-control bg-slate-50 text-slate-500"
                type="email"
                value={form.email}
                readOnly
              />
            </Field>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <Phone size={16} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-800">Способы связи</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Телефон">
                <input
                  className="mobile-control"
                  placeholder="+992 90 123 4567"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </Field>

              <Field label="WhatsApp">
                <input
                  className="mobile-control"
                  placeholder="992901234567"
                  value={form.whatsapp}
                  onChange={(e) => setForm((prev) => ({ ...prev, whatsapp: e.target.value }))}
                />
              </Field>

              <Field label="Telegram" hint="Username или ссылка t.me/...">
                <input
                  className="mobile-control sm:col-span-2"
                  placeholder="@username"
                  value={form.telegram}
                  onChange={(e) => setForm((prev) => ({ ...prev, telegram: e.target.value }))}
                />
              </Field>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          icon={ShieldCheck}
          title="Безопасность"
          description="Подтверждённая почта повышает доверие и защищает аккаунт."
          action={<EmailBadge status={emailStatus} />}
        >
          {emailStatus === "verified" ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white grid place-items-center shrink-0">
                  <ShieldCheck className="text-emerald-600" size={20} />
                </div>
                <div>
                  <div className="font-semibold text-emerald-800">Почта подтверждена</div>
                  <p className="text-sm text-emerald-700/90 mt-1 leading-relaxed">
                    Аккаунт защищён. Покупатели видят статус верификации в объявлениях.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border grid place-items-center shrink-0">
                  <Mail className="text-sun" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900">Подтвердите email</div>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                    Отправим письмо на {form.email || "ваш адрес"}. Перейдите по ссылке в письме.
                  </p>
                  <button
                    type="button"
                    onClick={onRequestVerifyEmail}
                    disabled={sendingEmail || emailStatus === "pending"}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sun text-white text-sm font-semibold hover:bg-sun-600 transition disabled:opacity-60"
                  >
                    <Mail size={16} />
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

          {isStaffRole(role) && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border bg-slate-50 px-4 py-3 text-sm">
              <span className="text-slate-500">Роль аккаунта</span>
              <span className="font-semibold text-slate-900 uppercase tracking-wide text-xs">
                {role.replace("_", " ")}
              </span>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-start gap-2 text-sm text-slate-600">
              <MessageCircle size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Не передавайте пароль и коды подтверждения третьим лицам. Поддержка никогда не
                запрашивает их в чате.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <BusinessProfileSection
        token={token}
        me={me}
        onUpdated={(user) => {
          onUpdated?.(user);
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        }}
      />
    </div>
  );
}
