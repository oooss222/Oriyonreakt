import React from "react";
import { PencilLine, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { TITLE_MAX, DESC_MAX } from "../../data/listingCategories";
import {
  LOCATIONS,
  PRICE_MAX_DIGITS,
  formatPriceInput,
  getPriceDigits,
} from "../../data/specOptions";
import { getListingMinPhotos } from "../../lib/listingPhotoLimits";
import ListingFormSpecFields from "./ListingFormSpecFields";
import ListingFormPhotosSection from "./ListingFormPhotosSection";
import ListingFormPreview from "./ListingFormPreview";
import {
  buildListingSuggestedTitle,
  canSuggestListingTitle,
} from "../../lib/listingFormTitles";
import { useI18n } from "../../i18n";

export function isGuidedWizardCategory(cat) {
  return Boolean(cat) && cat !== "realestate";
}

function FieldError({ id, show, children }) {
  if (!show || !children) return null;
  return (
    <p id={id} className="listing-form-field-error" role="alert">
      {children}
    </p>
  );
}

function FormSection({ field, title, hint, invalid = false, flush = false, children }) {
  return (
    <section
      className={`listing-form-card ${invalid ? "listing-form-card--invalid" : ""}`}
      data-field={field}
    >
      {title ? (
        <div className="listing-form-card__head">
          <div className="min-w-0">
            <h2 className="listing-form-card__title">{title}</h2>
            {hint ? <p className="listing-form-card__hint">{hint}</p> : null}
          </div>
        </div>
      ) : null}
      <div className={flush ? "" : "listing-form-card__body"}>{children}</div>
    </section>
  );
}

export default function ListingGuidedForm({
  form,
  setForm,
  specs,
  onUpdateSpec,
  onRemoveSpec,
  previews,
  existingImages,
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
  formId = "listing-form",
  invalidField = "",
  sidebar = null,
  previewItem = null,
  isEdit = false,
  requirePhone = false,
  hasPhone = true,
  categoryTitle = "",
  subcategoryLabel = "",
  categoryImage = "",
  onChangeCategory,
}) {
  const { t } = useI18n();
  const photosCount = existingImages.length + previews.length;
  const minPhotos = getListingMinPhotos(form.cat);
  const priceDigits = getPriceDigits(form.price);

  const setField = (key, value) => {
    setForm((state) => ({ ...state, [key]: value }));
  };

  const handlePriceChange = (rawValue) => {
    setField("price", formatPriceInput(rawValue));
  };

  const handleSuggestTitle = () => {
    if (!canSuggestListingTitle(form.cat)) return;
    setField("title", buildListingSuggestedTitle(form.cat, specs));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(event);
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="listing-form-layout">
      <div className="listing-form-layout__main">
        {previewItem ? (
          <details className="listing-form-preview-mobile lg:hidden">
            <summary>{t("listing.previewShow")}</summary>
            <ListingFormPreview item={previewItem} />
          </details>
        ) : null}

        <FormSection
          field="category"
          title={t("form.basicInfo")}
          hint={t("listing.sectionBasicHint")}
          invalid={invalidField === "category" || invalidField === "title"}
        >
          <div className="listing-form-cat-summary">
            {categoryImage ? (
              <img
                src={categoryImage}
                alt=""
                className="listing-form-cat-summary__img"
              />
            ) : null}
            <dl className="listing-form-cat-summary__meta">
              <div>
                <dt>{t("form.category")}</dt>
                <dd>{categoryTitle || "—"}</dd>
              </div>
              {subcategoryLabel ? (
                <div>
                  <dt>{t("form.subcategory")}</dt>
                  <dd>{subcategoryLabel}</dd>
                </div>
              ) : null}
            </dl>
            {!isEdit && onChangeCategory ? (
              <button
                type="button"
                onClick={onChangeCategory}
                className="listing-form-cat-summary__change"
              >
                {t("listing.changeCategory")}
              </button>
            ) : null}
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-1">
              <label
                htmlFor="listing-title"
                className="listing-form-label listing-form-label-required"
              >
                {t("form.title")}
              </label>
              {canSuggestListingTitle(form.cat) ? (
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
              id="listing-title"
              value={form.title}
              onChange={(e) =>
                setField("title", e.target.value.slice(0, TITLE_MAX))
              }
              placeholder={t("form.titlePlaceholder")}
              className={`listing-form-input ${
                invalidField === "title" ? "listing-form-input--invalid" : ""
              }`}
              aria-invalid={invalidField === "title"}
              aria-describedby={
                invalidField === "title" ? "listing-title-error" : undefined
              }
            />
            <div className="listing-form-meta">
              {form.title.length}/{TITLE_MAX}
            </div>
            <FieldError id="listing-title-error" show={invalidField === "title"}>
              {t("listing.fieldTitleRequired")}
            </FieldError>
          </div>

          <div>
            <label htmlFor="listing-description" className="listing-form-label">
              {t("form.description")}
            </label>
            <textarea
              id="listing-description"
              value={form.description}
              onChange={(e) =>
                setField("description", e.target.value.slice(0, DESC_MAX))
              }
              rows={4}
              className="listing-form-textarea"
              placeholder={t("form.descriptionPlaceholder")}
            />
            <div className="listing-form-meta">
              {form.description.length}/{DESC_MAX}
            </div>
          </div>
        </FormSection>

        <ListingFormPhotosSection
          photosCount={photosCount}
          photoLimit={photoLimit}
          minPhotos={minPhotos}
          existingImages={existingImages}
          previews={previews}
          isDragOver={isDragOver}
          compressing={compressing}
          invalid={invalidField === "photos"}
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

        <FormSection
          field="specs"
          title={t("form.specs")}
          hint={t("listing.sectionSpecsHint")}
          invalid={invalidField === "specs"}
          flush
        >
          <ListingFormSpecFields
            specs={specs}
            onUpdate={onUpdateSpec}
            onRemove={onRemoveSpec}
            invalid={invalidField === "specs"}
          />
        </FormSection>

        <FormSection
          field="price"
          title={t("form.price")}
          hint={t("listing.sectionPriceHint")}
          invalid={invalidField === "price"}
        >
          <label htmlFor="listing-price" className="sr-only">
            {t("form.price")}
          </label>
          <div
            className={`listing-form-price-wrap ${
              invalidField === "price" ? "listing-form-input--invalid" : ""
            }`}
          >
            <input
              id="listing-price"
              value={form.price}
              onChange={(e) => handlePriceChange(e.target.value)}
              onPaste={(e) => {
                e.preventDefault();
                handlePriceChange(e.clipboardData.getData("text"));
              }}
              placeholder={t("form.pricePlaceholder")}
              inputMode="numeric"
              autoComplete="off"
              aria-invalid={invalidField === "price"}
              aria-describedby={
                invalidField === "price" ? "listing-price-error" : undefined
              }
            />
            <span className="listing-form-price-suffix">
              {t("price.currency")}
            </span>
          </div>
          <div className="listing-form-meta">
            {priceDigits.length}/{PRICE_MAX_DIGITS} {t("form.digits")}
          </div>
          <FieldError id="listing-price-error" show={invalidField === "price"}>
            {t("form.validationPrice")}
          </FieldError>
        </FormSection>

        <FormSection
          field="location"
          title={t("form.location")}
          hint={t("listing.sectionLocationHint")}
          invalid={invalidField === "location"}
        >
          <div className="listing-form-location-segment" role="group">
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
                  aria-pressed={active}
                >
                  <MapPin className="w-4 h-4" />
                  {city}
                </button>
              );
            })}
          </div>
          <FieldError show={invalidField === "location"}>
            {t("form.validationLocation")}
          </FieldError>
        </FormSection>

        {requirePhone ? (
          <FormSection
            field="phone"
            title={t("listing.sectionContact")}
            hint={t("listing.sectionContactHint")}
            invalid={invalidField === "phone"}
          >
            <div
              className={`listing-form-contact ${
                hasPhone
                  ? "listing-form-contact--ok"
                  : "listing-form-contact--warn"
              }`}
            >
              <Phone className="w-4 h-4 shrink-0" />
              <span>
                {hasPhone
                  ? t("listing.phoneSet")
                  : t("listing.phoneNeeded")}
              </span>
              {!hasPhone ? (
                <Link
                  to="/profile?tab=profile"
                  className="ml-auto text-sm font-semibold text-sun-700 hover:underline"
                >
                  {t("listing.goAddPhone")}
                </Link>
              ) : null}
            </div>
          </FormSection>
        ) : null}
      </div>

      {sidebar}
    </form>
  );
}
