export function buildRelatedSearchTerm(ad) {
  const title = String(ad?.title || "").trim();
  if (!title) return "";

  const words = title
    .replace(/[^\p{L}\p{N}\s+-]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1);

  return words.slice(0, 3).join(" ");
}

export async function loadRelatedListings(api, ad, limit = 10) {
  if (!ad?.cat) return [];

  const currentId = String(ad._id || ad.id);
  const excludeCurrent = (list) =>
    (Array.isArray(list) ? list : []).filter(
      (item) => String(item._id || item.id) !== currentId
    );

  const mergeUnique = (base, extra) => {
    const seen = new Set(base.map((item) => String(item._id || item.id)));
    const next = [...base];

    for (const item of extra) {
      const id = String(item._id || item.id);
      if (seen.has(id)) continue;
      seen.add(id);
      next.push(item);
    }

    return next;
  };

  let results = [];
  const search = buildRelatedSearchTerm(ad);
  const location = ad.location || ad.city || "";

  const attempts = [
    {
      cat: ad.cat,
      subcategory: ad.subcategory || undefined,
      search: search || undefined,
      location: location || undefined,
      limit: 16,
    },
    {
      cat: ad.cat,
      subcategory: ad.subcategory || undefined,
      location: location || undefined,
      limit: 16,
    },
    {
      cat: ad.cat,
      subcategory: ad.subcategory || undefined,
      limit: 16,
    },
    { cat: ad.cat, limit: 16 },
  ];

  for (const params of attempts) {
    if (results.length >= limit) break;

    try {
      const data = await api.listings(params);
      results = mergeUnique(results, excludeCurrent(data));
    } catch {
      /* try next strategy */
    }
  }

  return results.slice(0, limit);
}
