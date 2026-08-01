import React from "react";
import {
  Tag,
  Image as ImageIcon,
  ListChecks,
  Info,
  Layers3,
  MapPin,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { CATS, TITLE_MAX, DESC_MAX } from "../../data/listingCategories";
import { LOCATIONS, PRICE_MAX_DIGITS, formatPriceInput, getPriceDigits } from "../../data/specOptions";
import {
  buildSuggestedTitle,
  getDescriptionPlaceholder,
  getTitlePlaceholder,
} from "../../lib/listingFormHints";
import ListingWizardStepper from "./ListingWizardStepper";
import ListingWizardMobileBar from "./ListingWizardMobileBar";
import ListingPhotoUploader from "./ListingPhotoUploader";
import ListingSpecsFields from "./ListingSpecsFields";
import ListingFormPreview from "./ListingFormPreview";
import ListingReadinessChecklist, {
  isListingReady,
} from "./ListingReadinessChecklist";

const ALL_STEPS = [
  { id: "category", label: "Категория", shortLabel: "Кат.", icon: Layers3 },
  { id: "photos", label: "Фото", shortLabel: "Фото", icon: ImageIcon },
  { id: "details", label: "Описание", shortLabel: "Инфо", icon: Info },
  { id: "specs", label: "Параметры", shortLabel: "Пар.", icon: ListChecks },
  { id: "publish", label: "Публикация", shortLabel: "Публ.", icon: Tag },
];

const CATEGORY_OPTIONS = Object.entries(CATS).filter(([key]) => key !== "realestate");

export default function GeneralListingWizard({
  form,
  setForm,
  specs,
  setSpecs,
  existingImages,
  previews,
  files,
  photoLimit,
  priceNegotiable,
  setPriceNegotiable,
  isDragOver,
  setIsDragOver,
  onFiles,
  onInputFiles,
  onRemoveExisting,
  onRemoveFile,
  onMovePhoto,
  onClearNew,
  handleCatChange,
  handleSubcategoryChange,
  handlePriceChange,
  updateSpec,
  addSpecRow,
  removeSpecRow,
  onSubmit,
  saving,
  isEdit,
  skipCategoryStep = false,
}) {
  const steps = skipCategoryStep ? ALL_STEPS.slice(1) : ALL_STEPS;
  const [step, setStep] = React.useState(0);
  const [localErr, setLocalErr] = React.useState("");

  const stepId = steps[step]?.id;
  const cat = CATS[form.cat];
  const subs = cat?.subs || [];
  const photosCount = existingImages.length + previews.length;
  const priceDigits = getPriceDigits(form.price);

  const locationOptions = React.useMemo(() => {
    if (form.location && !LOCATIONS.includes(form.location)) {
      return [form.location, ...LOCATIONS];
    }
    return LOCATIONS;
  }, [form.location]);

  const setField = (key, value) => {
    setForm((state) => ({ ...state, [key]: value }));
  };

  const validateStep = () => {
    if (stepId === "category") {
      if (!form.cat || !form.subcategory) return "Выберите категорию и подкатегорию";
    }

    if (stepId === "photos") {
      if (photosCount < 1) return "Добавьте минимум 1 фотографию";
      if (photosCount > photoLimit) return `Максимум ${photoLimit} фотографий`;
    }

    if (stepId === "details") {
      if (!form.title.trim()) return "Укажите заголовок";
      if (!priceNegotiable && !getPriceDigits(form.price)) return "Укажите цену или отметьте «Договорная»";
      if (!form.location.trim()) return "Выберите город";
    }

    if (stepId === "specs") {
      const missing = specs.filter(
        (row) => row.locked && !String(row.value || "").trim()
      );
      if (missing.length) {
        return `Заполните: ${missing.map((row) => row.name).join(", ")}`;
      }
    }

    if (stepId === "publish") {
      if (
        !isListingReady({
          form,
          specs,
          photosCount,
          photoLimit,
          priceNegotiable,
          minPhotos: 1,
        })
      ) {
        return "Заполните обязательные поля перед публикацией";
      }
    }

    return "";
  };

  const goNext = () => {
    const message = validateStep();
    if (message) {
      setLocalErr(message);
      return;
    }

    setLocalErr("");

    if (stepId === "specs" && !form.title.trim()) {
      setField("title", buildSuggestedTitle(form, specs));
    }

    if (step < steps.length - 1) {
      setStep((value) => value + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goPrev = () => {
    setLocalErr("");
    setStep((value) => Math.max(0, value - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = (event) => {
    if (event?.preventDefault) event.preventDefault();
    const message = validateStep();
    if (message) {
      setLocalErr(message);
      return;
    }
    onSubmit?.(event);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24 lg:pb-6">
      <ListingWizardStepper steps={steps} currentStep={step} />

      {localErr && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {localErr}
        </div>
      )}

      {stepId === "category" && (
        <section className="space-y-5 rounded-2xl border bg-white p-5">
          <div>
            <h2 className="text-lg font-semibold">Что вы продаёте?</h2>
            <p className="mt-1 text-sm text-slate-500">
              Выберите категорию — мы подставим нужные характеристики.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {CATEGORY_OPTIONS.map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleCatChange(key)}
                className={`rounded-2xl border p-4 text-left transition hover:shadow-md ${
                  form.cat === key ? "border-sun bg-sun-50 ring-1 ring-sun/30" : "bg-white"
                }`}
              >
                <img
                  src={value.img}
                  alt=""
                  className="mb-3 h-12 w-12 object-contain"
                />
                <div className="font-semibold text-sm">{value.title}</div>
                <div className="mt-1 text-xs text-slate-500 line-clamp-2">{value.desc}</div>
              </button>
            ))}
          </div>

          {form.cat && subs.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium">Подкатегория</label>
              <div className="flex flex-wrap gap-2">
                {subs.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => handleSubcategoryChange(sub)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                      form.subcategory === sub
                        ? "border-sun bg-sun text-white"
                        : "hover:border-sun/40"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {stepId === "photos" && (
        <section className="rounded-2xl border bg-white p-5">
          <ListingPhotoUploader
            existingImages={existingImages}
            previews={previews}
            photoLimit={photoLimit}
            isDragOver={isDragOver}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              onFiles(e.dataTransfer.files);
            }}
            onInputFiles={onInputFiles}
            onRemoveExisting={onRemoveExisting}
            onRemoveFile={onRemoveFile}
            onMovePhoto={onMovePhoto}
            onClearNew={onClearNew}
          />
        </section>
      )}

      {stepId === "details" && (
        <section className="rounded-2xl border bg-white p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Основная информация</h2>
            <button
              type="button"
              onClick={() => setField("title", buildSuggestedTitle(form, specs))}
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-sun hover:bg-sun-50"
            >
              <Sparkles size={14} />
              Подсказка заголовка
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Заголовок</label>
            <input
              value={form.title}
              onChange={(e) => setField("title", e.target.value.slice(0, TITLE_MAX))}
              placeholder={getTitlePlaceholder(form.cat, form.subcategory)}
              className="h-11 w-full rounded-lg border px-3 outline-none focus:ring-2 focus:ring-sun/40"
            />
            <div className="mt-1 text-xs text-slate-500">
              {form.title.length}/{TITLE_MAX}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Цена, TJS</label>
              <input
                value={form.price}
                onChange={(e) => handlePriceChange(e.target.value)}
                disabled={priceNegotiable}
                placeholder="Например: 120 000"
                inputMode="numeric"
                className="h-11 w-full rounded-lg border px-3 outline-none focus:ring-2 focus:ring-sun/40 disabled:bg-slate-100"
              />
              <div className="mt-1 text-xs text-slate-500">
                {priceDigits.length}/{PRICE_MAX_DIGITS} цифр
              </div>
              <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={priceNegotiable}
                  onChange={(e) => setPriceNegotiable(e.target.checked)}
                  className="accent-sun"
                />
                Договорная
              </label>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Город</label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={
                    locationOptions.includes(form.location)
                      ? form.location
                      : locationOptions[0]
                  }
                  onChange={(e) => setField("location", e.target.value)}
                  className="h-11 w-full rounded-lg border bg-white pl-9 pr-3 outline-none focus:ring-2 focus:ring-sun/40"
                >
                  {locationOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Описание</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setField("description", e.target.value.slice(0, DESC_MAX))
              }
              rows={7}
              placeholder={getDescriptionPlaceholder(form.cat)}
              className="w-full resize-y rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-sun/40"
            />
            <div className="mt-1 text-xs text-slate-500">
              {form.description.length}/{DESC_MAX}
            </div>
          </div>
        </section>
      )}

      {stepId === "specs" && (
        <section className="rounded-2xl border bg-white p-5">
          <ListingSpecsFields
            specs={specs}
            updateSpec={updateSpec}
            addSpecRow={addSpecRow}
            removeSpecRow={removeSpecRow}
          />
        </section>
      )}

      {stepId === "publish" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-4 rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-semibold">Проверьте перед публикацией</h2>
            <ListingReadinessChecklist
              form={form}
              specs={specs}
              photosCount={photosCount}
              photoLimit={photoLimit}
              priceNegotiable={priceNegotiable}
            />
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <ShieldAlert size={16} />
                Безопасная сделка
              </div>
              Не переводите предоплату незнакомцам. Встречайтесь лично и проверяйте товар перед оплатой.
            </div>
          </section>

          <aside className="space-y-4">
            <div className="sticky top-4 space-y-4 rounded-2xl border bg-white p-5">
              <ListingFormPreview
                form={form}
                previews={previews}
                existingImages={existingImages}
                priceNegotiable={priceNegotiable}
              />

              <button
                type="submit"
                disabled={saving}
                className={`hidden lg:inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white ${
                  saving ? "bg-slate-400" : "bg-sun hover:bg-sun-600"
                }`}
              >
                {saving
                  ? isEdit
                    ? "Сохранение..."
                    : "Публикация..."
                  : isEdit
                    ? "Сохранить изменения"
                    : "Опубликовать"}
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="hidden lg:flex items-center justify-between gap-3 rounded-2xl border bg-white p-4">
        <button
          type="button"
          onClick={goPrev}
          disabled={step === 0 || saving}
          className="rounded-xl border px-4 py-2 font-semibold disabled:opacity-40"
        >
          Назад
        </button>

        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="rounded-xl bg-sun px-5 py-2 font-semibold text-white"
          >
            Далее
          </button>
        ) : (
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-sun px-5 py-2 font-semibold text-white disabled:bg-slate-400"
          >
            {saving
              ? isEdit
                ? "Сохранение..."
                : "Публикация..."
              : isEdit
                ? "Сохранить"
                : "Опубликовать"}
          </button>
        )}
      </div>

      <ListingWizardMobileBar
        step={step}
        totalSteps={steps.length}
        onBack={goPrev}
        onNext={goNext}
        onSubmit={handleSubmit}
        saving={saving}
        isLastStep={step === steps.length - 1}
        isEdit={isEdit}
      />
    </form>
  );
}
