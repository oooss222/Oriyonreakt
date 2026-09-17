import { CATS } from "../data/listingCategories";
import { buildRealEstateCategoryUrl } from "./realestateSeo";

export function isCategoryBrowsePath(pathname = "") {
  return /^\/c\/[^/]+$/.test(pathname);
}

export function getCategoryLandingPath(slug = "") {
  const cat = CATS[slug];
  if (!cat) return "/listing";
  return cat.landingPath || `/c/${slug}`;
}

export function getSubcategoryBrowsePath(slug = "", subcategory = "") {
  const sub = String(subcategory || "").trim();
  if (!sub) return getCategoryLandingPath(slug);

  if (slug === "realestate") {
    return buildRealEstateCategoryUrl("Душанбе", sub);
  }

  return buildCategoryBrowsePath(slug, { subcategory: sub });
}

export function getCategorySubcategoryLabels(slug = "") {
  const cat = CATS[slug];
  if (!cat) return [];

  if (Array.isArray(cat.subGroups) && cat.subGroups.length) {
    const grouped = cat.subGroups.flatMap(({ group, items }) =>
      (items || []).map((item) => ({
        value: `${group} — ${item}`,
        label: item,
        group,
      }))
    );
    const known = new Set(grouped.map((item) => item.value));
    const extras = (cat.subs || [])
      .filter((sub) => !known.has(sub))
      .map((sub) => ({
        value: sub,
        label: sub.includes(" — ") ? sub.split(" — ").slice(1).join(" — ") : sub,
        group: "",
      }));
    return [...grouped, ...extras];
  }

  return (cat.subs || []).map((sub) => ({
    value: sub,
    label: sub.includes(" — ") ? sub.split(" — ").slice(1).join(" — ") : sub,
    group: "",
  }));
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
