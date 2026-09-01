import data from "@shared/listingPhotoLimits.json";

export const CATEGORY_PHOTO_LIMITS = data.CATEGORY_PHOTO_LIMITS;
export const CATEGORY_MIN_PHOTOS = data.CATEGORY_MIN_PHOTOS;

/** Minimum photos required to publish by category. */
export const MAX_LISTING_PHOTO_LIMIT = Math.max(
  ...Object.values(CATEGORY_PHOTO_LIMITS)
);

export function getListingPhotoLimit(cat) {
  return CATEGORY_PHOTO_LIMITS[cat] ?? 6;
}

export function getListingMinPhotos(cat) {
  return CATEGORY_MIN_PHOTOS[cat] ?? 1;
}

export function trimImagesToLimit(images, cat) {
  const limit = getListingPhotoLimit(cat);
  return Array.isArray(images) ? images.slice(0, limit) : [];
}
