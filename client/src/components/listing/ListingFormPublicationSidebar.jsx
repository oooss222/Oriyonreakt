import React from "react";
import { Link } from "react-router-dom";
import { Tag, CheckCircle2, RotateCcw, Phone, ShieldAlert } from "lucide-react";
import ListingFormPreview from "./ListingFormPreview";
import { useI18n } from "../../i18n";

export default function ListingFormPublicationSidebar({
  categoryTitle,
  subcategory,
  checks = [],
  canPublish,
  publishHint,
  saving,
  isEdit,
  onReset,
  footerNote,
  hasPhone = true,
  requirePhone = false,
  previewItem = null,
  moderationHint = null,
}) {
  const { t } = useI18n();

  return (
    <aside className="hidden lg:block">
      <div className="listing-form-sidebar">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-sun-600" aria-hidden />
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
            {t("listing.publication")}
          </h2>
        </div>

        <dl className="space-y-2 rounded-xl border border-ink-200 bg-mist-50 p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-400">{t("listing.category")}</dt>
            <dd className="text-right font-semibold text-ink-900">
              {categoryTitle || "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-400">{t("listing.subcategory")}</dt>
            <dd className="text-right font-semibold text-ink-900">
              {subcategory || "—"}
            </dd>
          </div>
        </dl>

        {previewItem ? <ListingFormPreview item={previewItem} /> : null}

        <div className="space-y-2">
          {checks.map((check) => (
            <div
              key={check.key || check.label}
              className={`listing-form-check ${
                check.ok ? "listing-form-check--ok" : "listing-form-check--warn"
              }`}
            >
              <span>{check.label}</span>
              <span className="font-medium">{check.detail}</span>
            </div>
          ))}

          {requirePhone ? (
            <div
              className={`listing-form-check ${
                hasPhone ? "listing-form-check--ok" : "listing-form-check--warn"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Phone size={14} />
                {t("listing.phone")}
              </span>
              <span className="font-medium">
                {hasPhone ? t("listing.phoneSet") : t("listing.phoneNeeded")}
              </span>
            </div>
          ) : null}
        </div>

        {requirePhone && !hasPhone ? (
          <Link
            to="/profile?tab=profile"
            className="block rounded-xl border border-sun-200 bg-sun-50 px-3 py-2.5 text-xs font-medium text-sun-800 transition-colors hover:bg-sun-100"
          >
            {t("listing.addPhoneHint")}
          </Link>
        ) : null}

        {moderationHint ? (
          <div className="flex gap-2 rounded-xl border border-warning-200 bg-warning-50 px-3 py-2.5 text-xs leading-relaxed text-warning-800">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{moderationHint}</span>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!canPublish}
          aria-describedby={
            !canPublish && publishHint ? "listing-publish-hint" : undefined
          }
          className={`listing-form-publish-btn ${
            canPublish
              ? "listing-form-publish-btn--ready"
              : "listing-form-publish-btn--disabled"
          }`}
        >
          <CheckCircle2 className="h-5 w-5" aria-hidden />
          {saving
            ? isEdit
              ? t("listing.savingShort")
              : t("listing.publishingShort")
            : isEdit
              ? t("listing.saveChanges")
              : t("listing.publishShort")}
        </button>

        {!canPublish && publishHint ? (
          <p
            id="listing-publish-hint"
            className="text-xs leading-relaxed text-danger-600"
          >
            {publishHint}
          </p>
        ) : null}

        <button type="button" onClick={onReset} className="btn btn-block">
          <RotateCcw className="h-4 w-4" aria-hidden />
          {t("listing.resetForm")}
        </button>

        {footerNote ? (
          <p className="text-xs text-ink-400 leading-relaxed">{footerNote}</p>
        ) : null}
      </div>
    </aside>
  );
}
