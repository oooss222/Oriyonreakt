import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { goToAuth } from "../lib/auth";
import { resolveMediaUrl } from "../lib/media";
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
import { getListingPhotoLimit } from "../lib/listingPhotoLimits";
import { REAL_ESTATE_CAT } from "../data/realEstate";
import RealEstateListingWizard, {
  isRealEstateWizardCategory,
} from "./RealEstateListingWizard";
import ListingFormSpecFields, {
  areListingSpecsComplete,
} from "./listing/ListingFormSpecFields";
import {
  Plus,
  X,
  UploadCloud,
  Info,
  Sparkles,
  Image as ImageIcon,
  ListChecks,
  Tag,
  MapPin,
  CheckCircle2,
  RotateCcw,
  Pencil,
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
    applyCategorySpecs(form.cat, form.subcategory);
  }, [isEdit, applyCategorySpecs]);

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
  };

  const submit = async (event) => {
    event.preventDefault();
    setErr("");

    if (!token) {
      goToAuth(nav, `${window.location.pathname}${window.location.search}`);
      return;
    }

    if (!form.title.trim() || !form.cat.trim() || !form.subcategory.trim()) {
      setErr("Заполните заголовок, категорию и подкатегорию");
      return;
    }

    if (form.title.trim().length > TITLE_MAX) {
      setErr(`Заголовок не должен быть длиннее ${TITLE_MAX} символов`);
      return;
    }

    if (getPriceDigits(form.price).length > PRICE_MAX_DIGITS) {
      setErr(`Цена не может быть длиннее ${PRICE_MAX_DIGITS} цифр`);
      return;
    }

    if (form.description.length > DESC_MAX) {
      setErr(`Описание не должно быть длиннее ${DESC_MAX} символов`);
      return;
    }

    if (!form.location.trim()) {
      setErr("Выберите локацию");
      return;
    }

    const photoLimit = getListingPhotoLimit(form.cat);
    const totalPhotos = existingImages.length + files.length;

    if (totalPhotos > photoLimit) {
      setErr(`Максимум ${photoLimit} фотографий для этой категории`);
      return;
    }

    if (totalPhotos < 1) {
      setErr("Добавьте минимум 1 фото");
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
  const useRealEstateWizard = isRealEstateWizardCategory(form.cat);
  const specsComplete = areListingSpecsComplete(specs);
  const hasTitle = Boolean(form.title.trim());
  const hasPrice = Boolean(priceDigits.length);
  const hasPhotos = photosCount >= 1;
  const canPublish = hasTitle && hasPrice && hasPhotos && specsComplete && !saving;

  const publishHintParts = [];
  if (!hasTitle) publishHintParts.push("заголовок");
  if (!hasPrice) publishHintParts.push("цену");
  if (!hasPhotos) publishHintParts.push("минимум 1 фото");
  if (!specsComplete) publishHintParts.push("характеристики");
  const publishHint = publishHintParts.length
    ? `Заполните: ${publishHintParts.join(", ")}`
    : "";

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
          photoLimit={photoLimit}
          onSubmit={submit}
          saving={saving}
          isEdit={isEdit}
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
                <label className="listing-form-label listing-form-label-required">
                  Заголовок
                </label>
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
              <div
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
                  До {photoLimit} изображений для этой категории. JPG, PNG, WEBP.
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
                        onClick={clearNewFiles}
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
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
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
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
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

        <aside>
          <div className="listing-form-sidebar">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-sun" />
              <h2 className="text-lg font-semibold">Публикация</h2>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Категория</span>
                <span className="font-semibold text-slate-900 text-right">
                  {cat?.title || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Подкатегория</span>
                <span className="font-semibold text-slate-900 text-right">
                  {form.subcategory || "—"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div
                className={`listing-form-check ${
                  hasPhotos ? "listing-form-check--ok" : "listing-form-check--warn"
                }`}
              >
                <span>Фото</span>
                <span className="font-medium">
                  {hasPhotos ? `${photosCount}/${photoLimit}` : `${photosCount}/${photoLimit}`}
                </span>
              </div>

              <div
                className={`listing-form-check ${
                  specsComplete ? "listing-form-check--ok" : "listing-form-check--warn"
                }`}
              >
                <span>Характеристики</span>
                <span className="font-medium">
                  {specsComplete ? "заполнены" : "не заполнены"}
                </span>
              </div>

              <div
                className={`listing-form-check ${
                  hasPrice ? "listing-form-check--ok" : "listing-form-check--warn"
                }`}
              >
                <span>Цена</span>
                <span className="font-medium">
                  {hasPrice ? formatPriceInput(form.price) + " с." : "не указана"}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!canPublish}
              className={`listing-form-publish-btn ${
                canPublish
                  ? "listing-form-publish-btn--ready"
                  : "listing-form-publish-btn--disabled"
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              {saving
                ? isEdit
                  ? "Сохранение..."
                  : "Публикация..."
                : isEdit
                ? "Сохранить изменения"
                : "Опубликовать"}
            </button>

            {!canPublish && publishHint ? (
              <p className="text-xs text-red-600">{publishHint}</p>
            ) : null}

            <button
              type="button"
              onClick={resetForm}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Сбросить
            </button>

            <p className="text-xs text-slate-500 leading-relaxed">
              {isEdit
                ? "После сохранения объявление снова уйдёт на модерацию."
                : "После проверки объявление будет доступно в общем списке."}
            </p>
          </div>
        </aside>
      </form>
      )}
    </div>
  );
}
