import { api } from "./api";

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

function normalizeDraft(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (!hasMeaningfulDraft(payload)) return null;

  return {
    form: payload.form || {},
    specs: Array.isArray(payload.specs) ? payload.specs : [],
    geo: payload.geo || null,
    existingImages: Array.isArray(payload.existingImages)
      ? payload.existingImages
      : [],
    savedAt: Number(payload.savedAt) || Date.now(),
  };
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

    return normalizeDraft(parsed);
  } catch {
    return null;
  }
}

export function saveListingDraft(payload) {
  if (!isBrowser()) return null;
  if (!hasMeaningfulDraft(payload)) return null;

  const savedAt = Date.now();

  try {
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        ...payload,
        savedAt,
      })
    );
    return savedAt;
  } catch {
    return null;
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

export async function loadRemoteListingDraft(token) {
  if (!token) return null;

  try {
    const res = await api.getListingDraft(token);
    return normalizeDraft(res?.draft);
  } catch {
    return null;
  }
}

export async function saveRemoteListingDraft(token, payload) {
  if (!token || !hasMeaningfulDraft(payload)) return null;

  try {
    const res = await api.saveListingDraftRemote(token, {
      form: payload.form,
      specs: payload.specs,
      geo: payload.geo,
      existingImages: payload.existingImages,
    });
    const draft = normalizeDraft(res?.draft);
    return draft?.savedAt || Date.now();
  } catch {
    return null;
  }
}

export async function clearRemoteListingDraft(token) {
  if (!token) return;

  try {
    await api.clearListingDraftRemote(token);
  } catch {
    // ignore network failures on clear
  }
}

/** Prefer newer of local vs server draft. */
export function pickNewerDraft(localDraft, remoteDraft) {
  const local = normalizeDraft(localDraft);
  const remote = normalizeDraft(remoteDraft);

  if (!local) return remote;
  if (!remote) return local;

  return (remote.savedAt || 0) >= (local.savedAt || 0) ? remote : local;
}
