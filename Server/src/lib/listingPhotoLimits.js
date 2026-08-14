const CATEGORY_PHOTO_LIMITS = {
  phones: 5,
  electronics: 5,
  transport: 6,
  computers: 6,
  services: 5,
  repair: 3,
  realestate: 8,
  furniture: 6,
};

const CATEGORY_MIN_PHOTOS = {
  transport: 3,
  realestate: 3,
  services: 1,
  repair: 1,
};

const MAX_LISTING_PHOTO_LIMIT = Math.max(...Object.values(CATEGORY_PHOTO_LIMITS));

function getListingPhotoLimit(cat) {
  return CATEGORY_PHOTO_LIMITS[cat] ?? 6;
}

function getListingMinPhotos(cat) {
  return CATEGORY_MIN_PHOTOS[cat] ?? 1;
}

function assertImagesWithinLimit(images, cat) {
  const limit = getListingPhotoLimit(cat);
  const count = Array.isArray(images) ? images.length : 0;

  if (count > limit) {
    const error = new Error("PHOTO_LIMIT_EXCEEDED");
    error.limit = limit;
    error.count = count;
    throw error;
  }

  const minPhotos = getListingMinPhotos(cat);
  if (count < minPhotos) {
    const error = new Error("PHOTO_MIN_NOT_MET");
    error.min = minPhotos;
    error.count = count;
    throw error;
  }
}

module.exports = {
  CATEGORY_PHOTO_LIMITS,
  CATEGORY_MIN_PHOTOS,
  MAX_LISTING_PHOTO_LIMIT,
  getListingPhotoLimit,
  getListingMinPhotos,
  assertImagesWithinLimit,
};
