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
  filterSpecsToTemplate,
} from "../data/listingCategories";
import { getListingPhotoLimit, getListingMinPhotos } from "../lib/listingPhotoLimits";
import { useUnsavedChanges } from "../lib/useUnsavedChanges";
import { REAL_ESTATE_CAT } from "../data/realEstate";
import RealEstateListingWizard, {
  isRealEstateWizardCategory,
} from "./RealEstateListingWizard";
import ListingFormSpecFields, {
  areListingSpecsComplete,
} from "./listing/ListingFormSpecFields";
import ListingFormPhotosSection from "./listing/ListingFormPhotosSection";
import ListingFormPublicationSidebar from "./listing/ListingFormPublicationSidebar";
import ListingFormMobilePublishBar from "./listing/ListingFormMobilePublishBar";
import ListingSubmitResult from "./listing/ListingSubmitResult";
import ListingCategoryPicker from "./listing/ListingCategoryPicker";
import {
  validateListingForm,
  buildPublishHintParts,
  areRealEstateCoreSpecsComplete,
} from "../lib/listingFormValidation";
import {
  clearListingDraft,
  clearRemoteListingDraft,
  formatDraftSavedAt,
  loadListingDraft,
  loadRemoteListingDraft,
  pickNewerDraft,
  saveListingDraft,
  saveRemoteListingDraft,
} from "../lib/listingFormDraft";
import { buildTransportSuggestedTitle } from "../lib/listingFormTitles";
import {
  mergeUserIntoStorage,
  readStoredUser,
  userHasSellerPhone,
} from "../lib/sellerContact";
import { compressImageFiles, moveArrayItem } from "../lib/imageCompress";
import { getListingFormErrorMessage } from "../lib/listingFormErrors";
import { getListingLimit } from "../lib/businessAccount";
import ListingGuidedForm, {
  isGuidedWizardCategory,
} from "./listing/ListingGuidedForm";
import { useI18n } from "../i18n";
import {
  Info,
  Tag,
  PencilLine,
  ListChecks,
  MapPin,
  Pencil,
  FileText,
} from "lucide-react";

const LISTING_FORM_ID = "listing-form";

function scrollToField(field) {
  if (!field || typeof document === "undefined") return;
  const el =
    document.querySelector(`[data-field="${field}"]`) ||
    document.getElementById(LISTING_FORM_ID);
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export default function ListingForm({
  mode = "create",
  listingId = null,
  initialData = null,
  initialCat = "",
  onSuccess,
  backTo = "/profile?tab=my",
}) {
  const nav = useNavigate();
  const { t } = useI18n();
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
  const [draftSavedAt, setDraftSavedAt] = React.useState(null);
  const [hasPhone, setHasPhone] = React.useState(() =>
    userHasSellerPhone(readStoredUser())
  );
  const [submitResult, setSubmitResult] = React.useState(null);
  const [compressing, setCompressing] = React.useState(false);
  const [invalidField, setInvalidField] = React.useState("");
  const [categoryPicked, setCategoryPicked] = React.useState(
    () => Boolean(initialCat && CATS[initialCat]) || isEdit
  );
  const [editBaseline, setEditBaseline] = React.useState(null);
  const skipLeaveRef = React.useRef(false);
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
    if (!isEdit || loading) return;
    // Capture once after the listing has been hydrated into state.
    setEditBaseline(
      JSON.stringify({
        form,
        specs,
        geo,
        existingImages,
        fileCount: files.length,
      })
    );
  }, [isEdit, loading]);

  React.useEffect(() => {
    if (isEdit) return undefined;

    let alive = true;

    (async () => {
      const local = loadListingDraft();
      const remote = token ? await loadRemoteListingDraft(token) : null;
      const draft = pickNewerDraft(local, remote);
      if (alive && draft) {
        setDraftPrompt(draft);
        if (draft.savedAt) setDraftSavedAt(draft.savedAt);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isEdit, token]);

  React.useEffect(() => {
    if (!token) return undefined;

    let alive = true;

    api
      .me(token)
      .then((user) => {
        if (!alive || !user) return;
        mergeUserIntoStorage(user);
        setHasPhone(userHasSellerPhone(user));
      })
      .catch(() => {
        if (alive) setHasPhone(userHasSellerPhone(readStoredUser()));
      });

    return () => {
      alive = false;
    };
  }, [token]);

  React.useEffect(() => {
    if (isEdit || draftPrompt) return;

    if (draftSaveTimerRef.current) {
      clearTimeout(draftSaveTimerRef.current);
    }

    draftSaveTimerRef.current = setTimeout(() => {
      const payload = {
        form,
        specs: filterSpecsToTemplate(form.cat, form.subcategory, specs),
        geo,
        existingImages: existingImages.map((img) => ({
          url: img.url,
          alt: img.alt || "",
        })),
      };

      const savedAt = saveListingDraft(payload);
      if (savedAt) setDraftSavedAt(savedAt);

      if (token) {
        saveRemoteListingDraft(token, payload).then((remoteAt) => {
          if (remoteAt) setDraftSavedAt(remoteAt);
        });
      }
    }, 1500);

    return () => {
      if (draftSaveTimerRef.current) {
        clearTimeout(draftSaveTimerRef.current);
      }
    };
  }, [form, specs, geo, existingImages, isEdit, draftPrompt, token]);

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

    applyCategorySpecs(catKey, firstSub, []);
  };

  const handleSubcategoryChange = (subcategory) => {
    const currentValues = compactSpecsForSubmit(
      filterSpecsToTemplate(form.cat, subcategory, specs)
    );

    setForm((state) => ({
      ...state,
      subcategory,
    }));

    applyCategorySpecs(form.cat, subcategory, currentValues);
  };

  const onFiles = async (list) => {
    const photoLimit = getListingPhotoLimit(form.cat);
    const arr = Array.from(list || []).filter((file) =>
      file.type.startsWith("image/") || /\.heic$/i.test(file.name || "")
    );

    const total = existingImages.length + files.length + arr.length;

    if (total > photoLimit) {
      setErr(t("form.maxPhotos", { count: photoLimit }));
      setInvalidField("photos");
      return;
    }

    setErr("");
    setInvalidField("");
    setCompressing(true);

    try {
      const compressed = await compressImageFiles(arr);

      // Create mode + auth: upload early so drafts sync photos across devices
      if (!isEdit && token && compressed.length) {
        try {
          const formData = new FormData();
          compressed.forEach((file) => formData.append("images", file));
          const uploaded = await api.uploadImages(token, formData);
          const urls = (uploaded?.urls || []).map((url) => ({
            url,
            alt: form.title.trim(),
          }));

          if (!urls.length) {
            throw new Error(t("listing.errorPhotoRejected"));
          }

          setExistingImages((current) =>
            [...current, ...urls].slice(0, photoLimit)
          );
          return;
        } catch (uploadError) {
          // Keep photos locally if upload fails; user can retry on submit
          setFiles((current) =>
            [...current, ...compressed].slice(
              0,
              photoLimit - existingImages.length
            )
          );
          setErr(
            getListingFormErrorMessage(
              uploadError,
              t,
              uploadError?.message || t("listing.createError")
            )
          );
          return;
        }
      }

      setFiles((current) =>
        [...current, ...compressed].slice(0, photoLimit - existingImages.length)
      );
    } catch (error) {
      setErr(
        getListingFormErrorMessage(
          error,
          t,
          error?.message || t("listing.createError")
        )
      );
    } finally {
      setCompressing(false);
    }
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

  const moveExistingImage = (from, to) => {
    setExistingImages((arr) => moveArrayItem(arr, from, to));
  };

  const moveNewFile = (from, to) => {
    setFiles((arr) => moveArrayItem(arr, from, to));
    setPreviews((arr) => moveArrayItem(arr, from, to));
  };

  const makeCoverExisting = (index) => {
    if (index <= 0) return;
    setExistingImages((arr) => moveArrayItem(arr, index, 0));
  };

  const makeCoverNew = (index) => {
    if (existingImages.length > 0) {
      // Move new file into existing slot conceptually: put as first new, but cover is first existing.
      // Prefer promoting by moving existing empty — for new-only lists, move to 0.
      setFiles((arr) => moveArrayItem(arr, index, 0));
      setPreviews((arr) => moveArrayItem(arr, index, 0));
      return;
    }
    setFiles((arr) => moveArrayItem(arr, index, 0));
    setPreviews((arr) => moveArrayItem(arr, index, 0));
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

    const draftSub =
      draftPrompt.form?.subcategory || CATS[draftCat]?.subs?.[0] || "";

    applyCategorySpecs(
      draftCat,
      draftSub,
      compactSpecsForSubmit(
        filterSpecsToTemplate(
          draftCat,
          draftSub,
          Array.isArray(draftPrompt.specs) ? draftPrompt.specs : []
        )
      )
    );

    setExistingImages(
      Array.isArray(draftPrompt.existingImages)
        ? draftPrompt.existingImages
        : []
    );
    setGeo(draftPrompt.geo || null);
    setDraftPrompt(null);
    setCategoryPicked(true);
  };

  const discardDraft = () => {
    clearListingDraft();
    clearRemoteListingDraft(token);
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
      clearRemoteListingDraft(token);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setErr("");

    if (!token) {
      goToAuth(nav, `${window.location.pathname}${window.location.search}`);
      return;
    }

    if (!isEdit && !hasPhone) {
      setErr(t("listing.phoneRequired"));
      setInvalidField("phone");
      return;
    }

    const storedUser = readStoredUser();
    const limit = getListingLimit(storedUser);
    // Soft client check — server enforces too
    if (!isEdit && limit != null) {
      // skip pre-count without API; server returns clear error
    }

    const validation = validateListingForm({
      form,
      specs,
      existingImages,
      files,
      isRealEstate: isRealEstateWizardCategory(form.cat),
      t,
    });

    if (validation.message) {
      setErr(validation.message);
      setInvalidField(validation.field || "");
      scrollToField(validation.field);
      return;
    }

    setInvalidField("");

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
        clearRemoteListingDraft(token);
        setDraftSavedAt(null);
        setSubmitResult(result);
        return;
      }

      skipLeaveRef.current = true;
      onSuccess?.(result);
    } catch (error) {
      setErr(
        getListingFormErrorMessage(
          error,
          t,
          isEdit ? t("listing.saveError") : t("listing.createError")
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const requestFormSubmit = () => {
    const el = document.getElementById(LISTING_FORM_ID);
    if (typeof el?.requestSubmit === "function") {
      el.requestSubmit();
      return;
    }
    el?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  };

  const cat = CATS[form.cat];
  const subs = cat?.subs || [];
  const photosCount = existingImages.length + previews.length;
  const photoLimit = getListingPhotoLimit(form.cat);
  const minPhotos = getListingMinPhotos(form.cat);
  const useRealEstateWizard = isRealEstateWizardCategory(form.cat);
  const useGuidedWizard = isGuidedWizardCategory(form.cat);
  const specsComplete = useRealEstateWizard
    ? areRealEstateCoreSpecsComplete(form, specs)
    : areListingSpecsComplete(specs);

  const previewItem = React.useMemo(
    () => ({
      title: form.title,
      price: form.price,
      location: form.location,
      cat: form.cat,
      images: [
        ...existingImages,
        ...previews.map((url) => ({ url })),
      ],
      createdAt: new Date().toISOString(),
    }),
    [form.title, form.price, form.location, form.cat, existingImages, previews]
  );
  const hasTitle = Boolean(form.title.trim());
  const hasPrice = Boolean(priceDigits.length);
  const hasPhotos = photosCount >= minPhotos;
  const phoneOk = isEdit || hasPhone;
  const editSnapshot = JSON.stringify({
    form,
    specs,
    geo,
    existingImages,
    fileCount: files.length,
  });
  const isDirty =
    isEdit &&
    !loading &&
    !saving &&
    !skipLeaveRef.current &&
    editBaseline != null &&
    editSnapshot !== editBaseline;
  useUnsavedChanges(isDirty);
  const canPublish =
    hasTitle &&
    hasPrice &&
    hasPhotos &&
    specsComplete &&
    phoneOk &&
    !saving;

  const publishHintParts = buildPublishHintParts({
    form,
    specs,
    photosCount,
    minPhotos,
    isRealEstate: useRealEstateWizard,
    t,
  });
  if (!phoneOk) publishHintParts.unshift(t("listing.phoneHintShort"));
  const publishHint = publishHintParts.length
    ? `${t("form.fillPrefix")} ${publishHintParts.join(", ")}`
    : "";

  const suggestTransportTitle = () => {
    setField("title", buildTransportSuggestedTitle(specs));
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        <div className="rounded-2xl border bg-white p-6 text-center">
          {t("common.loading")}
        </div>
      </div>
    );
  }

  if (submitResult) {
    return (
      <ListingSubmitResult
        listing={submitResult}
        onEditAgain={() => {
          const id = submitResult.id || submitResult._id;
          if (id) nav(`/edit/${id}`);
          else setSubmitResult(null);
        }}
      />
    );
  }

  return (
    <div className="listing-form-page bg-mist/40 min-h-[calc(100vh-4rem)]">
      <div className="listing-form-header">
        <div className="listing-form-badge">
          {isEdit ? (
            <>
              <Pencil className="w-4 h-4" />
              {t("listing.editing")}
            </>
          ) : (
            <>
              <Tag className="w-4 h-4" />
              {t("listing.newBadge")}
            </>
          )}
        </div>

        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-ink">
          {isEdit ? t("listing.editForm") : t("listing.createForm")}
        </h1>

        <p className="text-ink-400 text-sm md:text-base">
          {isEdit ? t("listing.editHint") : t("listing.createHint")}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link
            to={backTo}
            className="inline-flex text-sm text-ink-400 hover:text-ink transition"
          >
            {t("form.back")}
          </Link>
          {!isEdit && draftSavedAt ? (
            <span className="text-xs text-lagoon-700 font-medium">
              {t("listing.draftAutosaved", {
                time: formatDraftSavedAt(draftSavedAt),
              })}
            </span>
          ) : null}
        </div>
      </div>

      {draftPrompt ? (
        <div className="rounded-2xl border border-sun/20 bg-sun-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-sun-700 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-sun-800">
                {t("listing.draftContinue")}
              </div>
              <div className="text-sm text-sun-700 mt-1">
                {t("listing.draftContinueDesc", {
                  time:
                    formatDraftSavedAt(draftPrompt.savedAt) ||
                    t("listing.draftRecently"),
                })}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={restoreDraft}
              className="rounded-xl bg-sun text-white px-4 py-2 text-sm font-semibold hover:opacity-90"
            >
              {t("listing.continue")}
            </button>
            <button
              type="button"
              onClick={discardDraft}
              className="rounded-xl border border-ink/10 bg-white px-4 py-2 text-sm font-medium hover:bg-mist"
            >
              {t("listing.startOver")}
            </button>
          </div>
        </div>
      ) : null}

      {err && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4 space-y-2"
        >
          <p>{err}</p>
          {!hasPhone && !isEdit ? (
            <Link
              to="/profile?tab=profile"
              className="inline-flex text-sm font-semibold text-sun-700 hover:underline"
            >
              {t("listing.goAddPhone")}
            </Link>
          ) : null}
        </div>
      )}

      {!isEdit && !categoryPicked ? (
        <ListingCategoryPicker
          selected={form.cat}
          onSelect={(catKey) => {
            handleCatChange(catKey);
            setCategoryPicked(true);
          }}
        />
      ) : null}

      {(!isEdit && !categoryPicked) ? null : useRealEstateWizard ? (
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
          onMoveExisting={moveExistingImage}
          onMoveNew={moveNewFile}
          onMakeCoverExisting={makeCoverExisting}
          onMakeCoverNew={makeCoverNew}
          compressing={compressing}
          photoLimit={photoLimit}
          onSubmit={submit}
          saving={saving}
          isEdit={isEdit}
          onReset={resetForm}
          formId={LISTING_FORM_ID}
          requirePhone={!isEdit}
          hasPhone={hasPhone}
          previewItem={previewItem}
        />
      ) : useGuidedWizard ? (
        <ListingGuidedForm
          form={form}
          setForm={setForm}
          specs={specs}
          onUpdateSpec={updateSpec}
          onRemoveSpec={removeSpecRow}
          onSubcategoryChange={handleSubcategoryChange}
          files={files}
          previews={previews}
          existingImages={existingImages}
          onFiles={onFiles}
          onInputFiles={onInputFiles}
          removeFile={removeFile}
          removeExistingImage={removeExistingImage}
          clearNewFiles={clearNewFiles}
          onMoveExisting={moveExistingImage}
          onMoveNew={moveNewFile}
          onMakeCoverExisting={makeCoverExisting}
          onMakeCoverNew={makeCoverNew}
          compressing={compressing}
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
          photoLimit={photoLimit}
          onSubmit={submit}
          saving={saving}
          isEdit={isEdit}
          onReset={resetForm}
          formId={LISTING_FORM_ID}
          requirePhone={!isEdit}
          hasPhone={hasPhone}
          invalidField={invalidField}
          previewItem={previewItem}
        />
      ) : (
      <form
        id={LISTING_FORM_ID}
        onSubmit={submit}
        className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem] gap-5"
      >
        <section className="space-y-5 min-w-0">
          <div className="listing-form-card" data-field="title">
            <div className="listing-form-card__head">
              <div className="listing-form-card__title">
                <Info className="w-5 h-5 text-sun" />
                {t("form.basicInfo")}
              </div>
            </div>

            <div className="listing-form-card__body">
              <div>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <label className="listing-form-label listing-form-label-required">
                    {t("form.title")}
                  </label>
                  {form.cat === "transport" ? (
                    <button
                      type="button"
                      onClick={suggestTransportTitle}
                      className="inline-flex items-center gap-1 text-xs font-medium text-sun hover:text-sun-700"
                    >
                      <PencilLine className="w-3.5 h-3.5" />
                      {t("form.generateTitle")}
                    </button>
                  ) : null}
                </div>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setField("title", e.target.value.slice(0, TITLE_MAX))
                  }
                  placeholder={t("form.titlePlaceholder")}
                  className="listing-form-input"
                />
                <div className="listing-form-meta">
                  {form.title.length}/{TITLE_MAX}
                </div>
              </div>

              <div>
                <label className="listing-form-label listing-form-label-required">
                  {t("form.price")}
                </label>
                <div className="listing-form-price-wrap">
                  <input
                    value={form.price}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    onPaste={(e) => {
                      e.preventDefault();
                      handlePriceChange(e.clipboardData.getData("text"));
                    }}
                    placeholder={t("form.pricePlaceholder")}
                    inputMode="numeric"
                    autoComplete="off"
                  />
                  <span className="listing-form-price-suffix">{t("price.currency")}</span>
                </div>
                <div className="listing-form-meta">
                  {priceDigits.length}/{PRICE_MAX_DIGITS} {t("form.digits")}
                </div>
              </div>

              <div>
                <label className="listing-form-label">{t("form.location")}</label>
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
                  <label className="listing-form-label">{t("form.category")}</label>
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
                  <label className="listing-form-label">{t("form.subcategory")}</label>
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
                <label className="listing-form-label">{t("form.description")}</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setField("description", e.target.value.slice(0, DESC_MAX))
                  }
                  placeholder={t("form.descriptionPlaceholder")}
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
            onMoveExisting={moveExistingImage}
            onMoveNew={moveNewFile}
            onMakeCoverExisting={makeCoverExisting}
            onMakeCoverNew={makeCoverNew}
          />

          <div className="listing-form-card overflow-hidden" data-field="specs">
            <div className="listing-form-card__head">
              <div className="listing-form-card__title">
                <ListChecks className="w-5 h-5 text-sun" />
                {t("form.specs")}
              </div>
            </div>

            <ListingFormSpecFields
              specs={specs}
              onUpdate={updateSpec}
              onRemove={removeSpecRow}
              invalid={invalidField === "specs"}
            />
          </div>
        </section>

        <ListingFormPublicationSidebar
          categoryTitle={cat?.title}
          subcategory={form.subcategory}
          checks={[
            {
              key: "photos",
              label: t("form.photos"),
              ok: hasPhotos,
              detail: `${photosCount}/${photoLimit}`,
            },
            {
              key: "specs",
              label: t("form.specs"),
              ok: specsComplete,
              detail: specsComplete ? t("form.specsFilled") : t("form.specsEmpty"),
            },
            {
              key: "price",
              label: t("form.price"),
              ok: hasPrice,
              detail: hasPrice
                ? `${formatPriceInput(form.price)} ${t("price.currency")}`
                : t("form.priceEmpty"),
            },
          ]}
          canPublish={canPublish}
          publishHint={publishHint}
          saving={saving}
          isEdit={isEdit}
          onReset={resetForm}
          requirePhone={!isEdit}
          hasPhone={hasPhone}
          previewItem={previewItem}
          moderationHint={!isEdit ? t("listing.moderationLikelyHint") : null}
          footerNote={
            isEdit
              ? t("listing.editModerationHint")
              : t("listing.publishHint")
          }
        />
      </form>
      )}

      <ListingFormMobilePublishBar
        canPublish={canPublish}
        saving={saving}
        isEdit={isEdit}
        publishHint={publishHint}
        onPublish={requestFormSubmit}
        visible={isEdit || categoryPicked}
      />
    </div>
  );
}
