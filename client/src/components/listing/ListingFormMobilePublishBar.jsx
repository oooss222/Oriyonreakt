import React from "react";
import { CheckCircle2 } from "lucide-react";
import { useI18n } from "../../i18n";

export default function ListingFormMobilePublishBar({
  canPublish,
  saving,
  isEdit,
  publishHint,
  onPublish,
  visible = true,
}) {
  const { t } = useI18n();

  if (!visible) return null;

  return (
    <div className="listing-form-mobile-bar lg:hidden">
      <div className="listing-form-mobile-bar__inner">
        {!canPublish && publishHint ? (
          <p
            id="listing-mobile-publish-hint"
            className="listing-form-mobile-bar__hint"
          >
            {publishHint}
          </p>
        ) : (
          <p className="listing-form-mobile-bar__hint listing-form-mobile-bar__hint--ok">
            {isEdit ? t("listing.readyToSave") : t("listing.readyToPublish")}
          </p>
        )}

        <button
          type="button"
          disabled={!canPublish || saving}
          onClick={onPublish}
          aria-describedby={
            !canPublish && publishHint ? "listing-mobile-publish-hint" : undefined
          }
          className={`listing-form-publish-btn ${
            canPublish && !saving
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
              ? t("common.save")
              : t("listing.publishShort")}
        </button>
      </div>
    </div>
  );
}
