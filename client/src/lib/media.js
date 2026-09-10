import { API_BASE } from "./api";

const PLACEHOLDER = "/img/placeholder.jpg";
const CLOUDINARY_UPLOAD = "/upload/";

// A transformation segment looks like "w_400,q_auto/" or "c_limit/".
const EXISTING_TRANSFORM = /^[a-z]{1,3}_[^/]*\//;

/**
 * Requests a resized, auto-format copy from Cloudinary instead of the original
 * upload. Grid cards otherwise download full-resolution photos, which is by far
 * the largest transfer on listing pages.
 */
export function withImageWidth(url, width) {
  if (!width || !url || !url.includes("res.cloudinary.com")) {
    return url;
  }

  const marker = url.indexOf(CLOUDINARY_UPLOAD);

  if (marker === -1) {
    return url;
  }

  const prefixEnd = marker + CLOUDINARY_UPLOAD.length;
  const rest = url.slice(prefixEnd);

  if (EXISTING_TRANSFORM.test(rest)) {
    return url;
  }

  return `${url.slice(0, prefixEnd)}f_auto,q_auto,c_limit,w_${width}/${rest}`;
}

export function resolveMediaUrl(
  src,
  { placeholder = PLACEHOLDER, allowEmpty = false, width = 0 } = {}
) {
  if (!src) {
    return allowEmpty ? "" : placeholder;
  }

  const value = String(src);

  if (
    value.startsWith("http") ||
    value.startsWith("/img/") ||
    value.startsWith("data:")
  ) {
    return withImageWidth(value, width);
  }

  const server = API_BASE.replace(/\/api$/, "");
  const clean = value.replace(/^\/+/, "");

  return `${server}/${clean}`;
}

function resolveListingImage(entry, options) {
  if (!entry) return "";

  if (typeof entry === "string") {
    return resolveMediaUrl(entry, options);
  }

  return resolveMediaUrl(
    entry?.url ||
      entry?.src ||
      entry?.path ||
      entry?.secure_url ||
      entry?.preview ||
      "",
    options
  );
}

export function getListingThumb(ad, options = {}) {
  const first = ad?.images?.[0];
  const fromFirst = resolveListingImage(first, options);

  if (fromFirst) {
    return fromFirst;
  }

  return resolveMediaUrl(ad?.img || ad?.image || "", options);
}

export function getListingImages(ad, options = {}) {
  const raw = Array.isArray(ad?.images) ? ad.images : [];
  const urls = raw
    .map((entry) => resolveListingImage(entry, options))
    .filter(Boolean);

  if (urls.length) {
    return urls;
  }

  const fallback = resolveMediaUrl(ad?.img || ad?.image || "", {
    ...options,
    allowEmpty: true,
  });

  return fallback ? [fallback] : [];
}

export { PLACEHOLDER };
