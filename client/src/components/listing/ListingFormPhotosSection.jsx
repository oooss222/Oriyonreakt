import React from "react";
import {
  Image as ImageIcon,
  Plus,
  UploadCloud,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";
import ListingFormSection from "./ListingFormSection";
import { resolveMediaUrl } from "../../lib/media";
import { useI18n } from "../../i18n";

function PhotoTile({
  src,
  alt,
  isCover,
  coverLabel,
  onRemove,
  onMoveLeft,
  onMoveRight,
  onMakeCover,
  canMoveLeft,
  canMoveRight,
  labels,
}) {
  return (
    <figure className="composer-photo">
      <img src={src} alt={alt} className="composer-photo__img" loading="lazy" />

      {isCover ? (
        <figcaption className="composer-photo__cover">{coverLabel}</figcaption>
      ) : null}

      <button
        type="button"
        onClick={onRemove}
        className="composer-photo__remove"
        aria-label={`${labels.remove}: ${alt}`}
      >
        <X className="h-4 w-4" aria-hidden />
      </button>

      <div className="composer-photo__tools">
        <button
          type="button"
          disabled={!canMoveLeft}
          onClick={onMoveLeft}
          className="composer-photo__tool"
          aria-label={`${labels.moveLeft}: ${alt}`}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          disabled={!canMoveRight}
          onClick={onMoveRight}
          className="composer-photo__tool"
          aria-label={`${labels.moveRight}: ${alt}`}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
        {!isCover ? (
          <button
            type="button"
            onClick={onMakeCover}
            className="composer-photo__tool"
            aria-label={`${labels.makeCover}: ${alt}`}
          >
            <Star className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
    </figure>
  );
}

export default function ListingFormPhotosSection({
  id = "listing-section-photos",
  step,
  photosCount,
  photoLimit,
  minPhotos = 1,
  existingImages,
  previews,
  isDragOver,
  compressing = false,
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
  const inputId = `${id}-input`;
  const atLimit = photosCount >= photoLimit;

  const labels = {
    remove: t("composer.removePhoto"),
    moveLeft: t("composer.moveLeft"),
    moveRight: t("composer.moveRight"),
    makeCover: t("composer.makeCover"),
  };

  return (
    <ListingFormSection
      id={id}
      step={step}
      dataField="photos"
      icon={ImageIcon}
      title={t("form.photos")}
      hint={t("listing.photosHint", { min: minPhotos, max: photoLimit })}
      complete={photosCount >= minPhotos}
      action={
        <span
          className="text-sm font-semibold tabular-nums text-ink-500"
          aria-live="polite"
        >
          {t("composer.photosCount", { count: photosCount, max: photoLimit })}
        </span>
      }
    >
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`listing-form-dropzone ${
          isDragOver
            ? "listing-form-dropzone--active"
            : "listing-form-dropzone--idle"
        }`}
      >
        <UploadCloud
          className="mx-auto mb-2 h-9 w-9 text-ink-300"
          aria-hidden
        />
        <p className="font-semibold text-ink-800">
          {compressing ? t("listing.photosCompressing") : t("listing.photosDrop")}
        </p>
        <p className="mt-1 text-sm text-ink-400">{t("listing.photosFormats")}</p>

        <label
          htmlFor={inputId}
          className={`btn mt-4 ${
            compressing || atLimit ? "pointer-events-none opacity-50" : "cursor-pointer"
          }`}
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t("listing.photosPick")}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          onChange={onInputFiles}
          className="sr-only"
          disabled={compressing || atLimit}
        />
      </div>

      {photosCount > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-ink-400">
              {t("listing.photosSelected", {
                count: photosCount,
                max: photoLimit,
              })}
            </p>
            {previews.length > 0 ? (
              <button
                type="button"
                onClick={onClearNew}
                className="btn btn-ghost btn-sm text-danger-600 hover:bg-danger-50"
              >
                {t("listing.photosClearNew")}
              </button>
            ) : null}
          </div>

          <ul
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
            aria-label={t("composer.photoList")}
          >
            {existingImages.map((img, index) => (
              <li key={`existing-${index}-${img.url}`}>
                <PhotoTile
                  src={resolveMediaUrl(img.url, {
                    allowEmpty: true,
                    placeholder: "",
                  })}
                  alt={t("composer.photoAlt", { index: index + 1 })}
                  isCover={index === 0}
                  coverLabel={t("composer.cover")}
                  labels={labels}
                  onRemove={() => onRemoveExisting?.(index)}
                  onMoveLeft={() => onMoveExisting?.(index, index - 1)}
                  onMoveRight={() => onMoveExisting?.(index, index + 1)}
                  onMakeCover={() => onMakeCoverExisting?.(index)}
                  canMoveLeft={index > 0}
                  canMoveRight={index < existingImages.length - 1}
                />
              </li>
            ))}

            {previews.map((src, index) => (
              <li key={`new-${index}`}>
                <PhotoTile
                  src={src}
                  alt={t("composer.photoAlt", {
                    index: existingImages.length + index + 1,
                  })}
                  isCover={existingImages.length === 0 && index === 0}
                  coverLabel={t("composer.cover")}
                  labels={labels}
                  onRemove={() => onRemoveNew?.(index)}
                  onMoveLeft={() => onMoveNew?.(index, index - 1)}
                  onMoveRight={() => onMoveNew?.(index, index + 1)}
                  onMakeCover={() => onMakeCoverNew?.(index)}
                  canMoveLeft={index > 0}
                  canMoveRight={index < previews.length - 1}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </ListingFormSection>
  );
}
