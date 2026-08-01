import React from "react";
import { Plus, UploadCloud, X, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { resolveMediaUrl } from "../../lib/media";

export default function ListingPhotoUploader({
  existingImages,
  previews,
  photoLimit,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onInputFiles,
  onRemoveExisting,
  onRemoveFile,
  onMovePhoto,
  onClearNew,
}) {
  const photosCount = existingImages.length + previews.length;

  return (
    <div className="space-y-4">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
          isDragOver ? "border-sun bg-sun-50" : "border-slate-200 bg-slate-50"
        }`}
      >
        <UploadCloud className="mx-auto mb-2 h-10 w-10 text-slate-400" />
        <div className="font-medium">Перетащите фото сюда или выберите файлы</div>
        <div className="mt-1 text-sm text-slate-500">
          До {photoLimit} изображений. Первое фото — главное на карточке.
        </div>
        <label className="mt-4 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2 hover:bg-slate-50">
          <Plus className="h-4 w-4" />
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

      {photosCount > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Выбрано: {photosCount}/{photoLimit}
            </div>
            {previews.length > 0 && (
              <button
                type="button"
                onClick={onClearNew}
                className="text-sm text-red-600 hover:underline"
              >
                Очистить новые
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {existingImages.map((img, index) => (
              <PhotoTile
                key={`existing-${img.url}-${index}`}
                src={resolveMediaUrl(img.url, { allowEmpty: true, placeholder: "" })}
                index={index}
                isMain={index === 0 && previews.length === 0}
                total={photosCount}
                onRemove={() => onRemoveExisting(index)}
                onMove={(direction) => onMovePhoto(index, direction)}
              />
            ))}

            {previews.map((src, index) => {
              const combinedIndex = existingImages.length + index;
              return (
                <PhotoTile
                  key={`new-${index}`}
                  src={src}
                  index={combinedIndex}
                  isMain={combinedIndex === 0}
                  total={photosCount}
                  onRemove={() => onRemoveFile(index)}
                  onMove={(direction) => onMovePhoto(combinedIndex, direction)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoTile({ src, index, isMain, total, onRemove, onMove }) {
  return (
    <div className="relative group">
      <img
        src={src}
        alt={`Фото ${index + 1}`}
        className={`h-28 w-full rounded-xl border bg-slate-100 object-cover ${
          isMain ? "ring-2 ring-sun" : ""
        }`}
      />

      {isMain && (
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-sun px-2 py-0.5 text-[10px] font-bold text-white">
          <Star size={10} fill="currentColor" />
          Главное
        </span>
      )}

      <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-100 md:opacity-0 md:group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={index === 0}
          className="rounded-full bg-black/70 p-1 text-white disabled:opacity-30"
          aria-label="Переместить левее"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={index >= total - 1}
          className="rounded-full bg-black/70 p-1 text-white disabled:opacity-30"
          aria-label="Переместить правее"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
        title="Удалить фото"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
