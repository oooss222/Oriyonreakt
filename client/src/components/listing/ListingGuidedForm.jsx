import React from "react";
import {
  ListChecks,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  PencilLine,
  MapPin,
} from "lucide-react";
import {
  CATS,
  TITLE_MAX,
  DESC_MAX,
} from "../../data/listingCategories";
import {
  LOCATIONS,
  PRICE_MAX_DIGITS,
  formatPriceInput,
  getPriceDigits,
} from "../../data/specOptions";
import { getListingMinPhotos } from "../../lib/listingPhotoLimits";
import ListingFormSpecFields, {
  areListingSpecsComplete,
} from "./ListingFormSpecFields";
import ListingFormPhotosSection from "./ListingFormPhotosSection";
import ListingFormPublicationSidebar from "./ListingFormPublicationSidebar";
import ListingFormPreview from "./ListingFormPreview";
import { buildPublishHintParts } from "../../lib/listingFormValidation";
import { buildTransportSuggestedTitle } from "../../lib/listingFormTitles";
import { useI18n } from "../../i18n";

export function isGuidedWizardCategory(cat) {
  return cat === "transport" || cat === "phones";
}

const STEP_IDS = ["type", "photos", "details", "review"];

export default function ListingGuidedForm({
  form,
  setForm,
  specs,
  onUpdateSpec,
  onRemoveSpec,
  onSubcategoryChange,
  files,
  previews,
  existingImages,
  onFiles,
  onInputFiles,
  removeFile,
  removeExistingImage,
  clearNewFiles,
  onMoveExisting,
  onMoveNew,
  onMakeCoverExisting,
  onMakeCoverNew,
  compressing = false,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  photoLimit,
  onSubmit,
  saving,
  isEdit = false,
  onReset,
  formId = "listing-form",
  requirePhone = false,
  hasPhone = true,
  invalidField = "",
  previewItem,
}) {
  const { t } = useI18n();
  const [step, setStep] = React.useState(0);

  const cat = CATS[form.cat];
  const photosCount = existingImages.length + previews.length;
  const minPhotos = getListingMinPhotos(form.cat);
  const priceDigits = getPriceDigits(form.price);

  const specsComplete = areListingSpecsComplete(specs);
  const hasPhotos = photosCount >= minPhotos;
  const hasTitle = Boolean(form.title.trim());
  const hasPrice = Boolean(priceDigits);
  const hasLocation = Boolean(form.location?.trim());
  const hasSubcategory = Boolean(form.subcategory?.trim());

  const canPublish =
    hasSubcategory &&
    specsComplete &&
    hasPhotos &&
    hasTitle &&
    hasPrice &&
    hasLocation &&
    (!requirePhone || hasPhone) &&
    !saving;

  const publishHintParts = buildPublishHintParts({
    form,
    specs,
    photosCount,
    minPhotos,
    isRealEstate: false,
    t,
  });
  if (requirePhone && !hasPhone) {
    publishHintParts.unshift(t("listing.phoneHintShort"));
  }
  const publishHint = publishHintParts.length
    ? `${t("form.fillPrefix")} ${publishHintParts.join(", ")}`
    : "";

  const stepMeta = [
    {
      id: "type",
      label: t("listing.wizardStepType"),
      ok: hasSubcategory && specsComplete,
    },
    {
      id: "photos",
      label: t("listing.wizardStepPhotos"),
      ok: hasPhotos,
    },
    {
      id: "details",
      label: t("listing.wizardStepDetails"),
      ok: hasTitle && hasPrice && hasLocation,
    },
    {
      id: "review",
      label: t("listing.wizardStepReview"),
      ok: canPublish,
    },
  ];

  const setField = (key, value) => {
    setForm((state) => ({ ...state, [key]: value }));
  };

  const handlePriceChange = (rawValue) => {
    setField("price", formatPriceInput(rawValue));
  };

  const handleSuggestTitle = () => {
    if (form.cat !== "transport") return;
    setField("title", buildTransportSuggestedTitle(form, specs));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(event);
  };

  const goNext = () => setStep((s) => Math.min(STEP_IDS.length - 1, s + 1));
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const sidebarChecks = [
    {
      key: "type",
      label: t("form.category"),
      ok: hasSubcategory,
      detail: form.subcategory || t("form.notSelected"),
    },
    {
      key: "specs",
      label: t("form.specs"),
      ok: specsComplete,
      detail: specsComplete ? t("form.specsFilled") : t("form.specsEmpty"),
    },
    {
      key: "photos",
      label: t("form.photos"),
      ok: hasPhotos,
      detail: `${photosCount}/${photoLimit}`,
    },
    {
      key: "title",
      label: t("form.titleLabel"),
      ok: hasTitle,
      detail: hasTitle ? t("form.specified") : t("form.notSpecified"),
    },
    {
      key: "price",
      label: t("form.price"),
      ok: hasPrice,
      detail: hasPrice
        ? `${formatPriceInput(form.price)} ${t("price.currency")}`
        : t("form.priceEmpty"),
    },
  ];

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem] gap-5"
    >
      <section className="space-y-5 min-w-0">
        <div className="listing-form-card">
          <div className="listing-form-card__body py-3">
            <ol className="flex flex-wrap gap-2">
              {stepMeta.map((item, index) => {
                const active = index === step;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setStep(index)}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "bg-sun text-white"
                          : item.ok
                            ? "bg-mist text-ink-600"
                            : "bg-white border border-ink/10 text-ink-400"
                      }`}
                    >
                      <span>{index + 1}</span>
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {step === 0 ? (
          <div className="listing-form-card" data-field="specs">
            <div className="listing-form-card__head">
              <div className="listing-form-card__title">
                <ListChecks className="w-5 h-5 text-sun" />
                {t("listing.wizardStepType")}
              </div>
            </div>
            <div className="listing-form-card__body space-y-4">
              <div>
                <label className="listing-form-label listing-form-label-required">
                  {t("form.subcategory")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(cat?.subs || []).map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => onSubcategoryChange(sub)}
                      className={`listing-form-chip ${
                        form.subcategory === sub
                          ? "listing-form-chip--active"
                          : ""
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              <ListingFormSpecFields
                specs={specs}
                onUpdate={onUpdateSpec}
                onRemove={onRemoveSpec}
                invalid={invalidField === "specs"}
              />
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <ListingFormPhotosSection
            photosCount={photosCount}
            photoLimit={photoLimit}
            minPhotos={minPhotos}
            existingImages={existingImages}
            previews={previews}
            isDragOver={isDragOver}
            compressing={compressing}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onInputFiles={onInputFiles}
            onRemoveExisting={removeExistingImage}
            onRemoveNew={removeFile}
            onClearNew={clearNewFiles}
            onMoveExisting={onMoveExisting}
            onMoveNew={onMoveNew}
            onMakeCoverExisting={onMakeCoverExisting}
            onMakeCoverNew={onMakeCoverNew}
          />
        ) : null}

        {step === 2 ? (
          <div className="listing-form-card" data-field="title">
            <div className="listing-form-card__head">
              <div className="listing-form-card__title">
                <FileText className="w-5 h-5 text-sun" />
                {t("listing.wizardStepDetails")}
              </div>
            </div>
            <div className="listing-form-card__body space-y-4">
              <div>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <label className="listing-form-label listing-form-label-required">
                    {t("form.title")}
                  </label>
                  {form.cat === "transport" ? (
                    <button
                      type="button"
                      onClick={handleSuggestTitle}
                      className="inline-flex items-center gap-1 text-xs font-medium text-sun hover:text-sun-700"
                    >
                      <PencilLine className="w-3.5 h-3.5" />
                      {t("form.generateTitle")}
                    </button>
                  ) : null}
                </div>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setField("title", e.target.value.slice(0, TITLE_MAX))
                  }
                  placeholder={t("form.titlePlaceholder")}
                  className="listing-form-input"
                />
                <div className="listing-form-meta">
                  {form.title.length}/{TITLE_MAX}
                </div>
              </div>

              <div data-field="price">
                <label className="listing-form-label listing-form-label-required">
                  {t("form.price")}
                </label>
                <div className="listing-form-price-wrap">
                  <input
                    value={form.price}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    onPaste={(e) => {
                      e.preventDefault();
                      handlePriceChange(e.clipboardData.getData("text"));
                    }}
                    placeholder={t("form.pricePlaceholder")}
                    inputMode="numeric"
                    autoComplete="off"
                  />
                  <span className="listing-form-price-suffix">
                    {t("price.currency")}
                  </span>
                </div>
                <div className="listing-form-meta">
                  {priceDigits.length}/{PRICE_MAX_DIGITS} {t("form.digits")}
                </div>
              </div>

              <div>
                <label className="listing-form-label">{t("form.location")}</label>
                <div className="listing-form-location-segment">
                  {LOCATIONS.map((city) => {
                    const active = form.location === city;
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setField("location", city)}
                        className={`listing-form-location-btn ${
                          active ? "listing-form-location-btn--active" : ""
                        }`}
                      >
                        <MapPin className="w-4 h-4" />
                        {city}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="listing-form-label">{t("form.description")}</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setField(
                      "description",
                      e.target.value.slice(0, DESC_MAX)
                    )
                  }
                  rows={5}
                  className="listing-form-textarea"
                  placeholder={t("form.descriptionPlaceholder")}
                />
                <div className="listing-form-meta">
                  {form.description.length}/{DESC_MAX}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="listing-form-card">
            <div className="listing-form-card__head">
              <div className="listing-form-card__title">
                <Eye className="w-5 h-5 text-sun" />
                {t("listing.wizardStepReview")}
              </div>
            </div>
            <div className="listing-form-card__body space-y-4">
              <div className="rounded-xl border border-sun/25 bg-sun-50 px-4 py-3 text-sm text-sun-900">
                {t("listing.moderationLikelyHint")}
              </div>
              <div className="max-w-xs">
                <ListingFormPreview item={previewItem} />
              </div>
              <dl className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-mist/60 px-3 py-2">
                  <dt className="text-ink-400">{t("form.category")}</dt>
                  <dd className="font-semibold text-ink">
                    {cat?.title || form.cat}
                  </dd>
                </div>
                <div className="rounded-xl bg-mist/60 px-3 py-2">
                  <dt className="text-ink-400">{t("form.subcategory")}</dt>
                  <dd className="font-semibold text-ink">
                    {form.subcategory || "—"}
                  </dd>
                </div>
                <div className="rounded-xl bg-mist/60 px-3 py-2">
                  <dt className="text-ink-400">{t("form.photos")}</dt>
                  <dd className="font-semibold text-ink">
                    {photosCount}/{photoLimit}
                  </dd>
                </div>
                <div className="rounded-xl bg-mist/60 px-3 py-2">
                  <dt className="text-ink-400">{t("form.price")}</dt>
                  <dd className="font-semibold text-ink">
                    {hasPrice
                      ? `${formatPriceInput(form.price)} ${t("price.currency")}`
                      : "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-medium text-ink-600 hover:bg-mist disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
            {t("listing.wizardBack")}
          </button>

          {step < STEP_IDS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-white px-4 py-2.5 text-sm font-semibold hover:bg-ink/90"
            >
              {t("listing.wizardNext")}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canPublish}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold ${
                canPublish
                  ? "bg-sun text-white hover:bg-sun-600"
                  : "bg-mist text-ink-400 cursor-not-allowed"
              }`}
            >
              {saving
                ? isEdit
                  ? t("listing.savingShort")
                  : t("listing.publishingShort")
                : isEdit
                  ? t("listing.editForm")
                  : t("listing.publishShort")}
            </button>
          )}
        </div>
      </section>

      <ListingFormPublicationSidebar
        categoryTitle={cat?.title}
        subcategory={form.subcategory}
        checks={sidebarChecks}
        canPublish={canPublish}
        publishHint={publishHint}
        saving={saving}
        isEdit={isEdit}
        onReset={onReset}
        requirePhone={requirePhone}
        hasPhone={hasPhone}
        previewItem={previewItem}
        moderationHint={!isEdit ? t("listing.moderationLikelyHint") : null}
        footerNote={
          isEdit ? t("listing.editModerationHint") : t("listing.publishHint")
        }
      />
    </form>
  );
}
