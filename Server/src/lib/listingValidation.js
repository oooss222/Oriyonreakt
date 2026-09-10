const { isAllowedMediaUrl } = require("./mediaUrl");

// Kept in sync with client/src/data/listingCategories.js and specOptions.js so
// the API rejects anything the form would have blocked.
const TITLE_MAX = 80;
const DESC_MAX = 1000;
const LOCATION_MAX = 80;
const SUBCATEGORY_MAX = 80;
const PRICE_MAX_DIGITS = 12;
const SPEC_NAME_MAX = 80;
const SPEC_VALUE_MAX = 200;
const SPECS_MAX = 40;

// Mirrors the CATS keys in client/src/data/listingCategories.js.
const ALLOWED_CATS = new Set([
  "realestate",
  "transport",
  "furniture",
  "phones",
  "electronics",
  "computers",
  "services",
  "repair",
]);

class ListingValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ListingValidationError";
    this.status = 400;
    this.field = field;
  }
}

function countPriceDigits(price) {
  return String(price || "").replace(/\D/g, "").length;
}

function assertListingFields({
  title,
  description,
  price,
  location,
  subcategory,
  cat,
  images,
  specs,
} = {}) {
  if (title !== undefined && String(title).length > TITLE_MAX) {
    throw new ListingValidationError(
      `Title must be at most ${TITLE_MAX} characters`,
      "title"
    );
  }

  if (description !== undefined && String(description).length > DESC_MAX) {
    throw new ListingValidationError(
      `Description must be at most ${DESC_MAX} characters`,
      "description"
    );
  }

  if (price !== undefined && countPriceDigits(price) > PRICE_MAX_DIGITS) {
    throw new ListingValidationError("Price is too large", "price");
  }

  if (location !== undefined && String(location).length > LOCATION_MAX) {
    throw new ListingValidationError("Location is too long", "location");
  }

  if (subcategory !== undefined && String(subcategory).length > SUBCATEGORY_MAX) {
    throw new ListingValidationError("Subcategory is too long", "subcategory");
  }

  if (cat !== undefined && cat !== "" && !ALLOWED_CATS.has(String(cat))) {
    throw new ListingValidationError("Unknown category", "cat");
  }

  if (images !== undefined) {
    for (const image of images) {
      const url = typeof image === "string" ? image : image?.url;

      if (!isAllowedMediaUrl(url)) {
        throw new ListingValidationError(
          "Images must be uploaded through Oriyon",
          "images"
        );
      }
    }
  }

  if (specs !== undefined) {
    if (specs.length > SPECS_MAX) {
      throw new ListingValidationError("Too many specifications", "specs");
    }

    for (const spec of specs) {
      if (!spec || typeof spec !== "object") {
        throw new ListingValidationError("Invalid specification", "specs");
      }

      if (String(spec.name || "").length > SPEC_NAME_MAX) {
        throw new ListingValidationError(
          "Specification name is too long",
          "specs"
        );
      }

      if (String(spec.value ?? "").length > SPEC_VALUE_MAX) {
        throw new ListingValidationError(
          "Specification value is too long",
          "specs"
        );
      }
    }
  }
}

module.exports = {
  ListingValidationError,
  assertListingFields,
  ALLOWED_CATS,
  TITLE_MAX,
  DESC_MAX,
  PRICE_MAX_DIGITS,
};
