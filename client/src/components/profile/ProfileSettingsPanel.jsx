import React from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Crown,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import BusinessProfileSection from "../BusinessProfileSection";
import EmailBadge from "./EmailBadge";
import { USER_KEY } from "../../lib/auth";
import { formatPhoneDisplay, isStaffRole } from "./profileUtils";
import { useI18n } from "../../i18n";

function SectionCard({ icon: Icon, title, description, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm ${className}`}>
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-start gap-3 min-w-0">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-sun/10 grid place-items-center shrink-0">
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
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({ label, hint, badge, children }) {
  return (
    <label className="block">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {badge}
      </div>
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
  const { t } = useI18n();
  const phones = React.useMemo(() => {
    const primary = String(form.phone || "").trim();
    const extras = Array.isArray(form.extraPhones) ? form.extraPhones : [];
    const list = [];
    if (primary) list.push(primary);
    extras.forEach((p) => {
      const v = String(p || "").trim();
      if (v && v !== primary && !list.includes(v)) list.push(v);
    });
    if (!list.length) list.push("");
    return list;
  }, [form.phone, form.extraPhones]);

  const setPhones = (nextList) => {
    const cleaned = nextList.map((p) => String(p || "").trim());
    const primary = cleaned[0] || "";
    const extras = cleaned.slice(1).filter(Boolean);
    setForm((prev) => ({ ...prev, phone: primary, extraPhones: extras }));
  };

  const updatePhoneAt = (index, value) => {
    const next = [...phones];
    next[index] = value;
    setPhones(next);
  };

  const makePrimary = (index) => {
    if (index === 0) return;
    const next = [...phones];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    setPhones(next);
  };

  const removePhone = (index) => {
    if (phones.length <= 1) {
      setPhones([""]);
      return;
    }
    const next = phones.filter((_, i) => i !== index);
    setPhones(next);
  };

  const addPhone = () => {
    if (phones.length >= 5) return;
    setPhones([...phones, ""]);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <SectionCard
        icon={UserRound}
        title={t("profile.contacts")}
        description={t("profile.contactsHint")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t("profile.username")}>
            <input
              className="mobile-control"
              value={form.name}
              onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
              placeholder={t("profile.usernamePlaceholder")}
            />
          </Field>

          <Field
            label="Email"
            badge={
              emailStatus === "verified" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 size={12} />
                  {t("profile.emailVerified")}
                </span>
              ) : (
                <EmailBadge status={emailStatus} />
              )
            }
          >
            <input
              className="mobile-control bg-slate-50 text-slate-500"
              type="email"
              value={form.email}
              readOnly
            />
          </Field>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <Phone size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-800">{t("profile.contactMethods")}</h3>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="text-sm font-medium text-slate-700">{t("profile.phoneNumbers")}</div>
            <div className="text-xs text-slate-400">{t("profile.phonePerAdHint")}</div>
          </div>

          <div className="space-y-2.5">
            {phones.map((phone, index) => (
              <div key={`phone-${index}`} className="flex flex-col sm:flex-row gap-2">
                <input
                  className="mobile-control flex-1 tabular-nums"
                  placeholder="+992 90 123 45 67"
                  value={phone}
                  onChange={(e) => updatePhoneAt(index, e.target.value)}
                  onBlur={(e) => {
                    const formatted = formatPhoneDisplay(e.target.value) || e.target.value;
                    if (formatted !== phone) updatePhoneAt(index, formatted);
                  }}
                />
                <div className="flex items-center gap-2 shrink-0">
                  {index === 0 ? (
                    <span className="inline-flex items-center rounded-full bg-sun/15 px-3 py-2 text-xs font-semibold text-sun">
                      {t("profile.primaryPhone")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => makePrimary(index)}
                      className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      {t("profile.makePrimary")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhone(index)}
                    className="rounded-xl border border-red-100 p-2 text-red-500 hover:bg-red-50"
                    aria-label={t("a11y.delete")}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {phones.length < 5 && (
            <button
              type="button"
              onClick={addPhone}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-sun hover:text-sun-600"
            >
              <Plus size={16} />
              {t("profile.addPhone")}
            </button>
          )}

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="WhatsApp">
              <input
                className="mobile-control"
                placeholder="992901234567"
                value={form.whatsapp}
                onChange={(e) => setForm((prev) => ({ ...prev, whatsapp: e.target.value }))}
              />
            </Field>

            <Field label="Telegram" hint={t("profile.telegramHint")}>
              <input
                className="mobile-control"
                placeholder="@username"
                value={form.telegram}
                onChange={(e) => setForm((prev) => ({ ...prev, telegram: e.target.value }))}
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl overflow-hidden border border-amber-900/20 bg-gradient-to-br from-[#3d2a14] via-[#4a3218] to-[#2c1e0e] text-amber-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Crown size={16} />
            Oriyon Premium
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{t("profile.premiumTitle")}</h3>
          <p className="text-sm text-amber-100/80 leading-relaxed mb-4">
            {t("profile.premiumDesc")}
          </p>
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-300/80 mb-2">
            {t("profile.premiumBenefits")}
          </div>
          <ul className="space-y-1.5 text-sm text-amber-50/90 mb-4">
            {[
              t("profile.premiumBenefit1"),
              t("profile.premiumBenefit2"),
              t("profile.premiumBenefit3"),
              t("profile.premiumBenefit4"),
              t("profile.premiumBenefit5"),
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-amber-300 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-amber-200/70 mb-3">{t("profile.premiumAdminHint")}</p>
          <a
            href="https://t.me/oriyon_support"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-300 transition"
          >
            <MessageCircle size={16} />
            {t("profile.writeAdmin")}
          </a>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-5 shadow-sm flex flex-col">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-white border border-emerald-100 grid place-items-center shrink-0">
              <ShieldCheck className="text-emerald-600" size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900">{t("profile.security")}.</span>{" "}
                {t("profile.securityTip")}
              </p>
              <Link
                to="/policy"
                className="mt-3 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                {t("profile.scamGuide")}
              </Link>
            </div>
          </div>

          {emailStatus !== "verified" && (
            <div className="mt-auto pt-4">
              <button
                type="button"
                onClick={onRequestVerifyEmail}
                disabled={sendingEmail || emailStatus === "pending"}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sun text-white text-sm font-semibold hover:bg-sun-600 transition disabled:opacity-60"
              >
                <Mail size={16} />
                {emailStatus === "pending"
                  ? t("profile.emailSent")
                  : sendingEmail
                    ? t("profile.emailSending")
                    : t("profile.sendEmail")}
              </button>
            </div>
          )}

          {isStaffRole(role) && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-sm">
              <span className="text-slate-500">{t("profile.accountRole")}</span>
              <span className="font-semibold text-slate-900 uppercase tracking-wide text-xs">
                {role.replace("_", " ")}
              </span>
            </div>
          )}
        </div>
      </div>

      {me?.sellerType === "company" && (
        <BusinessProfileSection
          token={token}
          me={me}
          onUpdated={(user) => {
            onUpdated?.(user);
            localStorage.setItem(USER_KEY, JSON.stringify(user));
          }}
        />
      )}
    </div>
  );
}
