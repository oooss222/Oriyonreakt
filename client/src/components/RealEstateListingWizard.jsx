import React from "react";
import {
  Building2,
  MapPin,
  ListChecks,
  Image as ImageIcon,
  Tag,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  X,
} from "lucide-react";
import {
  DEAL_TYPES,
  SUBCATEGORY_META,
  REAL_ESTATE_CITIES,
  getDistrictsForCity,
} from "../data/realEstate";
import { formatPriceInput } from "../data/specOptions";
import { getSpecValue } from "../lib/realEstate";
import { TITLE_MAX, DESC_MAX } from "../data/listingCategories";
import { getListingPhotoLimit } from "../lib/listingPhotoLimits";
import PriceAdequacyBadge from "./PriceAdequacyBadge";
import { api } from "../lib/api";

const STEPS = [
  { id: "type", label: "Тип", icon: Building2 },
  { id: "location", label: "Адрес", icon: MapPin },
  { id: "details", label: "Параметры", icon: ListChecks },
  { id: "photos", label: "Фото", icon: ImageIcon },
  { id: "publish", label: "Публикация", icon: Tag },
];

function specField(specs, name) {
  return specs.find((row) => row.name === name);
}

function updateSpecByName(setSpecs, name, value) {
  setSpecs((rows) =>
    rows.map((row) => (row.name === name ? { ...row, value } : row))
  );
}

function buildSuggestedTitle(form, specs) {
  const rooms = getSpecValue(specs, "Комнат");
  const district = getSpecValue(specs, "Район");
  const deal = getSpecValue(specs, "Тип сделки");
  const parts = [];

  if (rooms) parts.push(`${rooms}-комн.`);
  if (form.subcategory) parts.push(form.subcategory.toLowerCase());
  if (district) parts.push(district);
  else if (form.location) parts.push(form.location);
  if (deal) parts.unshift(deal);

  return parts.join(", ").slice(0, TITLE_MAX);
}

export default function RealEstateListingWizard({
  form,
  setForm,
  specs,
  setSpecs,
  geo,
  setGeo,
  files,
  previews,
  existingImages,
  onFiles,
  onInputFiles,
  removeFile,
  removeExistingImage,
  photoLimit = getListingPhotoLimit("realestate"),
  onSubmit,
  saving,
  isEdit = false,
}) {
  const [step, setStep] = React.useState(0);
  const [localErr, setLocalErr] = React.useState("");
  const [developments, setDevelopments] = React.useState([]);

  const districts = getDistrictsForCity(form.location);
  const photosCount = existingImages.length + previews.length;

  React.useEffect(() => {
    if (form.subcategory !== "Новостройки") return;

    api
      .developments(form.location || "Душанбе")
      .then((rows) => setDevelopments(Array.isArray(rows) ? rows : []))
      .catch(() => setDevelopments([]));
  }, [form.location, form.subcategory]);

  const setField = (key, value) => {
    setForm((state) => ({ ...state, [key]: value }));
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.subcategory) return "Выберите тип недвижимости";
      if (!getSpecValue(specs, "Тип сделки")) return "Выберите тип сделки";
    }

    if (step === 1) {
      if (!form.location) return "Выберите город";
      if (districts.length && !getSpecValue(specs, "Район")) {
        return "Выберите район";
      }
    }

    if (step === 2) {
      const needsRooms = ["Квартиры", "Новостройки", "Дома и коттеджи"].includes(
        form.subcategory
      );
      const needsArea = !["Гаражи и парковки"].includes(form.subcategory);

      if (needsRooms && !getSpecValue(specs, "Комнат")) {
        return "Укажите количество комнат";
      }

      if (needsArea) {
        const area =
          getSpecValue(specs, "Площадь общая") ||
          getSpecValue(specs, "Площадь дома") ||
          getSpecValue(specs, "Площадь") ||
          getSpecValue(specs, "Площадь участка");

        if (!area) return "Укажите площадь";
      }
    }

    if (step === 3) {
      if (photosCount < 3) return "Добавьте минимум 3 фотографии";
      if (photosCount > photoLimit) {
        return `Максимум ${photoLimit} фотографий для этой категории`;
      }
    }

    if (step === 4) {
      if (!form.title.trim()) return "Укажите заголовок";
      if (!getPriceDigits(form.price)) return "Укажите цену";
    }

    return "";
  };

  const previewListing = React.useMemo(
    () => ({
      price: form.price,
      location: form.location,
      specs,
      rePricePerSqm: null,
    }),
    [form.price, form.location, specs]
  );

  const goNext = () => {
    const message = validateStep();
    if (message) {
      setLocalErr(message);
      return;
    }

    setLocalErr("");

    if (step === 3 && !form.title.trim()) {
      setField("title", buildSuggestedTitle(form, specs));
    }

    if (step < STEPS.length - 1) {
      setStep((value) => value + 1);
    }
  };

  const goPrev = () => {
    setLocalErr("");
    setStep((value) => Math.max(0, value - 1));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const message = validateStep();
    if (message) {
      setLocalErr(message);
      return;
    }
    onSubmit?.(event);
  };

  const detailFields = specs.filter((row) =>
    [
      "Комнат",
      "Площадь общая",
      "Площадь дома",
      "Площадь",
      "Площадь участка",
      "Этаж",
      "Этажей в доме",
      "Тип дома",
      "Год постройки",
      "Ремонт",
      "Мебель",
      "Состояние",
    ].includes(row.name)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border bg-white p-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            const active = index === step;
            const done = index < step;

            return (
              <div
                key={item.id}
                className={`rounded-xl px-3 py-2 text-center text-xs font-semibold ${
                  active
                    ? "bg-sun text-white"
                    : done
                    ? "bg-sun-50 text-sun-700"
                    : "bg-slate-50 text-slate-500"
                }`}
              >
                <Icon size={16} className="mx-auto mb-1" />
                {item.label}
              </div>
            );
          })}
        </div>
      </div>

      {localErr && (
        <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4 text-sm">
          {localErr}
        </div>
      )}

      {step === 0 && (
        <section className="rounded-2xl border bg-white p-5 space-y-4">
          <h2 className="text-lg font-semibold">Тип сделки и объекта</h2>

          <div className="flex flex-wrap gap-2">
            {DEAL_TYPES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  updateSpecByName(setSpecs, "Тип сделки", item.value)
                }
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                  getSpecValue(specs, "Тип сделки") === item.value
                    ? "bg-sun text-white border-sun"
                    : "bg-white hover:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(SUBCATEGORY_META).map(([name, meta]) => (
              <button
                key={name}
                type="button"
                onClick={() => setField("subcategory", name)}
                className={`rounded-2xl border p-4 text-left transition hover:shadow-md ${
                  form.subcategory === name
                    ? "border-sun bg-sun-50"
                    : "bg-white"
                }`}
              >
                <div className="font-semibold">{name}</div>
                <div className="text-xs text-slate-500 mt-1">{meta.desc}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="rounded-2xl border bg-white p-5 space-y-4">
          <h2 className="text-lg font-semibold">Где находится объект</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium mb-1 block">Город</span>
              <select
                value={form.location}
                onChange={(e) => {
                  setField("location", e.target.value);
                  updateSpecByName(setSpecs, "Район", "");
                  setGeo(null);
                }}
                className="w-full h-11 rounded-lg border px-3"
              >
                {REAL_ESTATE_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>

            {districts.length > 0 && (
              <label className="block">
                <span className="text-sm font-medium mb-1 block">Район</span>
                <select
                  value={getSpecValue(specs, "Район")}
                  onChange={(e) =>
                    updateSpecByName(setSpecs, "Район", e.target.value)
                  }
                  className="w-full h-11 rounded-lg border px-3"
                >
                  <option value="">Выберите район</option>
                  {districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <label className="block">
            <span className="text-sm font-medium mb-1 block">Адрес / ориентир</span>
            <input
              value={getSpecValue(specs, "Адрес")}
              onChange={(e) => updateSpecByName(setSpecs, "Адрес", e.target.value)}
              placeholder="Улица, дом, ориентир"
              className="w-full h-11 rounded-lg border px-3"
            />
          </label>

          {form.subcategory === "Новостройки" && developments.length > 0 && (
            <label className="block">
              <span className="text-sm font-medium mb-1 block">Жилой комплекс</span>
              <select
                value={getSpecValue(specs, "ЖК")}
                onChange={(e) => updateSpecByName(setSpecs, "ЖК", e.target.value)}
                className="w-full h-11 rounded-lg border px-3"
              >
                <option value="">Выберите ЖК</option>
                {developments.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          )}

        </section>
      )}

      {step === 2 && (
        <section className="rounded-2xl border bg-white p-5 space-y-4">
          <h2 className="text-lg font-semibold">Характеристики</h2>

          <div className="grid md:grid-cols-2 gap-4">
            {detailFields.map((row) => (
              <label key={row.name} className="block">
                <span className="text-sm font-medium mb-1 block">{row.name}</span>
                {row.type === "select" ? (
                  <select
                    value={row.value || ""}
                    onChange={(e) =>
                      updateSpecByName(setSpecs, row.name, e.target.value)
                    }
                    className="w-full h-11 rounded-lg border px-3"
                  >
                    <option value="">Выберите</option>
                    {(row.options || []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={row.value || ""}
                    onChange={(e) =>
                      updateSpecByName(setSpecs, row.name, e.target.value)
                    }
                    placeholder={row.placeholder || ""}
                    className="w-full h-11 rounded-lg border px-3"
                  />
                )}
              </label>
            ))}
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="rounded-2xl border bg-white p-5 space-y-4">
          <h2 className="text-lg font-semibold">
            Фотографии ({photosCount}/{photoLimit})
          </h2>
          <p className="text-sm text-slate-500">
            Минимум 3 фото, максимум {photoLimit}. Первое фото станет обложкой
            объявления.
          </p>

          <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-8 cursor-pointer hover:bg-slate-50">
            <UploadCloud className="text-sun" size={32} />
            <span className="font-medium">Загрузить фото</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onInputFiles}
            />
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {existingImages.map((img, index) => (
              <div key={`ex-${index}`} className="relative rounded-xl overflow-hidden">
                <img src={img.url} alt="" className="w-full h-28 object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(index)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white grid place-items-center"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            {previews.map((src, index) => (
              <div key={`new-${index}`} className="relative rounded-xl overflow-hidden">
                <img src={src} alt="" className="w-full h-28 object-cover" />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white grid place-items-center"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="rounded-2xl border bg-white p-5 space-y-4">
          <h2 className="text-lg font-semibold">Цена и описание</h2>

          <label className="block">
            <span className="text-sm font-medium mb-1 block">Заголовок</span>
            <input
              value={form.title}
              onChange={(e) =>
                setField("title", e.target.value.slice(0, TITLE_MAX))
              }
              className="w-full h-11 rounded-lg border px-3"
            />
            <div className="text-xs text-slate-500 mt-1">
              {form.title.length}/{TITLE_MAX}
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium mb-1 block">Цена, с.</span>
            <input
              value={form.price}
              onChange={(e) =>
                setField("price", formatPriceInput(e.target.value))
              }
              inputMode="numeric"
              className="w-full h-11 rounded-lg border px-3"
            />
          </label>

          <PriceAdequacyBadge item={previewListing} />

          <label className="block">
            <span className="text-sm font-medium mb-1 block">Описание</span>
            <textarea
              value={form.description}
              onChange={(e) =>
                setField("description", e.target.value.slice(0, DESC_MAX))
              }
              rows={6}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Опишите планировку, состояние, инфраструктуру рядом..."
            />
            <div className="text-xs text-slate-500 mt-1">
              {form.description.length}/{DESC_MAX}
            </div>
          </label>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={step === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border disabled:opacity-40"
        >
          <ChevronLeft size={18} />
          Назад
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sun text-white font-semibold"
          >
            Далее
            <ChevronRight size={18} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sun text-white font-semibold disabled:opacity-60"
          >
            {saving
              ? isEdit
                ? "Сохранение..."
                : "Публикация..."
              : isEdit
                ? "Сохранить изменения"
                : "Опубликовать"}
          </button>
        )}
      </div>
    </form>
  );
}

export function isRealEstateWizardCategory(catKey) {
  return catKey === "realestate";
}

export { buildSuggestedTitle };
