import { api } from "./api";
import { getEntryKey, isOwnCompareSource } from "./compareListings";
import { enrichRealEstateListing } from "./realEstate";
import { getCompareConfig } from "./compareConfig";

const LANG_STORAGE_KEY = "diyor_lang";
const NO_TITLE_LABELS = { ru: "Без названия", en: "Untitled", tg: "Бе ном" };

function noTitleLabel() {
  try {
    const lang = String(localStorage.getItem(LANG_STORAGE_KEY) || "").toLowerCase();
    return NO_TITLE_LABELS[lang] || NO_TITLE_LABELS.ru;
  } catch {
    return NO_TITLE_LABELS.ru;
  }
}

export function externalEntryToListing(entry, cat) {
  const snapshot = entry.snapshot || {};

  return {
    id: entry.key,
    _id: entry.key,
    _compareKey: entry.key,
    _compareSource: entry.platform || "other",
    _compareUrl: entry.url || "",
    _compareFetchedAt: entry.fetchedAt || "",
    _isExternal: true,
    title: snapshot.title || noTitleLabel(),
    price: snapshot.price || "",
    location: snapshot.location || "",
    specs: Array.isArray(snapshot.specs) ? snapshot.specs : [],
    cat: entry.cat || cat,
    images: snapshot.image ? [snapshot.image] : [],
  };
}

export async function resolveCompareEntries(entries = [], cat = "") {
  const config = getCompareConfig(cat);

  const rows = await Promise.all(
    entries.map(async (entry) => {
      if (entry.source === "external") {
        const item = externalEntryToListing(entry, cat);
        return config?.enrich ? config.enrich(item) : item;
      }

      if (isOwnCompareSource(entry.source) && entry.id) {
        try {
          const item = await api.listingById(entry.id);
          if (!item) return null;
          return config?.enrich ? config.enrich(item) : item;
        } catch {
          return null;
        }
      }

      return null;
    })
  );

  return rows
    .filter(Boolean)
    .map((item) => ({
      ...item,
      _compareKey: item._compareKey || item.id || item._id,
    }));
}

export function getCompareItemKey(item) {
  return item?._compareKey || item?.id || item?._id || "";
}

export function isExternalCompareItem(item) {
  return Boolean(item?._isExternal);
}

export function attachEntryMeta(item, entry) {
  if (!item || !entry) return item;

  if (entry.source === "external") {
    return {
      ...item,
      _compareKey: getEntryKey(entry),
      _compareSource: entry.platform || "other",
      _compareUrl: entry.url || "",
      _compareFetchedAt: entry.fetchedAt || "",
      _isExternal: true,
    };
  }

  return {
    ...item,
    _compareKey: getEntryKey(entry),
    _isExternal: false,
  };
}
