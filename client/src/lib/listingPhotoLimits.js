export const CATEGORY_PHOTO_LIMITS = {
  phones: 5,
  electronics: 5,
  transport: 6,
  computers: 6,
  repair: 3,
  realestate: 8,
  furniture: 6,
};

export const MAX_LISTING_PHOTO_LIMIT = Math.max(
  ...Object.values(CATEGORY_PHOTO_LIMITS)
);

export function getListingPhotoLimit(cat) {
  return CATEGORY_PHOTO_LIMITS[cat] ?? 6;
}

export function trimImagesToLimit(images, cat) {
  const limit = getListingPhotoLimit(cat);
  return Array.isArray(images) ? images.slice(0, limit) : [];
}
