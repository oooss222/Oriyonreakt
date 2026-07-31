const PHONE_SPEC_KEYS = ["Память", "Состояние", "Производитель", "Модель", "Гарантия"];
const AUTO_SPEC_KEYS = ["Марка", "Модель", "Год выпуска", "Пробег", "Состояние"];
const RE_SPEC_KEYS = ["Комнат", "Тип сделки", "Площадь общая", "Район"];

function specsToMap(specs = []) {
  return specs.reduce((acc, spec) => {
    const name = String(spec?.name || "").trim();
    const value = String(spec?.value || "").trim();
    if (name && value) acc[name] = value;
    return acc;
  }, {});
}

function pickSpecChips(specMap, keys, limit = 4) {
  const chips = [];

  for (const key of keys) {
    if (specMap[key]) {
      chips.push(specMap[key]);
    }
    if (chips.length >= limit) return chips;
  }

  return chips;
}

export function getListingQuickFacts(ad, specs = [], { published = "" } = {}) {
  const specMap = specsToMap(specs);
  const chips = [];

  if (ad?.cat === "phones" || ad?.cat === "electronics") {
    chips.push(...pickSpecChips(specMap, PHONE_SPEC_KEYS, 4));
  } else if (ad?.cat === "auto") {
    chips.push(...pickSpecChips(specMap, AUTO_SPEC_KEYS, 4));
  } else if (ad?.cat === "realestate") {
    chips.push(...pickSpecChips(specMap, RE_SPEC_KEYS, 3));
  } else {
    chips.push(...pickSpecChips(specMap, Object.keys(specMap).slice(0, 4), 3));
  }

  if (ad?.subcategory && chips.length < 4) {
    chips.push(ad.subcategory);
  }

  if ((ad?.location || ad?.city) && chips.length < 5) {
    chips.push(ad.location || ad.city);
  }

  if (published && chips.length < 5) {
    chips.push(published);
  }

  return [...new Set(chips.filter(Boolean))].slice(0, 5);
}

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
    {
      cat: ad.cat,
      limit: 16,
    },
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
