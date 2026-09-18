import React from "react";
import { PencilLine, MapPin } from "lucide-react";
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
import {
  buildListingSuggestedTitle,
  canSuggestListingTitle,
} from "../../lib/listingFormTitles";
import { useI18n } from "../../i18n";

export function isGuidedWizardCategory(cat) {
  return Boolean(cat) && cat !== "realestate";
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
    <form id={formId} onSubmit={handleSubmit} className="listing-form-paydo">
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

      <section className="listing-form-card" data-field="title">
        <div className="listing-form-card__body space-y-5">
          <div>
            <div className="flex items-center justify-between gap-3 mb-1">
              <label className="listing-form-label listing-form-label-required">
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

          <div>
            <label className="listing-form-label">{t("form.description")}</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setField("description", e.target.value.slice(0, DESC_MAX))
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
      </section>

      <section className="listing-form-card" data-field="specs">
        <div className="listing-form-card__head">
          <div className="listing-form-card__title">{t("form.specs")}</div>
        </div>
        <ListingFormSpecFields
          specs={specs}
          onUpdate={onUpdateSpec}
          onRemove={onRemoveSpec}
          invalid={invalidField === "specs"}
        />
      </section>

      <section className="listing-form-card" data-field="price">
        <div className="listing-form-card__body space-y-5">
          <div>
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
            <label className="listing-form-label listing-form-label-required">
              {t("form.location")}
            </label>
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
        </div>
      </section>

    </form>
  );
}
