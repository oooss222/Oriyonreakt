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
  buildSpecTemplate,
  mergeSpecsWithExisting,
  compactSpecsForSubmit,
} from "../data/listingCategories";
import { getListingPhotoLimit } from "../lib/listingPhotoLimits";
import { REAL_ESTATE_CAT } from "../data/realEstate";
import RealEstateListingWizard, {
  isRealEstateWizardCategory,
} from "./RealEstateListingWizard";
import GeneralListingWizard from "./listing-form/GeneralListingWizard";
import {
  saveListingDraft,
  loadListingDraft,
  clearListingDraft,
  hasFreshDraft,
} from "../lib/listingDraft";
import {
  Sparkles,
  Pencil,
  RotateCcw,
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
  const [priceNegotiable, setPriceNegotiable] = React.useState(false);

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
    if (isEdit) return;

    if (!hasFreshDraft()) return;

    const draft = loadListingDraft();
    if (!draft?.form) return;

    const shouldRestore = window.confirm("Продолжить заполнение сохранённого черновика?");
    if (!shouldRestore) {
      clearListingDraft();
      return;
    }

    setForm((state) => ({ ...state, ...draft.form }));
    if (Array.isArray(draft.specs)) {
      setSpecs(draft.specs);
    }
    if (typeof draft.priceNegotiable === "boolean") {
      setPriceNegotiable(draft.priceNegotiable);
    }
  }, [isEdit]);

  React.useEffect(() => {
    if (isEdit) return;

    const timer = window.setTimeout(() => {
      saveListingDraft({
        form,
        specs,
        priceNegotiable,
      });
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [form, specs, priceNegotiable, isEdit]);

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
    setPriceNegotiable(!getPriceDigits(String(initialData.price || "")));

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

  const movePhoto = (combinedIndex, direction) => {
    const existingCount = existingImages.length;
    const total = existingCount + previews.length;
    const newIndex = combinedIndex + direction;

    if (newIndex < 0 || newIndex >= total) return;

    const order = [
      ...existingImages.map((_, index) => ({ type: "existing", index })),
      ...previews.map((_, index) => ({ type: "new", index })),
    ];

    [order[combinedIndex], order[newIndex]] = [order[newIndex], order[combinedIndex]];

    const nextExisting = [];
    const nextFiles = [];
    const nextPreviews = [];

    order.forEach((item) => {
      if (item.type === "existing") {
        nextExisting.push(existingImages[item.index]);
      } else {
        nextFiles.push(files[item.index]);
        nextPreviews.push(previews[item.index]);
      }
    });

    setExistingImages(nextExisting);
    setFiles(nextFiles);
    setPreviews(nextPreviews);
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
      setPriceNegotiable(false);
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

    if (!priceNegotiable && !getPriceDigits(form.price)) {
      setErr("Укажите цену или отметьте «Договорная»");
      return;
    }

    if (!priceNegotiable && getPriceDigits(form.price).length > PRICE_MAX_DIGITS) {
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
        price: priceNegotiable
          ? ""
          : getPriceDigits(form.price)
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

  const photoLimit = getListingPhotoLimit(form.cat);
  const useRealEstateWizard = isRealEstateWizardCategory(form.cat);

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
          photoLimit={photoLimit}
          onSubmit={submit}
          saving={saving}
          isEdit={isEdit}
        />
      ) : (
        <GeneralListingWizard
          form={form}
          setForm={setForm}
          specs={specs}
          setSpecs={setSpecs}
          existingImages={existingImages}
          previews={previews}
          files={files}
          photoLimit={photoLimit}
          priceNegotiable={priceNegotiable}
          setPriceNegotiable={setPriceNegotiable}
          isDragOver={isDragOver}
          setIsDragOver={setIsDragOver}
          onFiles={onFiles}
          onInputFiles={onInputFiles}
          onRemoveExisting={removeExistingImage}
          onRemoveFile={removeFile}
          onMovePhoto={movePhoto}
          onClearNew={clearNewFiles}
          handleCatChange={handleCatChange}
          handleSubcategoryChange={handleSubcategoryChange}
          handlePriceChange={handlePriceChange}
          updateSpec={updateSpec}
          addSpecRow={addSpecRow}
          removeSpecRow={removeSpecRow}
          onSubmit={submit}
          saving={saving}
          isEdit={isEdit}
          skipCategoryStep={Boolean(initialCat && CATS[initialCat] && initialCat !== REAL_ESTATE_CAT)}
        />
      )}
    </div>
  );
}
