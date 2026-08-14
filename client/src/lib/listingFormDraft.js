const DRAFT_STORAGE_KEY = "oriyon_listing_draft_v1";
const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function hasMeaningfulDraft(payload) {
  if (!payload?.form) return false;

  const { form, specs = [], existingImages = [] } = payload;

  if (form.title?.trim()) return true;
  if (form.description?.trim()) return true;
  if (form.price?.replace(/\D/g, "")) return true;
  if (existingImages.length > 0) return true;

  return specs.some((row) => String(row?.value || "").trim());
}

export function loadListingDraft() {
  if (!isBrowser()) return null;

  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    if (parsed.savedAt && Date.now() - parsed.savedAt > DRAFT_MAX_AGE_MS) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      return null;
    }

    return hasMeaningfulDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveListingDraft(payload) {
  if (!isBrowser()) return;
  if (!hasMeaningfulDraft(payload)) return;

  try {
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        ...payload,
        savedAt: Date.now(),
      })
    );
  } catch {
    // ignore quota / private mode errors
  }
}

export function clearListingDraft() {
  if (!isBrowser()) return;

  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function formatDraftSavedAt(savedAt) {
  if (!savedAt) return "";

  try {
    return new Date(savedAt).toLocaleString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
