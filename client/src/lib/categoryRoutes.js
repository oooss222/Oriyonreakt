export function isCategoryBrowsePath(pathname = "") {
  return /^\/c\/[^/]+$/.test(pathname);
}

export function getCategorySlugFromPath(pathname = "") {
  const match = pathname.match(/^\/c\/([^/]+)$/);
  return match ? match[1] : "";
}

export function buildCategoryBrowsePath(cat, searchParams = {}) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (key === "cat") return;
    if (value === "" || value == null || value === false) return;
    params.set(key, String(value));
  });

  const query = params.toString();
  return `/c/${cat}${query ? `?${query}` : ""}`;
}
