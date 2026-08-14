import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { goToAuth } from "../lib/auth";
import {
  SPEC_DEPENDENCIES,
  LOCATIONS,
  PRICE_MAX_DIGITS,
  formatPriceInput,
  getPriceDigits,
} from "../data/specOptions";
import {
  CATS,
  TITLE_MAX,
  DESC_MAX,
  buildSpecTemplate,
  mergeSpecsWithExisting,
  compactSpecsForSubmit,
} from "../data/listingCategories";
import { getListingPhotoLimit, getListingMinPhotos } from "../lib/listingPhotoLimits";
import { REAL_ESTATE_CAT } from "../data/realEstate";
import RealEstateListingWizard, {
  isRealEstateWizardCategory,
} from "./RealEstateListingWizard";
import ListingFormSpecFields, {
  areListingSpecsComplete,
} from "./listing/ListingFormSpecFields";
import ListingFormPhotosSection from "./listing/ListingFormPhotosSection";
import ListingFormPublicationSidebar from "./listing/ListingFormPublicationSidebar";
import {
  validateListingForm,
  buildPublishHintParts,
} from "../lib/listingFormValidation";
import {
  clearListingDraft,
  formatDraftSavedAt,
  loadListingDraft,
  saveListingDraft,
} from "../lib/listingFormDraft";
import { buildTransportSuggestedTitle } from "../lib/listingFormTitles";
import {
  Info,
  Sparkles,
  ListChecks,
  MapPin,
  Pencil,
  FileText,
} from "lucide-react";

export default function ListingForm({
  mode = "create",
  listingId = null,
  initialData = null,
  initialCat = "",
  onSuccess,
  backTo = "/profile?tab=my",
}) {
  const nav = useNavigate();
  const token = localStorage.getItem("auth_token") || "";
  const isEdit = mode === "edit";

  const startCat =
    initialCat && CATS[initialCat] ? initialCat : "transport";

  const [form, setForm] = React.useState({
    title: "",
    price: "",
    location: startCat === REAL_ESTATE_CAT ? "Душанбе" : "Душанбе",
    cat: startCat,
    subcategory: CATS[startCat]?.subs?.[0] || "",
    description: "",
  });

  const [specs, setSpecs] = React.useState(() =>
    buildSpecTemplate(startCat, CATS[startCat]?.subs?.[0] || "")
  );
  const [existingImages, setExistingImages] = React.useState([]);
  const [files, setFiles] = React.useState([]);
  const [previews, setPreviews] = React.useState([]);
  const [err, setErr] = React.useState("");
  const [loading, setLoading] = React.useState(isEdit);
  const [saving, setSaving] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [geo, setGeo] = React.useState(null);
  const [draftPrompt, setDraftPrompt] = React.useState(null);
  const draftSaveTimerRef = React.useRef(null);

  const applyCategorySpecs = React.useCallback(
    (catKey, subcategory, existingSpecs = []) => {
      const template = buildSpecTemplate(catKey, subcategory);
      setSpecs(mergeSpecsWithExisting(template, existingSpecs));
    },
    []
  );

  React.useEffect(() => {
    if (isEdit || !initialCat || !CATS[initialCat]) return;

    setForm((state) => ({
      ...state,
      cat: initialCat,
      subcategory: CATS[initialCat]?.subs?.[0] || "",
      location: initialCat === REAL_ESTATE_CAT ? "Душанбе" : state.location,
    }));
    applyCategorySpecs(initialCat, CATS[initialCat]?.subs?.[0] || "");
  }, [initialCat, isEdit, applyCategorySpecs]);

  React.useEffect(() => {
    if (!isEdit || !initialData) return;

    const cat = initialData.cat || "transport";
    const catConfig = CATS[cat];
    const subcategory =
      initialData.subcategory || catConfig?.subs?.[0] || "";

    setForm({
      title: initialData.title || "",
      price: initialData.price
        ? formatPriceInput(getPriceDigits(String(initialData.price)))
        : "",
      location: initialData.location || initialData.city || LOCATIONS[0],
      cat,
      subcategory,
      description: initialData.description || "",
    });

    const images = Array.isArray(initialData.images) ? initialData.images : [];
    setExistingImages(
      images.map((img) => ({
        url: img.url || img,
        alt: img.alt || initialData.title || "",
      }))
    );

    applyCategorySpecs(
      cat,
      subcategory,
      Array.isArray(initialData.specs) ? initialData.specs : []
    );

    if (initialData.reLat != null && initialData.reLng != null) {
      setGeo({ lat: initialData.reLat, lng: initialData.reLng });
    }

    setLoading(false);
  }, [isEdit, initialData, applyCategorySpecs]);

  React.useEffect(() => {
    if (isEdit) return;

    const draft = loadListingDraft();
    if (draft) {
      setDraftPrompt(draft);
    }
  }, [isEdit]);

  React.useEffect(() => {
    if (isEdit || draftPrompt) return;
    applyCategorySpecs(form.cat, form.subcategory);
  }, [isEdit, draftPrompt, applyCategorySpecs]);

  React.useEffect(() => {
    if (isEdit || draftPrompt) return;

    if (draftSaveTimerRef.current) {
      clearTimeout(draftSaveTimerRef.current);
    }

    draftSaveTimerRef.current = setTimeout(() => {
      saveListingDraft({
        form,
        specs,
        geo,
        existingImages: existingImages.map((img) => ({
          url: img.url,
          alt: img.alt || "",
        })),
      });
    }, 12000);

    return () => {
      if (draftSaveTimerRef.current) {
        clearTimeout(draftSaveTimerRef.current);
      }
    };
  }, [form, specs, geo, existingImages, isEdit, draftPrompt]);

  React.useEffect(() => {
    if (!files.length) {
      setPreviews([]);
      return;
    }

    let alive = true;

    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          })
      )
    ).then((arr) => {
      if (alive) setPreviews(arr);
    });

    return () => {
      alive = false;
    };
  }, [files]);

  const setField = (key, value) => {
    setForm((state) => ({
      ...state,
      [key]: value,
    }));
  };

  const priceDigits = getPriceDigits(form.price);

  const handlePriceChange = (rawValue) => {
    setField("price", formatPriceInput(rawValue));
  };

  const handleCatChange = (catKey) => {
    const firstSub = CATS[catKey]?.subs?.[0] || "";
    const currentValues = compactSpecsForSubmit(specs);
    const photoLimit = getListingPhotoLimit(catKey);
    const trimmedExistingCount = Math.min(existingImages.length, photoLimit);

    setForm((state) => ({
      ...state,
      cat: catKey,
      subcategory: firstSub,
    }));

    setExistingImages((current) => current.slice(0, photoLimit));
    setFiles((current) =>
      current.slice(0, Math.max(0, photoLimit - trimmedExistingCount))
    );

    applyCategorySpecs(catKey, firstSub, currentValues);
  };

  const handleSubcategoryChange = (subcategory) => {
    const currentValues = compactSpecsForSubmit(specs);

    setForm((state) => ({
      ...state,
      subcategory,
    }));

    applyCategorySpecs(form.cat, subcategory, currentValues);
  };

  const onFiles = (list) => {
    const photoLimit = getListingPhotoLimit(form.cat);
    const arr = Array.from(list || []).filter((file) =>
      file.type.startsWith("image/")
    );

    const total = existingImages.length + files.length + arr.length;

    if (total > photoLimit) {
      setErr(`Максимум ${photoLimit} фотографий для этой категории`);
      return;
    }

    setErr("");
    setFiles((current) =>
      [...current, ...arr].slice(0, photoLimit - existingImages.length)
    );
  };

  const onInputFiles = (event) => {
    onFiles(event.target.files);
    event.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((arr) => arr.filter((_, i) => i !== index));
    setPreviews((arr) => arr.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages((arr) => arr.filter((_, i) => i !== index));
  };

  const clearNewFiles = () => {
    setFiles([]);
    setPreviews([]);
  };

  const removeSpecRow = (index) => {
    const row = specs[index];
    if (row?.locked) return;

    setSpecs((state) => state.filter((_, i) => i !== index));
  };

  const updateSpec = (index, key, value) => {
    setSpecs((state) => {
      let next = state.map((row, i) =>
        i === index ? { ...row, [key]: value } : row
      );

      if (key === "value") {
        const changedName = next[index]?.name;
        const dependentNames = SPEC_DEPENDENCIES[changedName] || [];

        if (dependentNames.length > 0) {
          next = next.map((row) =>
            dependentNames.includes(row.name) ? { ...row, value: "" } : row
          );
        }
      }

      return next;
    });
  };

  const restoreDraft = () => {
    if (!draftPrompt) return;

    const draftCat =
      draftPrompt.form?.cat && CATS[draftPrompt.form.cat]
        ? draftPrompt.form.cat
        : startCat;

    setForm({
      title: draftPrompt.form?.title || "",
      price: draftPrompt.form?.price || "",
      location: draftPrompt.form?.location || "Душанбе",
      cat: draftCat,
      subcategory:
        draftPrompt.form?.subcategory || CATS[draftCat]?.subs?.[0] || "",
      description: draftPrompt.form?.description || "",
    });

    applyCategorySpecs(
      draftCat,
      draftPrompt.form?.subcategory || CATS[draftCat]?.subs?.[0] || "",
      Array.isArray(draftPrompt.specs) ? draftPrompt.specs : []
    );

    setExistingImages(
      Array.isArray(draftPrompt.existingImages)
        ? draftPrompt.existingImages
        : []
    );
    setGeo(draftPrompt.geo || null);
    setDraftPrompt(null);
  };

  const discardDraft = () => {
    clearListingDraft();
    setDraftPrompt(null);
  };

  const resetForm = () => {
    if (isEdit && initialData) {
      const cat = initialData.cat || "transport";
      const catConfig = CATS[cat];
      const subcategory =
        initialData.subcategory || catConfig?.subs?.[0] || "";

      setForm({
        title: initialData.title || "",
        price: initialData.price
          ? formatPriceInput(getPriceDigits(String(initialData.price)))
          : "",
        location: initialData.location || initialData.city || LOCATIONS[0],
        cat,
        subcategory,
        description: initialData.description || "",
      });

      const images = Array.isArray(initialData.images) ? initialData.images : [];
      setExistingImages(
        images.map((img) => ({
          url: img.url || img,
          alt: img.alt || initialData.title || "",
        }))
      );

      applyCategorySpecs(
        cat,
        subcategory,
        Array.isArray(initialData.specs) ? initialData.specs : []
      );
    } else {
      setForm({
        title: "",
        price: "",
        location: "Душанбе",
        cat: "transport",
        subcategory: CATS.transport.subs[0],
        description: "",
      });
      applyCategorySpecs("transport", CATS.transport.subs[0]);
      setExistingImages([]);
    }

    setFiles([]);
    setPreviews([]);
    setErr("");

    if (!isEdit) {
      clearListingDraft();
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setErr("");

    if (!token) {
      goToAuth(nav, `${window.location.pathname}${window.location.search}`);
      return;
    }

    const validationError = validateListingForm({
      form,
      specs,
      existingImages,
      files,
      isRealEstate: isRealEstateWizardCategory(form.cat),
    });

    if (validationError) {
      setErr(validationError);
      return;
    }

    const compactSpecs = compactSpecsForSubmit(specs);

    try {
      setSaving(true);

      let uploadedImages = [];

      if (files.length) {
        const formData = new FormData();
        files.forEach((file) => formData.append("images", file));
        const uploaded = await api.uploadImages(token, formData);
        uploadedImages = (uploaded?.urls || []).map((url) => ({
          url,
          alt: form.title.trim(),
        }));
      }

      const allImages = [
        ...existingImages.map((img) => ({
          url: img.url,
          alt: img.alt || form.title.trim(),
        })),
        ...uploadedImages,
      ];

      const payload = {
        title: form.title.trim(),
        price: getPriceDigits(form.price)
          ? formatPriceInput(form.price)
          : "",
        location: LOCATIONS.includes(form.location)
          ? form.location
          : form.location || LOCATIONS[0],
        cat: form.cat.trim(),
        subcategory: form.subcategory.trim(),
        description: form.description || "",
        specs: compactSpecs,
        images: allImages,
        lat: geo?.lat,
        lng: geo?.lng,
      };

      const result = isEdit
        ? await api.updateListing(token, listingId, payload)
        : await api.createListing(token, payload);

      if (!isEdit) {
        clearListingDraft();
      }

      onSuccess?.(result);
    } catch (error) {
      setErr(error.message || (isEdit ? "Ошибка сохранения" : "Ошибка создания"));
    } finally {
      setSaving(false);
    }
  };

  const cat = CATS[form.cat];
  const subs = cat?.subs || [];
  const photosCount = existingImages.length + previews.length;
  const photoLimit = getListingPhotoLimit(form.cat);
  const minPhotos = getListingMinPhotos(form.cat);
  const useRealEstateWizard = isRealEstateWizardCategory(form.cat);
  const specsComplete = areListingSpecsComplete(specs);
  const hasTitle = Boolean(form.title.trim());
  const hasPrice = Boolean(priceDigits.length);
  const hasPhotos = photosCount >= minPhotos;
  const canPublish =
    hasTitle &&
    hasPrice &&
    hasPhotos &&
    (useRealEstateWizard || specsComplete) &&
    !saving;

  const publishHintParts = buildPublishHintParts({
    form,
    specs,
    photosCount,
    minPhotos,
    isRealEstate: useRealEstateWizard,
  });
  const publishHint = publishHintParts.length
    ? `Заполните: ${publishHintParts.join(", ")}`
    : "";

  const suggestTransportTitle = () => {
    setField("title", buildTransportSuggestedTitle(specs));
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        <div className="rounded-2xl border bg-white p-6 text-center">
          Загрузка...
        </div>
      </div>
    );
  }

  return (
    <div className="listing-form-page bg-slate-50/70 min-h-[calc(100vh-4rem)]">
      <div className="listing-form-header">
        <div className="listing-form-badge">
          {isEdit ? (
            <>
              <Pencil className="w-4 h-4" />
              Редактирование
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Новое объявление
            </>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {isEdit ? "Редактировать объявление" : "Создать объявление"}
        </h1>

        <p className="text-slate-600 text-sm md:text-base">
          {isEdit
            ? "После сохранения объявление снова отправится на модерацию."
            : "Заполните данные, загрузите фото и опубликуйте объявление."}
        </p>

        <Link
          to={backTo}
          className="inline-flex text-sm text-slate-500 hover:text-slate-800 transition"
        >
          ← Назад
        </Link>
      </div>

      {draftPrompt ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-amber-900">
                Продолжить черновик?
              </div>
              <div className="text-sm text-amber-800 mt-1">
                Сохранён{" "}
                {formatDraftSavedAt(draftPrompt.savedAt) || "недавно"}. Новые
                фото из черновика не восстанавливаются.
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={restoreDraft}
              className="rounded-xl bg-sun text-white px-4 py-2 text-sm font-semibold hover:opacity-90"
            >
              Продолжить
            </button>
            <button
              type="button"
              onClick={discardDraft}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Начать заново
            </button>
          </div>
        </div>
      ) : null}

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4">
          {err}
        </div>
      )}

      {useRealEstateWizard ? (
        <RealEstateListingWizard
          form={form}
          setForm={setForm}
          specs={specs}
          setSpecs={setSpecs}
          geo={geo}
          setGeo={setGeo}
          files={files}
          previews={previews}
          existingImages={existingImages}
          onFiles={onFiles}
          onInputFiles={onInputFiles}
          removeFile={removeFile}
          removeExistingImage={removeExistingImage}
          clearNewFiles={clearNewFiles}
          photoLimit={photoLimit}
          onSubmit={submit}
          saving={saving}
          isEdit={isEdit}
          onReset={resetForm}
        />
      ) : (
      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem] gap-5">
        <section className="space-y-5 min-w-0">
          <div className="listing-form-card">
            <div className="listing-form-card__head">
              <div className="listing-form-card__title">
                <Info className="w-5 h-5 text-sun" />
                Основная информация
              </div>
            </div>

            <div className="listing-form-card__body">
              <div>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <label className="listing-form-label listing-form-label-required">
                    Заголовок
                  </label>
                  {form.cat === "transport" ? (
                    <button
                      type="button"
                      onClick={suggestTransportTitle}
                      className="inline-flex items-center gap-1 text-xs font-medium text-sun hover:text-sun-700"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Сгенерировать
                    </button>
                  ) : null}
                </div>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setField("title", e.target.value.slice(0, TITLE_MAX))
                  }
                  placeholder="Например: Toyota Camry 2018"
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
                    onChange={(e) => handlePriceChange(e.target.value)}
                    onPaste={(e) => {
                      e.preventDefault();
                      handlePriceChange(e.clipboardData.getData("text"));
                    }}
                    placeholder="Например: 120 000"
                    inputMode="numeric"
                    autoComplete="off"
                  />
                  <span className="listing-form-price-suffix">с.</span>
                </div>
                <div className="listing-form-meta">
                  {priceDigits.length}/{PRICE_MAX_DIGITS} цифр
                </div>
              </div>

              <div>
                <label className="listing-form-label">Локация</label>
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

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="listing-form-label">Категория</label>
                  <select
                    value={form.cat}
                    onChange={(e) => handleCatChange(e.target.value)}
                    className="listing-form-select"
                  >
                    {Object.entries(CATS).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="listing-form-label">Подкатегория</label>
                  <select
                    value={form.subcategory}
                    onChange={(e) => handleSubcategoryChange(e.target.value)}
                    className="listing-form-select"
                  >
                    {subs.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="listing-form-label">Описание</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setField("description", e.target.value.slice(0, DESC_MAX))
                  }
                  placeholder="Опишите товар, состояние, комплектацию и условия сделки"
                  className="listing-form-textarea"
                />
                <div className="listing-form-meta">
                  {form.description.length}/{DESC_MAX}
                </div>
              </div>
            </div>
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

          <div className="listing-form-card overflow-hidden">
            <div className="listing-form-card__head">
              <div className="listing-form-card__title">
                <ListChecks className="w-5 h-5 text-sun" />
                Характеристики
              </div>
            </div>

            <ListingFormSpecFields
              specs={specs}
              onUpdate={updateSpec}
              onRemove={removeSpecRow}
            />
          </div>
        </section>

        <ListingFormPublicationSidebar
          categoryTitle={cat?.title}
          subcategory={form.subcategory}
          checks={[
            {
              key: "photos",
              label: "Фото",
              ok: hasPhotos,
              detail: `${photosCount}/${photoLimit}`,
            },
            {
              key: "specs",
              label: "Характеристики",
              ok: specsComplete,
              detail: specsComplete ? "заполнены" : "не заполнены",
            },
            {
              key: "price",
              label: "Цена",
              ok: hasPrice,
              detail: hasPrice
                ? `${formatPriceInput(form.price)} с.`
                : "не указана",
            },
          ]}
          canPublish={canPublish}
          publishHint={publishHint}
          saving={saving}
          isEdit={isEdit}
          onReset={resetForm}
          footerNote={
            isEdit
              ? "После сохранения объявление снова уйдёт на модерацию."
              : "После проверки объявление будет доступно в общем списке."
          }
        />
      </form>
      )}
    </div>
  );
}
