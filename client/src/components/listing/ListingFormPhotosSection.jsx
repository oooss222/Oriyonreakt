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
import { resolveMediaUrl } from "../../lib/media";
import { useI18n } from "../../i18n";

function PhotoTile({
  src,
  alt,
  isCover,
  onRemove,
  onMoveLeft,
  onMoveRight,
  onMakeCover,
  canMoveLeft,
  canMoveRight,
}) {
  return (
    <div className="relative group">
      <img
        src={src}
        alt={alt}
        className="w-full h-28 object-cover rounded-xl border border-ink/8 bg-mist"
      />
      {isCover ? (
        <span className="absolute left-2 bottom-2 rounded-md bg-ink/80 px-2 py-0.5 text-[10px] font-semibold text-white">
          Обложка
        </span>
      ) : null}

      <div className="absolute inset-x-1 top-1 flex items-center justify-between gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
        <div className="flex gap-1">
          <button
            type="button"
            disabled={!canMoveLeft}
            onClick={onMoveLeft}
            className="rounded-full bg-black/70 text-white p-1 disabled:opacity-30"
            title="Влево"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!canMoveRight}
            onClick={onMoveRight}
            className="rounded-full bg-black/70 text-white p-1 disabled:opacity-30"
            title="Вправо"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          {!isCover ? (
            <button
              type="button"
              onClick={onMakeCover}
              className="rounded-full bg-black/70 text-white p-1"
              title="Сделать обложкой"
            >
              <Star className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full bg-black/70 text-white p-1"
          title="Удалить фото"
        >
          <X className="w-4 h-4" />
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

  return (
    <div className="listing-form-card" data-field="photos">
      <div className="listing-form-card__head">
        <div className="listing-form-card__title">
          <ImageIcon className="w-5 h-5 text-sun" />
          {t("form.photos")}
        </div>
        <span className="text-sm font-medium text-ink-400">
          {photosCount}/{photoLimit}
        </span>
      </div>

      <div className="listing-form-card__body space-y-4">
        <p className="text-sm text-ink-400">
          {t("listing.photosHint", { min: minPhotos, max: photoLimit })}
        </p>

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
          <UploadCloud className="w-10 h-10 mx-auto text-ink-300 mb-2" />
          <div className="font-medium text-ink">
            {compressing
              ? t("listing.photosCompressing")
              : t("listing.photosDrop")}
          </div>
          <div className="text-sm text-ink-400 mt-1">
            {t("listing.photosFormats")}
          </div>
          <label className="inline-flex items-center justify-center gap-2 mt-4 rounded-xl border border-ink/10 bg-white px-4 py-2 hover:bg-mist cursor-pointer text-sm font-medium text-ink-600">
            <Plus className="w-4 h-4" />
            {t("listing.photosPick")}
            <input
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              onChange={onInputFiles}
              className="hidden"
              disabled={compressing}
            />
          </label>
        </div>

        {photosCount > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-ink-400">
                {t("listing.photosSelected", {
                  count: photosCount,
                  max: photoLimit,
                })}
              </div>
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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {existingImages.map((img, index) => (
                <PhotoTile
                  key={`existing-${index}-${img.url}`}
                  src={resolveMediaUrl(img.url, {
                    allowEmpty: true,
                    placeholder: "",
                  })}
                  alt={`Фото ${index + 1}`}
                  isCover={index === 0}
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
                  alt={`Новое фото ${index + 1}`}
                  isCover={existingImages.length === 0 && index === 0}
                  onRemove={() => onRemoveNew?.(index)}
                  onMoveLeft={() => onMoveNew?.(index, index - 1)}
                  onMoveRight={() => onMoveNew?.(index, index + 1)}
                  onMakeCover={() => onMakeCoverNew?.(index)}
                  canMoveLeft={index > 0}
                  canMoveRight={index < previews.length - 1}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
