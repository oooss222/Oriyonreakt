import React from "react";
import {
  Building2,
  MapPin,
  ListChecks,
  Info,
  PencilLine,
} from "lucide-react";
import {
  DEAL_TYPES,
  ALL_RE_SUBCATEGORIES,
  REAL_ESTATE_CITIES,
  getDistrictsForCity,
  getCityCoordinates,
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
import RealEstateMapPin from "./realestate/RealEstateMapPin";
import { api } from "../lib/api";
import { useI18n } from "../i18n";

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
  onMoveExisting,
  onMoveNew,
  onMakeCoverExisting,
  onMakeCoverNew,
  compressing = false,
  photoLimit,
  onSubmit,
  saving,
  isEdit = false,
  onReset,
  formId = "listing-form",
  requirePhone = false,
  hasPhone = true,
  previewItem = null,
}) {
  const { t } = useI18n();
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

  const pricePreviewListing = React.useMemo(
    () => ({
      price: form.price,
      location: form.location,
      specs,
      rePricePerSqm: null,
    }),
    [form.price, form.location, specs]
  );

  const cardPreview =
    previewItem ||
    {
      title: form.title,
      price: form.price,
      location: form.location,
      cat: "realestate",
      images: [
        ...existingImages,
        ...previews.map((url) => ({ url })),
      ],
      createdAt: new Date().toISOString(),
    };

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
    (!requirePhone || hasPhone) &&
    !saving;

  const publishHintParts = buildPublishHintParts({
    form,
    specs,
    photosCount,
    minPhotos,
    isRealEstate: true,
    t,
  });
  if (requirePhone && !hasPhone) {
    publishHintParts.unshift(t("listing.phoneHintShort"));
  }
  const publishHint = publishHintParts.length
    ? `${t("form.fillPrefix")} ${publishHintParts.join(", ")}`
    : "";

  const sidebarChecks = [
    {
      key: "type",
      label: t("form.objectType"),
      ok: hasDealType && hasSubcategory,
      detail:
        hasDealType && hasSubcategory
          ? `${dealType}, ${form.subcategory}`
          : t("form.notSelected"),
    },
    {
      key: "location",
      label: t("form.address"),
      ok: hasLocation && hasDistrict,
      detail:
        hasLocation && hasDistrict
          ? `${form.location}${getSpecValue(specs, "Район") ? `, ${getSpecValue(specs, "Район")}` : ""}`
          : t("form.notSpecified"),
    },
    {
      key: "params",
      label: t("form.parameters"),
      ok: coreSpecsComplete,
      detail: coreSpecsComplete ? t("form.filled") : t("form.notFilled"),
    },
    {
      key: "photos",
      label: t("form.photos"),
      ok: hasPhotos,
      detail: `${photosCount}/${photoLimit}`,
    },
    {
      key: "title",
      label: t("form.titleLabel"),
      ok: hasTitle,
      detail: hasTitle ? t("form.specified") : t("form.notSpecified"),
    },
    {
      key: "price",
      label: t("form.price"),
      ok: hasPrice,
      detail: hasPrice
        ? `${formatPriceInput(form.price)} ${t("price.currency")}`
        : t("form.priceEmpty"),
    },
  ];

  return (
    <form
      id={formId}
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
                    const city = e.target.value;
                    setField("location", city);
                    updateSpecByName(setSpecs, "Район", "");
                    const center = getCityCoordinates(city);
                    setGeo({ lat: center.lat, lng: center.lng });
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
                placeholder={t("form.streetPlaceholder")}
                className="listing-form-input"
              />
            </div>

            <RealEstateMapPin
              city={form.location}
              geo={geo}
              setGeo={setGeo}
            />

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
          compressing={compressing}
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
          onMoveExisting={onMoveExisting}
          onMoveNew={onMoveNew}
          onMakeCoverExisting={onMakeCoverExisting}
          onMakeCoverNew={onMakeCoverNew}
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
                  <PencilLine className="w-3.5 h-3.5" />
                  Сгенерировать
                </button>
              </div>
              <input
                value={form.title}
                onChange={(e) =>
                  setField("title", e.target.value.slice(0, TITLE_MAX))
                }
                placeholder={t("form.reTitlePlaceholder")}
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
                  placeholder={t("form.rePricePlaceholder")}
                  inputMode="numeric"
                  autoComplete="off"
                />
                <span className="listing-form-price-suffix">с.</span>
              </div>
            </div>

            <PriceAdequacyBadge item={pricePreviewListing} />

            <div>
              <label className="listing-form-label">Описание</label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setField("description", e.target.value.slice(0, DESC_MAX))
                }
                placeholder={t("form.reDescPlaceholder")}
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
        categoryTitle={t("categories.realestate")}
        subcategory={form.subcategory}
        checks={sidebarChecks}
        canPublish={canPublish}
        publishHint={publishHint}
        saving={saving}
        isEdit={isEdit}
        onReset={onReset}
        requirePhone={requirePhone}
        hasPhone={hasPhone}
        previewItem={cardPreview}
        moderationHint={!isEdit ? t("listing.moderationLikelyHint") : null}
        footerNote={
          isEdit ? t("listing.editModerationHint") : t("listing.publishHint")
        }
      />
    </form>
  );
}

export function isRealEstateWizardCategory(catKey) {
  return catKey === "realestate";
}

export { buildRealEstateSuggestedTitle as buildSuggestedTitle };
