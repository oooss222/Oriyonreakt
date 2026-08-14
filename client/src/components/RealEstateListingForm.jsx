import React from "react";
import {
  Building2,
  MapPin,
  ListChecks,
  Info,
  Sparkles,
} from "lucide-react";
import {
  DEAL_TYPES,
  ALL_RE_SUBCATEGORIES,
  REAL_ESTATE_CITIES,
  getDistrictsForCity,
} from "../data/realEstate";
import { formatPriceInput, getPriceDigits } from "../data/specOptions";
import { TITLE_MAX, DESC_MAX } from "../data/listingCategories";
import { getListingMinPhotos } from "../lib/listingPhotoLimits";
import { getSpecValue } from "../lib/realEstate";
import {
  areRealEstateCoreSpecsComplete,
  buildPublishHintParts,
  getRealEstateDetailFields,
} from "../lib/listingFormValidation";
import { buildRealEstateSuggestedTitle } from "../lib/listingFormTitles";
import PriceAdequacyBadge from "./PriceAdequacyBadge";
import ListingFormPhotosSection from "./listing/ListingFormPhotosSection";
import ListingFormPublicationSidebar from "./listing/ListingFormPublicationSidebar";
import RealEstateListingSpecFields from "./realestate/RealEstateListingSpecFields";
import { api } from "../lib/api";

function updateSpecByName(setSpecs, name, value) {
  setSpecs((rows) =>
    rows.map((row) => (row.name === name ? { ...row, value } : row))
  );
}

export default function RealEstateListingForm({
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
  clearNewFiles,
  photoLimit,
  onSubmit,
  saving,
  isEdit = false,
  onReset,
}) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [developments, setDevelopments] = React.useState([]);

  const districts = getDistrictsForCity(form.location);
  const photosCount = existingImages.length + previews.length;
  const minPhotos = getListingMinPhotos("realestate");
  const dealType = getSpecValue(specs, "Тип сделки");
  const isDaily = dealType === "Посуточно";
  const isRent = dealType === "Снять";

  const detailFields = getRealEstateDetailFields(specs, { isDaily, isRent });

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

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(event);
  };

  const handleSuggestTitle = () => {
    setField("title", buildRealEstateSuggestedTitle(form, specs));
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

  const hasDealType = Boolean(dealType);
  const hasSubcategory = Boolean(form.subcategory?.trim());
  const hasLocation = Boolean(form.location?.trim());
  const hasDistrict =
    districts.length === 0 || Boolean(getSpecValue(specs, "Район"));
  const coreSpecsComplete = areRealEstateCoreSpecsComplete(form, specs);
  const hasTitle = Boolean(form.title.trim());
  const hasPrice = Boolean(getPriceDigits(form.price));
  const hasPhotos = photosCount >= minPhotos;

  const canPublish =
    hasDealType &&
    hasSubcategory &&
    hasLocation &&
    hasDistrict &&
    coreSpecsComplete &&
    hasTitle &&
    hasPrice &&
    hasPhotos &&
    !saving;

  const publishHintParts = buildPublishHintParts({
    form,
    specs,
    photosCount,
    minPhotos,
    isRealEstate: true,
  });
  const publishHint = publishHintParts.length
    ? `Заполните: ${publishHintParts.join(", ")}`
    : "";

  const sidebarChecks = [
    {
      key: "type",
      label: "Тип объекта",
      ok: hasDealType && hasSubcategory,
      detail:
        hasDealType && hasSubcategory
          ? `${dealType}, ${form.subcategory}`
          : "не выбран",
    },
    {
      key: "location",
      label: "Адрес",
      ok: hasLocation && hasDistrict,
      detail:
        hasLocation && hasDistrict
          ? `${form.location}${getSpecValue(specs, "Район") ? `, ${getSpecValue(specs, "Район")}` : ""}`
          : "не указан",
    },
    {
      key: "params",
      label: "Параметры",
      ok: coreSpecsComplete,
      detail: coreSpecsComplete ? "заполнены" : "не заполнены",
    },
    {
      key: "photos",
      label: "Фото",
      ok: hasPhotos,
      detail: `${photosCount}/${photoLimit}`,
    },
    {
      key: "title",
      label: "Заголовок",
      ok: hasTitle,
      detail: hasTitle ? "указан" : "не указан",
    },
    {
      key: "price",
      label: "Цена",
      ok: hasPrice,
      detail: hasPrice ? `${formatPriceInput(form.price)} с.` : "не указана",
    },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem] gap-5"
    >
      <section className="space-y-5 min-w-0">
        <div className="listing-form-card">
          <div className="listing-form-card__head">
            <div className="listing-form-card__title">
              <Building2 className="w-5 h-5 text-sun" />
              Тип сделки и объекта
            </div>
          </div>

          <div className="listing-form-card__body space-y-4">
            <div>
              <label className="listing-form-label listing-form-label-required">
                Тип сделки
              </label>
              <div className="flex flex-wrap gap-2">
                {DEAL_TYPES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      updateSpecByName(setSpecs, "Тип сделки", item.value)
                    }
                    className={`listing-form-chip ${
                      dealType === item.value
                        ? "listing-form-chip--active"
                        : ""
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="listing-form-label listing-form-label-required">
                Тип недвижимости
              </label>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(ALL_RE_SUBCATEGORIES).map(([name, meta]) => (
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
                    <div className="text-xs text-slate-500 mt-1">
                      {meta.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="listing-form-card">
          <div className="listing-form-card__head">
            <div className="listing-form-card__title">
              <MapPin className="w-5 h-5 text-sun" />
              Адрес объекта
            </div>
          </div>

          <div className="listing-form-card__body space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="listing-form-label listing-form-label-required">
                  Город
                </label>
                <select
                  value={form.location}
                  onChange={(e) => {
                    setField("location", e.target.value);
                    updateSpecByName(setSpecs, "Район", "");
                    setGeo(null);
                  }}
                  className="listing-form-select"
                >
                  {REAL_ESTATE_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {districts.length > 0 ? (
                <div>
                  <label className="listing-form-label listing-form-label-required">
                    Район
                  </label>
                  <select
                    value={getSpecValue(specs, "Район")}
                    onChange={(e) =>
                      updateSpecByName(setSpecs, "Район", e.target.value)
                    }
                    className="listing-form-select"
                  >
                    <option value="">Выберите район</option>
                    {districts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>

            <div>
              <label className="listing-form-label">Адрес / ориентир</label>
              <input
                value={getSpecValue(specs, "Адрес")}
                onChange={(e) =>
                  updateSpecByName(setSpecs, "Адрес", e.target.value)
                }
                placeholder="Улица, дом, ориентир"
                className="listing-form-input"
              />
            </div>

            {form.subcategory === "Новостройки" && developments.length > 0 ? (
              <div>
                <label className="listing-form-label">Жилой комплекс</label>
                <select
                  value={getSpecValue(specs, "ЖК")}
                  onChange={(e) =>
                    updateSpecByName(setSpecs, "ЖК", e.target.value)
                  }
                  className="listing-form-select"
                >
                  <option value="">Выберите ЖК</option>
                  {developments.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
        </div>

        <div className="listing-form-card overflow-hidden">
          <div className="listing-form-card__head">
            <div className="listing-form-card__title">
              <ListChecks className="w-5 h-5 text-sun" />
              Параметры объекта
            </div>
          </div>

          <RealEstateListingSpecFields
            fields={detailFields}
            onUpdateByName={(name, value) =>
              updateSpecByName(setSpecs, name, value)
            }
          />
        </div>

        <ListingFormPhotosSection
          photosCount={photosCount}
          photoLimit={photoLimit}
          minPhotos={minPhotos}
          existingImages={existingImages}
          previews={previews}
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
          onRemoveExisting={removeExistingImage}
          onRemoveNew={removeFile}
          onClearNew={clearNewFiles}
        />

        <div className="listing-form-card">
          <div className="listing-form-card__head">
            <div className="listing-form-card__title">
              <Info className="w-5 h-5 text-sun" />
              Цена и описание
            </div>
          </div>

          <div className="listing-form-card__body space-y-4">
            <div>
              <div className="flex items-center justify-between gap-3 mb-1">
                <label className="listing-form-label listing-form-label-required">
                  Заголовок
                </label>
                <button
                  type="button"
                  onClick={handleSuggestTitle}
                  className="inline-flex items-center gap-1 text-xs font-medium text-sun hover:text-sun-700"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Сгенерировать
                </button>
              </div>
              <input
                value={form.title}
                onChange={(e) =>
                  setField("title", e.target.value.slice(0, TITLE_MAX))
                }
                placeholder="Например: Снять, 2-комн. квартира, Шохмансур"
                className="listing-form-input"
              />
              <div className="listing-form-meta">
                {form.title.length}/{TITLE_MAX}
              </div>
            </div>

            <div>
              <label className="listing-form-label listing-form-label-required">
                Цена
              </label>
              <div className="listing-form-price-wrap">
                <input
                  value={form.price}
                  onChange={(e) =>
                    setField("price", formatPriceInput(e.target.value))
                  }
                  onPaste={(e) => {
                    e.preventDefault();
                    setField(
                      "price",
                      formatPriceInput(e.clipboardData.getData("text"))
                    );
                  }}
                  placeholder="Например: 1 500 000"
                  inputMode="numeric"
                  autoComplete="off"
                />
                <span className="listing-form-price-suffix">с.</span>
              </div>
            </div>

            <PriceAdequacyBadge item={previewListing} />

            <div>
              <label className="listing-form-label">Описание</label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setField("description", e.target.value.slice(0, DESC_MAX))
                }
                placeholder="Опишите планировку, состояние, инфраструктуру рядом..."
                className="listing-form-textarea"
              />
              <div className="listing-form-meta">
                {form.description.length}/{DESC_MAX}
              </div>
            </div>
          </div>
        </div>
      </section>

      <ListingFormPublicationSidebar
        categoryTitle="Недвижимость"
        subcategory={form.subcategory}
        checks={sidebarChecks}
        canPublish={canPublish}
        publishHint={publishHint}
        saving={saving}
        isEdit={isEdit}
        onReset={onReset}
        footerNote={
          isEdit
            ? "После сохранения объявление снова уйдёт на модерацию."
            : "После проверки объявление будет доступно в общем списке."
        }
      />
    </form>
  );
}

export function isRealEstateWizardCategory(catKey) {
  return catKey === "realestate";
}

export { buildRealEstateSuggestedTitle as buildSuggestedTitle };
