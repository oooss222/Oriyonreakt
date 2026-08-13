import { API_BASE } from "./api";

const PLACEHOLDER = "/img/placeholder.jpg";

export function resolveMediaUrl(src, { placeholder = PLACEHOLDER, allowEmpty = false } = {}) {
  if (!src) {
    return allowEmpty ? "" : placeholder;
  }

  const value = String(src);

  if (
    value.startsWith("http") ||
    value.startsWith("/img/") ||
    value.startsWith("data:")
  ) {
    return value;
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
