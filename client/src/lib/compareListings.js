const LEGACY_RE_KEY = "oriyon_re_compare";
const STORAGE_KEY = "oriyon_compare";
const MAX_ITEMS = 4;

export const COMPARE_SUPPORTED_CATS = [
  "realestate",
  "transport",
  "phones",
  "electronics",
  "computers",
  "furniture",
];

function normalizeCat(cat) {
  const key = String(cat || "").trim();
  return COMPARE_SUPPORTED_CATS.includes(key) ? key : "realestate";
}

function generateExternalKey() {
  return `ext_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeEntry(raw, cat) {
  if (!raw) return null;

  if (typeof raw === "string") {
    return { source: "oriyon", id: raw, cat };
  }

  if (raw.source === "oriyon" && raw.id) {
    return { source: "oriyon", id: String(raw.id), cat: raw.cat || cat };
  }

  if (raw.source === "external" && raw.key && raw.snapshot) {
    return {
      source: "external",
      key: String(raw.key),
      cat: raw.cat || cat,
      platform: String(raw.platform || "other"),
      url: String(raw.url || "").trim(),
      fetchedAt: raw.fetchedAt || new Date().toISOString(),
      snapshot: {
        title: String(raw.snapshot.title || "").trim(),
        price: String(raw.snapshot.price || "").trim(),
        location: String(raw.snapshot.location || "").trim(),
        image: String(raw.snapshot.image || "").trim(),
        specs: Array.isArray(raw.snapshot.specs)
          ? raw.snapshot.specs
              .filter((row) => row?.name && row?.value)
              .map((row) => ({
                name: String(row.name).trim(),
                value: String(row.value).trim(),
              }))
          : [],
      },
    };
  }

  return null;
}

function sanitizeEntries(entries = []) {
  const seen = new Set();
  const next = [];

  for (const entry of entries) {
    const key = getEntryKey(entry);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    next.push(entry);
    if (next.length >= MAX_ITEMS) break;
  }

  return next;
}

// Every compare button on a listing grid reads this, so the parsed buckets are
// cached and invalidated on write.
let cachedBuckets = null;

if (typeof window !== "undefined") {
  // Another tab may have changed the list.
  window.addEventListener("storage", (event) => {
    if (!event.key || event.key === STORAGE_KEY || event.key === LEGACY_RE_KEY) {
      cachedBuckets = null;
    }
  });
}

function readAllBuckets() {
  if (cachedBuckets) return cachedBuckets;

  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const buckets =
      raw && typeof raw === "object" && !Array.isArray(raw) ? { ...raw } : {};

    const legacy = JSON.parse(localStorage.getItem(LEGACY_RE_KEY) || "[]");
    if (Array.isArray(legacy) && legacy.length && !buckets.realestate?.length) {
      buckets.realestate = legacy
        .filter(Boolean)
        .map((id) => ({ source: "oriyon", id, cat: "realestate" }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(buckets));
    }

    cachedBuckets = buckets;
  } catch {
    cachedBuckets = {};
  }

  return cachedBuckets;
}

function writeAllBuckets(buckets) {
  cachedBuckets = buckets;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(buckets));
  window.dispatchEvent(
    new CustomEvent("oriyon:compare-change", { detail: buckets })
  );
  return buckets;
}

export function getEntryKey(entry) {
  if (!entry) return "";
  if (entry.source === "oriyon") return String(entry.id || "");
  if (entry.source === "external") return String(entry.key || "");
  return "";
}

export function readCompareEntries(cat = "realestate") {
  const key = normalizeCat(cat);
  const buckets = readAllBuckets();
  const rows = buckets[key];

  if (!Array.isArray(rows)) return [];

  return sanitizeEntries(
    rows
      .map((row) => normalizeEntry(row, key))
      .filter(Boolean)
  );
}

export function readCompareIds(cat = "realestate") {
  return readCompareEntries(cat);
}

export function readCompareCount(cat = "realestate") {
  return readCompareEntries(cat).length;
}

function writeCompareEntries(entries = [], cat = "realestate") {
  const key = normalizeCat(cat);
  const buckets = readAllBuckets();
  buckets[key] = sanitizeEntries(entries.map((row) => normalizeEntry(row, key)).filter(Boolean));
  writeAllBuckets(buckets);
  return buckets[key];
}

export function toggleCompareId(id, cat = "realestate") {
  if (!id) {
    return { entries: readCompareEntries(cat), ok: false, reason: "missing" };
  }

  const key = normalizeCat(cat);
  const current = readCompareEntries(key);
  const entryKey = String(id);

  if (current.some((entry) => getEntryKey(entry) === entryKey)) {
    const entries = writeCompareEntries(
      current.filter((entry) => getEntryKey(entry) !== entryKey),
      key
    );
    return { entries, ok: true, reason: "removed", active: false };
  }

  if (current.length >= MAX_ITEMS) {
    return { entries: current, ok: false, reason: "full", active: false };
  }

  const nextEntry = { source: "oriyon", id: entryKey, cat: key };
  const entries = writeCompareEntries([...current, nextEntry], key);
  return { entries, ok: true, reason: "added", active: true };
}

export function addExternalCompareEntry(cat, payload = {}) {
  const key = normalizeCat(cat);
  const current = readCompareEntries(key);

  const title = String(payload.title || "").trim();
  const price = String(payload.price || "").trim();

  if (!title || !price) {
    return readCompareEntries(key);
  }

  const entry = {
    source: "external",
    key: generateExternalKey(),
    cat: key,
    platform: String(payload.platform || "other").trim(),
    url: String(payload.url || "").trim(),
    fetchedAt: new Date().toISOString(),
    snapshot: {
      title,
      price,
      location: String(payload.location || "").trim(),
      image: String(payload.image || "").trim(),
      specs: Array.isArray(payload.specs)
        ? payload.specs
            .filter((row) => row?.name && row?.value)
            .map((row) => ({
              name: String(row.name).trim(),
              value: String(row.value).trim(),
            }))
        : [],
    },
  };

  if (current.length >= MAX_ITEMS) {
    return writeCompareEntries([...current.slice(1), entry], key);
  }

  return writeCompareEntries([...current, entry], key);
}

function buildExternalSnapshot(payload = {}, previous = {}) {
  return {
    title: String(payload.title ?? previous.title ?? "").trim(),
    price: String(payload.price ?? previous.price ?? "").trim(),
    location: String(payload.location ?? previous.location ?? "").trim(),
    image: String(payload.image ?? previous.image ?? "").trim(),
    specs: Array.isArray(payload.specs)
      ? payload.specs
          .filter((row) => row?.name && row?.value)
          .map((row) => ({
            name: String(row.name).trim(),
            value: String(row.value).trim(),
          }))
      : previous.specs || [],
  };
}

export function updateExternalCompareEntry(entryKey, cat, payload = {}) {
  if (!entryKey) return readCompareEntries(cat);

  const key = normalizeCat(cat);
  const current = readCompareEntries(key);
  let found = false;

  const next = current.map((entry) => {
    if (entry.source !== "external" || getEntryKey(entry) !== String(entryKey)) {
      return entry;
    }

    found = true;
    const snapshot = buildExternalSnapshot(payload, entry.snapshot);

    return normalizeEntry(
      {
        ...entry,
        platform: String(payload.platform || entry.platform || "other").trim(),
        url: String(payload.url || entry.url || "").trim(),
        fetchedAt: new Date().toISOString(),
        snapshot,
      },
      key
    );
  });

  if (!found) return readCompareEntries(key);
  return writeCompareEntries(next, key);
}

export function removeCompareEntry(entryKey, cat = "realestate") {
  if (!entryKey) return readCompareEntries(cat);

  const key = normalizeCat(cat);
  return writeCompareEntries(
    readCompareEntries(key).filter((entry) => getEntryKey(entry) !== String(entryKey)),
    key
  );
}

export function removeCompareId(id, cat = "realestate") {
  return removeCompareEntry(id, cat);
}

export function isInCompare(id, cat = "realestate") {
  const entryKey = String(id || "");
  return readCompareEntries(cat).some(
    (entry) => entry.source === "oriyon" && getEntryKey(entry) === entryKey
  );
}

export function clearCompare(cat = "realestate") {
  return writeCompareEntries([], cat);
}

export function replaceCompareEntries(entries = [], cat = "realestate") {
  return writeCompareEntries(entries, cat);
}

export function mergeCompareEntries(incoming = [], cat = "realestate") {
  const key = normalizeCat(cat);
  const current = readCompareEntries(key);
  const map = new Map();

  for (const entry of [...current, ...incoming]) {
    const normalized = normalizeEntry(entry, key);
    const entryKey = getEntryKey(normalized);
    if (!entryKey || !normalized) continue;
    map.set(entryKey, normalized);
  }

  return writeCompareEntries([...map.values()], key);
}

export function isCompareSupported(cat) {
  return COMPARE_SUPPORTED_CATS.includes(String(cat || "").trim());
}

export function getActiveCompareCat(pathname = "") {
  if (pathname.startsWith("/realestate")) return "realestate";

  const match = String(pathname).match(/^\/c\/([^/]+)/);
  const slug = match?.[1];
  if (slug && isCompareSupported(slug)) return slug;

  return null;
}

export function findCompareCatWithItems(preferredCat = "") {
  if (preferredCat && readCompareCount(preferredCat) > 0) {
    return preferredCat;
  }

  for (const cat of COMPARE_SUPPORTED_CATS) {
    if (readCompareCount(cat) > 0) return cat;
  }

  return null;
}

export const COMPARE_MAX = MAX_ITEMS;
