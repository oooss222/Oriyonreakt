import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, RotateCcw, Phone, ShieldAlert } from "lucide-react";
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
  progressLabel = "",
}) {
  const { t } = useI18n();

  return (
    <aside className="hidden lg:block min-w-0">
      <div className="listing-form-sidebar">
        {previewItem ? <ListingFormPreview item={previewItem} /> : null}

        {categoryTitle || subcategory ? (
          <div className="listing-form-sidebar__cat">
            <span>{categoryTitle || "—"}</span>
            {subcategory ? <span>{subcategory}</span> : null}
          </div>
        ) : null}

        <div className="listing-form-progress-aside">
          {progressLabel ? (
            <p className="listing-form-progress-aside__label">{progressLabel}</p>
          ) : null}
          <div className="space-y-1.5">
            {checks.map((check) => (
              <div
                key={check.key || check.label}
                className={`listing-form-check ${
                  check.ok ? "listing-form-check--ok" : "listing-form-check--warn"
                }`}
              >
                {check.ok ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-lagoon-700" />
                ) : (
                  <Circle className="w-4 h-4 shrink-0" />
                )}
                <span className="min-w-0 flex-1">{check.label}</span>
                <span className="font-medium text-right">{check.detail}</span>
              </div>
            ))}

            {requirePhone ? (
              <div
                className={`listing-form-check ${
                  hasPhone ? "listing-form-check--ok" : "listing-form-check--warn"
                }`}
              >
                {hasPhone ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-lagoon-700" />
                ) : (
                  <Phone className="w-4 h-4 shrink-0" />
                )}
                <span className="min-w-0 flex-1">{t("listing.phone")}</span>
                <span className="font-medium">
                  {hasPhone ? t("listing.phoneSet") : t("listing.phoneNeeded")}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {requirePhone && !hasPhone ? (
          <Link
            to="/profile?tab=profile"
            className="block rounded-xl border border-sun/20 bg-sun-50 px-3 py-2.5 text-xs font-medium text-sun-800 hover:bg-sun-50/80"
          >
            {t("listing.addPhoneHint")}
          </Link>
        ) : null}

        {moderationHint ? (
          <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 leading-relaxed">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{moderationHint}</span>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!canPublish || saving}
          aria-busy={saving}
          className={`listing-form-publish-btn ${
            canPublish && !saving
              ? "listing-form-publish-btn--ready"
              : "listing-form-publish-btn--disabled"
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          {saving
            ? isEdit
              ? t("listing.savingShort")
              : t("listing.publishingShort")
            : isEdit
              ? t("listing.saveChanges")
              : t("listing.publishShort")}
        </button>

        {!canPublish && publishHint ? (
          <p className="text-xs text-ink-400">{publishHint}</p>
        ) : null}

        <button
          type="button"
          onClick={onReset}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-medium text-ink-600 hover:bg-mist transition"
        >
          <RotateCcw className="w-4 h-4" />
          {t("listing.resetForm")}
        </button>

        {footerNote ? (
          <p className="text-xs text-ink-400 leading-relaxed">{footerNote}</p>
        ) : null}
      </div>
    </aside>
  );
}
