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
import { Badge, Field, Input, SectionCard } from "../../ui";
import { useI18n } from "../../i18n";

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
    <div className="max-w-5xl space-y-6">
      <SectionCard
        icon={UserRound}
        title={t("profile.contacts")}
        description={t("profile.contactsHint")}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("profile.username")}>
            {(field) => (
              <Input
                {...field}
                value={form.name}
                onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
                placeholder={t("profile.usernamePlaceholder")}
              />
            )}
          </Field>

          <Field
            label={
              <span className="inline-flex flex-wrap items-center gap-2">
                Email
                {emailStatus === "verified" ? (
                  <Badge tone="success" icon={CheckCircle2}>
                    {t("profile.emailVerified")}
                  </Badge>
                ) : (
                  <EmailBadge status={emailStatus} />
                )}
              </span>
            }
          >
            {(field) => (
              <Input
                {...field}
                type="email"
                value={form.email}
                readOnly
                className="bg-mist-100 text-ink-500"
              />
            )}
          </Field>
        </div>

        <div className="mt-6 border-t border-ink-200 pt-5">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink-900">
            <Phone size={16} className="text-ink-400" aria-hidden />
            {t("profile.contactMethods")}
          </h3>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-ink-600">
              {t("profile.phoneNumbers")}
            </p>
            <p className="text-xs text-ink-400">{t("profile.phonePerAdHint")}</p>
          </div>

          <ul className="space-y-2.5">
            {phones.map((phone, index) => (
              <li key={`phone-${index}`} className="flex flex-col gap-2 sm:flex-row">
                <label className="sr-only" htmlFor={`profile-phone-${index}`}>
                  {index === 0
                    ? t("profile.primaryPhone")
                    : t("profile.phoneNumbers")}
                </label>
                <Input
                  id={`profile-phone-${index}`}
                  className="flex-1 tabular-nums"
                  inputMode="tel"
                  placeholder="+992 90 123 45 67"
                  value={phone}
                  onChange={(e) => updatePhoneAt(index, e.target.value)}
                  onBlur={(e) => {
                    const formatted =
                      formatPhoneDisplay(e.target.value) || e.target.value;
                    if (formatted !== phone) updatePhoneAt(index, formatted);
                  }}
                />
                <div className="flex shrink-0 items-center gap-2">
                  {index === 0 ? (
                    <span className="badge">{t("profile.primaryPhone")}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => makePrimary(index)}
                      className="btn btn-sm"
                    >
                      {t("profile.makePrimary")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhone(index)}
                    className="btn btn-icon-sm border-danger-200 text-danger-600 hover:bg-danger-50"
                    aria-label={t("a11y.delete")}
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {phones.length < 5 && (
            <button
              type="button"
              onClick={addPhone}
              className="btn btn-ghost btn-sm mt-3 text-sun-700 hover:bg-sun-50"
            >
              <Plus size={16} aria-hidden />
              {t("profile.addPhone")}
            </button>
          )}

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="WhatsApp">
              {(field) => (
                <Input
                  {...field}
                  inputMode="tel"
                  placeholder="992901234567"
                  value={form.whatsapp}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, whatsapp: e.target.value }))
                  }
                />
              )}
            </Field>

            <Field label="Telegram" hint={t("profile.telegramHint")}>
              {(field) => (
                <Input
                  {...field}
                  placeholder="@username"
                  value={form.telegram}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, telegram: e.target.value }))
                  }
                />
              )}
            </Field>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-ink-800 bg-ink-900 p-5 text-white">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sun-400">
            <Crown size={16} aria-hidden />
            Oriyon Premium
          </p>
          <h3 className="mb-2 font-display text-xl font-bold tracking-tight">
            {t("profile.premiumTitle")}
          </h3>
          <p className="mb-4 text-sm leading-relaxed text-white/70">
            {t("profile.premiumDesc")}
          </p>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">
            {t("profile.premiumBenefits")}
          </p>
          <ul className="mb-4 space-y-1.5 text-sm text-white/85">
            {[
              t("profile.premiumBenefit1"),
              t("profile.premiumBenefit2"),
              t("profile.premiumBenefit3"),
              t("profile.premiumBenefit4"),
              t("profile.premiumBenefit5"),
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2
                  size={14}
                  className="mt-0.5 shrink-0 text-sun-400"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mb-3 text-xs text-white/50">
            {t("profile.premiumAdminHint")}
          </p>
          <a
            href="https://t.me/oriyon_support"
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
          >
            <MessageCircle size={16} aria-hidden />
            {t("profile.writeAdmin")}
          </a>
        </section>

        <section className="flex flex-col rounded-2xl border border-lagoon-200 bg-lagoon-50 p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-lagoon-200 bg-white">
              <ShieldCheck className="text-lagoon-600" size={22} aria-hidden />
            </span>
            <div>
              <p className="text-sm leading-relaxed text-ink-700">
                <span className="font-bold text-ink-900">
                  {t("profile.security")}.
                </span>{" "}
                {t("profile.securityTip")}
              </p>
              <Link
                to="/policy"
                className="mt-3 inline-flex min-h-[2.25rem] items-center text-sm font-semibold text-lagoon-700 hover:underline"
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
                className="btn btn-primary"
              >
                <Mail size={16} aria-hidden />
                {emailStatus === "pending"
                  ? t("profile.emailSent")
                  : sendingEmail
                    ? t("profile.emailSending")
                    : t("profile.sendEmail")}
              </button>
            </div>
          )}

          {isStaffRole(role) && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm">
              <span className="text-ink-400">{t("profile.accountRole")}</span>
              <span className="label-caps text-ink-900">
                {role.replace("_", " ")}
              </span>
            </div>
          )}
        </section>
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
