import React from "react";
import { Image as ImageIcon, Plus, UploadCloud, X } from "lucide-react";
import { resolveMediaUrl } from "../../lib/media";

export default function ListingFormPhotosSection({
  photosCount,
  photoLimit,
  minPhotos = 1,
  existingImages,
  previews,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onInputFiles,
  onRemoveExisting,
  onRemoveNew,
  onClearNew,
}) {
  return (
    <div className="listing-form-card">
      <div className="listing-form-card__head">
        <div className="listing-form-card__title">
          <ImageIcon className="w-5 h-5 text-sun" />
          Фотографии
        </div>
        <span className="text-sm font-medium text-slate-500">
          {photosCount}/{photoLimit}
        </span>
      </div>

      <div className="listing-form-card__body space-y-4">
        <p className="text-sm text-slate-500">
          Минимум {minPhotos}, максимум {photoLimit}. Первое фото станет
          обложкой объявления.
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
          <UploadCloud className="w-10 h-10 mx-auto text-slate-400 mb-2" />
          <div className="font-medium">
            Перетащите фото сюда или выберите файлы
          </div>
          <div className="text-sm text-slate-500 mt-1">
            JPG, PNG, WEBP.
          </div>
          <label className="inline-flex items-center justify-center gap-2 mt-4 rounded-xl border bg-white px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm font-medium">
            <Plus className="w-4 h-4" />
            Выбрать фото
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onInputFiles}
              className="hidden"
            />
          </label>
        </div>

        {photosCount > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">
                Выбрано: {photosCount}/{photoLimit}
              </div>
              {previews.length > 0 ? (
                <button
                  type="button"
                  onClick={onClearNew}
                  className="text-sm text-red-600 hover:underline"
                >
                  Очистить новые
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {existingImages.map((img, index) => (
                <div key={`existing-${index}`} className="relative group">
                  <img
                    src={resolveMediaUrl(img.url, {
                      allowEmpty: true,
                      placeholder: "",
                    })}
                    alt={`Фото ${index + 1}`}
                    className="w-full h-28 object-cover rounded-xl border bg-slate-100"
                  />
                  {index === 0 ? (
                    <span className="absolute left-2 bottom-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                      Обложка
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onRemoveExisting(index)}
                    className="absolute right-1 top-1 rounded-full bg-black/70 text-white p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition"
                    title="Удалить фото"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {previews.map((src, index) => (
                <div key={`new-${index}`} className="relative group">
                  <img
                    src={src}
                    alt={`Новое фото ${index + 1}`}
                    className="w-full h-28 object-cover rounded-xl border bg-slate-100"
                  />
                  {existingImages.length === 0 && index === 0 ? (
                    <span className="absolute left-2 bottom-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                      Обложка
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onRemoveNew(index)}
                    className="absolute right-1 top-1 rounded-full bg-black/70 text-white p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition"
                    title="Удалить фото"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
