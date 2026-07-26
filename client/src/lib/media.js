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

export function getListingThumb(ad, options = {}) {
  const first = ad?.images?.[0];

  if (typeof first === "string") {
    return resolveMediaUrl(first, options);
  }

  return resolveMediaUrl(
    first?.url ||
      first?.src ||
      first?.path ||
      first?.secure_url ||
      first?.preview ||
      ad?.img ||
      ad?.image ||
      "",
    options
  );
}

export { PLACEHOLDER };
