import { DESC_MAX, TITLE_MAX } from "../../data/listingCategories";
import {
  PRICE_MAX_DIGITS,
  getPriceDigits,
} from "../../data/specOptions";
import { areRealEstateCoreSpecsComplete } from "../../lib/listingFormValidation";
import { areListingSpecsComplete } from "./ListingFormSpecFields";

/** Order the composer walks when it looks for the first field to focus. */
export const LISTING_FIELD_ORDER = [
  "category",
  "title",
  "price",
  "description",
  "specs",
  "photos",
  "location",
];

/**
 * Per-field mirror of `validateListingForm`, so a blur can show the same
 * message the submit would produce without running the whole form.
 */
export function getListingFieldError(field, context = {}) {
  const {
    form = {},
    specs = [],
    photosCount = 0,
    minPhotos = 1,
    photoLimit = 6,
    isRealEstate = false,
    t,
  } = context;

  const tr = (key, vars) => (t ? t(key, vars) : key);

  switch (field) {
    case "category":
      return form.subcategory?.trim()
        ? ""
        : tr("composer.errorSubcategoryRequired");

    case "title":
      if (!form.title?.trim()) return tr("composer.errorTitleRequired");
      if (form.title.trim().length > TITLE_MAX) {
        return tr("form.validationTitleMax", { max: TITLE_MAX });
      }
      return "";

    case "price": {
      const digits = getPriceDigits(form.price);
      if (digits.length > PRICE_MAX_DIGITS) {
        return tr("form.validationPriceMax", { max: PRICE_MAX_DIGITS });
      }
      return digits ? "" : tr("form.validationPrice");
    }

    case "description":
      return (form.description || "").length > DESC_MAX
        ? tr("form.validationDescMax", { max: DESC_MAX })
        : "";

    case "location":
      return form.location?.trim() ? "" : tr("form.validationLocation");

    case "photos":
      if (photosCount > photoLimit) {
        return tr("form.validationPhotoMax", { max: photoLimit });
      }
      if (photosCount < minPhotos) {
        return minPhotos === 1
          ? tr("form.validationPhotoMin1")
          : tr("form.validationPhotoMin", { min: minPhotos });
      }
      return "";

    case "specs":
      if (isRealEstate) {
        return areRealEstateCoreSpecsComplete(form, specs)
          ? ""
          : tr("form.validationReCore");
      }
      return areListingSpecsComplete(specs) ? "" : tr("form.validationSpecs");

    default:
      return "";
  }
}

export function getAllListingFieldErrors(context = {}) {
  const errors = {};

  LISTING_FIELD_ORDER.forEach((field) => {
    const message = getListingFieldError(field, context);
    if (message) errors[field] = message;
  });

  return errors;
}

/** Moves the viewport and the caret to a field marked with `data-field`. */
export function focusListingField(field, fallbackId) {
  if (typeof document === "undefined") return;

  const container =
    document.querySelector(`[data-field="${field}"]`) ||
    (fallbackId ? document.getElementById(fallbackId) : null);

  if (!container) return;

  container.scrollIntoView({ behavior: "smooth", block: "center" });

  const control = container.matches("input, select, textarea")
    ? container
    : container.querySelector(
        "input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])"
      );

  control?.focus({ preventScroll: true });
}
