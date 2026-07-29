import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { goToAuth } from "../lib/auth";
import { resolveMediaUrl } from "../lib/media";
import {
  getDependentOptions,
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
import { REAL_ESTATE_CAT } from "../data/realEstate";
import RealEstateListingWizard, {
  isRealEstateWizardCategory,
} from "./RealEstateListingWizard";
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

    setForm((state) => ({
      ...state,
      cat: catKey,
      subcategory: firstSub,
    }));

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
    const arr = Array.from(list || []).filter((file) =>
      file.type.startsWith("image/")
    );

    const total = existingImages.length + files.length + arr.length;

    if (total > 10) {
      setErr("Максимум 10 фотографий");
      return;
    }

    setErr("");
    setFiles((current) => [...current, ...arr].slice(0, 10 - existingImages.length));
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

  const addSpecRow = () => {
    setSpecs((state) => [
      ...state,
      { name: "", value: "", type: "text", locked: false },
    ]);
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
      goToAuth(nav);
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
  const filledSpecs = compactSpecsForSubmit(specs).length;
  const useRealEstateWizard =
    isRealEstateWizardCategory(form.cat) && !isEdit;

  const locationOptions = React.useMemo(() => {
    if (form.location && !LOCATIONS.includes(form.location)) {
      return [form.location, ...LOCATIONS];
    }
    return LOCATIONS;
  }, [form.location]);

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
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6 text-slate-900">
      <div className="rounded-2xl border bg-white p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-sun-700 bg-sun-50 border border-sun-100 rounded-full px-3 py-1 mb-2">
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

            <h1 className="text-2xl font-bold">
              {isEdit ? "Редактировать объявление" : "Создать объявление"}
            </h1>

            <p className="text-slate-600 text-sm mt-1">
              {isEdit
                ? "После сохранения объявление снова отправится на модерацию."
                : "Заполните данные, загрузите фото и опубликуйте объявление."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={backTo}
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 hover:bg-slate-50"
            >
              Назад
            </Link>

            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 hover:bg-slate-50"
            >
              <RotateCcw className="w-4 h-4" />
              Сбросить
            </button>
          </div>
        </div>
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
          onSubmit={submit}
          saving={saving}
        />
      ) : (
      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border bg-white p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-sun" />
              <h2 className="text-lg font-semibold">Основная информация</h2>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Заголовок</label>
              <input
                value={form.title}
                onChange={(e) =>
                  setField("title", e.target.value.slice(0, TITLE_MAX))
                }
                placeholder="Например: Toyota Camry 2018"
                className="w-full h-11 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-sun/40"
              />
              <div className="mt-1 text-xs text-slate-500">
                {form.title.length}/{TITLE_MAX}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Цена</label>
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
                  className="w-full h-11 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-sun/40"
                />
                <div className="mt-1 text-xs text-slate-500">
                  {priceDigits.length}/{PRICE_MAX_DIGITS} цифр
                  {priceDigits.length >= PRICE_MAX_DIGITS && (
                    <span className="text-amber-600"> — максимум</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Локация</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <select
                    value={
                      locationOptions.includes(form.location)
                        ? form.location
                        : locationOptions[0]
                    }
                    onChange={(e) => setField("location", e.target.value)}
                    className="w-full h-11 rounded-lg border pl-9 pr-8 outline-none focus:ring-2 focus:ring-sun/40 bg-white cursor-pointer"
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

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Категория</label>
                <select
                  value={form.cat}
                  onChange={(e) => handleCatChange(e.target.value)}
                  className="w-full h-11 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-sun/40"
                >
                  {Object.entries(CATS).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Подкатегория</label>
                <select
                  value={form.subcategory}
                  onChange={(e) => handleSubcategoryChange(e.target.value)}
                  className="w-full h-11 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-sun/40"
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
              <label className="block text-sm font-medium mb-1">Описание</label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setField("description", e.target.value.slice(0, DESC_MAX))
                }
                rows={7}
                placeholder="Опишите товар, состояние, комплектацию и условия сделки"
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-sun/40 resize-y"
              />
              <div className="mt-1 text-xs text-slate-500">
                {form.description.length}/{DESC_MAX}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-sun" />
              <h2 className="text-lg font-semibold">Фотографии</h2>
            </div>

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
              className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
                isDragOver
                  ? "border-sun bg-sun-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <UploadCloud className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <div className="font-medium">
                Перетащите фото сюда или выберите файлы
              </div>
              <div className="text-sm text-slate-500 mt-1">
                До 10 изображений. JPG, PNG, WEBP.
              </div>
              <label className="inline-flex items-center justify-center gap-2 mt-4 rounded-xl border bg-white px-4 py-2 hover:bg-slate-50 cursor-pointer">
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

            {photosCount > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    Выбрано: {photosCount}
                  </div>
                  {previews.length > 0 && (
                    <button
                      type="button"
                      onClick={clearNewFiles}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Очистить новые
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {existingImages.map((img, index) => (
                    <div key={`existing-${index}`} className="relative group">
                      <img
                        src={resolveMediaUrl(img.url, { allowEmpty: true, placeholder: "" })}
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
            )}
          </div>

          <div className="rounded-2xl border bg-white p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-sun" />
                <h2 className="text-lg font-semibold">Характеристики</h2>
              </div>
              <button
                type="button"
                onClick={addSpecRow}
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 hover:bg-slate-50"
              >
                <Plus className="w-4 h-4" />
                Добавить
              </button>
            </div>

            <div className="space-y-3">
              {specs.map((spec, index) => {
                const selectOptions = getDependentOptions(spec, specs);
                const needsParent = Boolean(spec.dependsOn);
                const parentSelected = needsParent
                  ? specs.some(
                      (row) => row.name === spec.dependsOn && row.value
                    )
                  : true;

                return (
                  <div
                    key={`${spec.name}-${index}`}
                    className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center"
                  >
                    {spec.locked ? (
                      <div className="h-10 flex items-center px-3 text-sm font-medium text-slate-700 bg-slate-50 rounded-lg border">
                        {spec.name}
                      </div>
                    ) : (
                      <input
                        value={spec.name}
                        onChange={(e) =>
                          updateSpec(index, "name", e.target.value)
                        }
                        placeholder="Название"
                        className="h-10 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-sun/40"
                      />
                    )}

                    {spec.type === "select" ? (
                      <select
                        value={spec.value}
                        onChange={(e) =>
                          updateSpec(index, "value", e.target.value)
                        }
                        disabled={needsParent && !parentSelected}
                        className="h-10 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-sun/40 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="">
                          {needsParent && !parentSelected
                            ? `Сначала выберите ${spec.dependsOn.toLowerCase()}`
                            : "Выберите"}
                        </option>
                        {selectOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={spec.value}
                        onChange={(e) =>
                          updateSpec(index, "value", e.target.value)
                        }
                        placeholder="Значение"
                        className="h-10 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-sun/40"
                      />
                    )}

                    {!spec.locked ? (
                      <button
                        type="button"
                        onClick={() => removeSpecRow(index)}
                        className="h-10 w-10 inline-flex items-center justify-center rounded-lg border text-red-600 hover:bg-red-50"
                        title="Удалить характеристику"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="h-10 w-10" />
                    )}
                  </div>
                );
              })}

              {specs.length === 0 && (
                <div className="text-sm text-slate-500">
                  Характеристики не добавлены.
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border bg-white p-5 space-y-4 sticky top-4">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-sun" />
              <h2 className="text-lg font-semibold">Публикация</h2>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span>Категория</span>
                <span className="font-medium text-slate-900">
                  {cat?.title || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Подкатегория</span>
                <span className="font-medium text-slate-900 text-right">
                  {form.subcategory || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Фото</span>
                <span className="font-medium text-slate-900">{photosCount}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Характеристики</span>
                <span className="font-medium text-slate-900">{filledSpecs}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-white transition ${
                saving
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-sun hover:bg-sun-600"
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

            <div className="text-xs text-slate-500">
              {isEdit
                ? "После сохранения объявление снова уйдёт на модерацию."
                : "После публикации объявление будет доступно в общем списке."}
            </div>
          </div>
        </aside>
      </form>
      )}
    </div>
  );
}
