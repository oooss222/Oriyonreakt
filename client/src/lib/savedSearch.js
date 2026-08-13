const LOCAL_KEY = "oriyon_saved_searches";

export function buildSearchLabel(draft = {}, activeCat = "") {
  return [
    draft.subcategory,
    draft.specs?.["Тип сделки"],
    draft.specs?.["Комнат"] ? `${draft.specs["Комнат"]}-комн.` : "",
    draft.specs?.["Район"],
    draft.specs?.["Марка"] || draft.specs?.["Производитель"],
    draft.location || draft.region,
    draft.search,
    activeCat === "realestate" ? "Недвижимость" : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export function normalizeSearchFilters(draft = {}, activeCat = "") {
  const specs = draft.specs || {};
  const specEntries = Object.entries(specs)
    .filter(([name, value]) => String(name).trim() && String(value).trim())
    .sort(([a], [b]) => a.localeCompare(b, "ru"));

  return {
    cat: String(activeCat || draft.cat || "").trim(),
    search: String(draft.search || "").trim(),
    subcategory: String(draft.subcategory || "").trim(),
    priceFrom: String(draft.priceFrom || "").trim(),
    priceTo: String(draft.priceTo || "").trim(),
    location: String(draft.location || "").trim(),
    region: String(draft.region || "").trim(),
    sort: String(draft.sort || "new").trim(),
    sellerType: String(draft.sellerType || "").trim(),
    areaFrom: String(draft.areaFrom || "").trim(),
    areaTo: String(draft.areaTo || "").trim(),
    floorFrom: String(draft.floorFrom || "").trim(),
    floorTo: String(draft.floorTo || "").trim(),
    floorNotFirst: Boolean(draft.floorNotFirst),
    floorNotLast: Boolean(draft.floorNotLast),
    pricePerSqmFrom: String(draft.pricePerSqmFrom || "").trim(),
    pricePerSqmTo: String(draft.pricePerSqmTo || "").trim(),
    checkIn: String(draft.checkIn || "").trim(),
    checkOut: String(draft.checkOut || "").trim(),
    guests: String(draft.guests || "").trim(),
    yearFrom: String(draft.yearFrom || "").trim(),
    yearTo: String(draft.yearTo || "").trim(),
    mileageFrom: String(draft.mileageFrom || "").trim(),
    mileageTo: String(draft.mileageTo || "").trim(),
    onlyWithPhotos: Boolean(draft.onlyWithPhotos),
    verifiedOnly: Boolean(draft.verifiedOnly),
    specs: Object.fromEntries(specEntries),
  };
}

export function searchFiltersSignature(draft = {}, activeCat = "") {
  return JSON.stringify(normalizeSearchFilters(draft, activeCat));
}

export function hasMeaningfulSearchFilters(draft = {}, activeCat = "") {
  const normalized = normalizeSearchFilters(draft, activeCat);

  if (
    normalized.search ||
    normalized.subcategory ||
    normalized.priceFrom ||
    normalized.priceTo ||
    normalized.location ||
    normalized.region ||
    normalized.sellerType ||
    normalized.areaFrom ||
    normalized.areaTo ||
    normalized.floorFrom ||
    normalized.floorTo ||
    normalized.floorNotFirst ||
    normalized.floorNotLast ||
    normalized.pricePerSqmFrom ||
    normalized.pricePerSqmTo ||
    normalized.checkIn ||
    normalized.checkOut ||
    normalized.guests ||
    normalized.yearFrom ||
    normalized.yearTo ||
    normalized.mileageFrom ||
    normalized.mileageTo ||
    normalized.onlyWithPhotos ||
    normalized.verifiedOnly ||
    Object.keys(normalized.specs).length > 0
  ) {
    return true;
  }

  return false;
}

export function isDuplicateSavedSearch(items = [], draft = {}, activeCat = "") {
  const signature = searchFiltersSignature(draft, activeCat);

  return items.some((item) => {
    const payload = item.filters || item.params || {};
    return searchFiltersSignature(payload, item.cat || payload.cat || activeCat) === signature;
  });
}

export function readLocalSavedSearches() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

export function writeLocalSavedSearches(items = []) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items.slice(0, 20)));
}

export function saveSearchLocally(draft, activeCat) {
  const local = readLocalSavedSearches();

  if (isDuplicateSavedSearch(local, draft, activeCat)) {
    return { duplicate: true, items: local };
  }

  const label = buildSearchLabel(draft, activeCat) || "Поиск без названия";
  const entry = {
    label,
    params: normalizeSearchFilters(draft, activeCat),
    cat: activeCat,
    savedAt: Date.now(),
  };

  const next = [entry, ...local].slice(0, 20);
  writeLocalSavedSearches(next);

  return { duplicate: false, items: next, entry };
}

export { LOCAL_KEY };
