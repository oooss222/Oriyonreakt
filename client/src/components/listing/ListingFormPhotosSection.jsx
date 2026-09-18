import React from "react";
import { Camera, Plus, X, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { resolveMediaUrl } from "../../lib/media";
import { useI18n } from "../../i18n";

function PhotoTile({
  src,
  alt,
  isCover,
  hero = false,
  onRemove,
  onMoveLeft,
  onMoveRight,
  onMakeCover,
  canMoveLeft,
  canMoveRight,
}) {
  const { t } = useI18n();

  return (
    <div className={`listing-form-slot ${hero ? "listing-form-slot--hero" : ""}`}>
      <img src={src} alt={alt} />
      {isCover ? (
        <span className="listing-form-slot__cover">{t("listing.coverBadge")}</span>
      ) : null}
      <div className="listing-form-slot__actions">
        <button
          type="button"
          disabled={!canMoveLeft}
          onClick={onMoveLeft}
          title={t("listing.moveLeft")}
          aria-label={t("listing.moveLeft")}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={!canMoveRight}
          onClick={onMoveRight}
          title={t("listing.moveRight")}
          aria-label={t("listing.moveRight")}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        {!isCover ? (
          <button
            type="button"
            onClick={onMakeCover}
            title={t("listing.makeCover")}
            aria-label={t("listing.makeCover")}
          >
            <Star className="w-3.5 h-3.5" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onRemove}
          title={t("listing.removePhoto")}
          aria-label={t("listing.removePhoto")}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function ListingFormPhotosSection({
  photosCount,
  photoLimit,
  minPhotos = 1,
  existingImages,
  previews,
  isDragOver,
  compressing = false,
  invalid = false,
  onDragOver,
  onDragLeave,
  onDrop,
  onInputFiles,
  onRemoveExisting,
  onRemoveNew,
  onClearNew,
  onMoveExisting,
  onMoveNew,
  onMakeCoverExisting,
  onMakeCoverNew,
}) {
  const { t } = useI18n();
  const canAdd = photosCount < photoLimit && !compressing;
  const emptyCount = canAdd
    ? Math.max(
        0,
        Math.min(photoLimit, photosCount === 0 ? 3 : 6) - (photosCount + 1)
      )
    : 0;

  return (
    <div
      className={`listing-form-card ${invalid ? "listing-form-card--invalid" : ""}`}
      data-field="photos"
    >
      <div className="listing-form-card__head">
        <div className="min-w-0">
          <h2 className="listing-form-card__title listing-form-label-required">
            {t("form.photos")}
          </h2>
          <p className="listing-form-card__hint">
            {t("listing.photosHint", { min: minPhotos, max: photoLimit })}
          </p>
        </div>
        <span className="listing-form-card__count">
          {photosCount}/{photoLimit}
        </span>
      </div>

      <div className="listing-form-card__body space-y-3">
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`listing-form-slots ${
            isDragOver ? "listing-form-slots--active" : ""
          } ${compressing ? "listing-form-slots--busy" : ""}`}
        >
          {existingImages.map((img, index) => (
            <PhotoTile
              key={`existing-${index}-${img.url}`}
              src={resolveMediaUrl(img.url, {
                allowEmpty: true,
                placeholder: "",
              })}
              alt={t("listing.photoAltIndexed", { index: index + 1 })}
              isCover={index === 0}
              hero={index === 0}
              onRemove={() => onRemoveExisting?.(index)}
              onMoveLeft={() => onMoveExisting?.(index, index - 1)}
              onMoveRight={() => onMoveExisting?.(index, index + 1)}
              onMakeCover={() => onMakeCoverExisting?.(index)}
              canMoveLeft={index > 0}
              canMoveRight={index < existingImages.length - 1}
            />
          ))}

          {previews.map((src, index) => (
            <PhotoTile
              key={`new-${index}`}
              src={src}
              alt={t("listing.newPhotoAltIndexed", { index: index + 1 })}
              isCover={existingImages.length === 0 && index === 0}
              hero={existingImages.length === 0 && index === 0}
              onRemove={() => onRemoveNew?.(index)}
              onMoveLeft={() => onMoveNew?.(index, index - 1)}
              onMoveRight={() => onMoveNew?.(index, index + 1)}
              onMakeCover={() => onMakeCoverNew?.(index)}
              canMoveLeft={index > 0}
              canMoveRight={index < previews.length - 1}
            />
          ))}

          {canAdd ? (
            <label className="listing-form-slot listing-form-slot--add">
              {compressing ? (
                <span className="text-xs text-ink-400 px-2 text-center">
                  {t("listing.photosCompressing")}
                </span>
              ) : (
                <>
                  <Camera className="w-6 h-6" />
                  <span>{t("listing.photosAdd")}</span>
                  <Plus className="w-4 h-4" />
                </>
              )}
              <input
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                onChange={onInputFiles}
                className="hidden"
                disabled={compressing}
              />
            </label>
          ) : null}

          {Array.from({ length: emptyCount }).map((_, index) => (
            <label
              key={`empty-${index}`}
              className="listing-form-slot listing-form-slot--empty"
            >
              <Plus className="w-5 h-5" aria-hidden />
              <span className="sr-only">{t("listing.photosAdd")}</span>
              <input
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                onChange={onInputFiles}
                className="hidden"
                disabled={compressing}
              />
            </label>
          ))}
        </div>

        {invalid ? (
          <p className="listing-form-field-error" role="alert">
            {minPhotos === 1
              ? t("form.validationPhotoMin1")
              : t("form.validationPhotoMin", { min: minPhotos })}
          </p>
        ) : null}

        {previews.length > 0 ? (
          <button
            type="button"
            onClick={onClearNew}
            className="text-sm text-red-600 hover:underline"
          >
            {t("listing.photosClearNew")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
