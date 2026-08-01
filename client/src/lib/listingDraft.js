const DRAFT_KEY = "oriyon_listing_draft_v1";

export function saveListingDraft(payload) {
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        ...payload,
        savedAt: Date.now(),
      })
    );
  } catch {
    /* ignore quota errors */
  }
}

export function loadListingDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearListingDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export function hasFreshDraft(maxAgeMs = 1000 * 60 * 60 * 24 * 7) {
  const draft = loadListingDraft();
  if (!draft?.savedAt) return false;
  return Date.now() - draft.savedAt < maxAgeMs;
}
