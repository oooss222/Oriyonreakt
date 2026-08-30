import { getComparePath } from "./compareConfig";
import { getEntryKey } from "./compareListings";

function toBase64Url(value) {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const padded = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

/**
 * Compact share payload: Oriyon ids + external URLs only (re-import on open).
 */
export function buildSharePayload(cat, entries = []) {
  const payload = { v: 1, c: cat, o: [], e: [] };

  for (const entry of entries) {
    if (entry.source === "oriyon" && entry.id) {
      payload.o.push(String(entry.id));
    } else if (entry.source === "external" && entry.url) {
      payload.e.push({
        p: String(entry.platform || "other"),
        u: String(entry.url),
      });
    }
  }

  return payload;
}

export function encodeCompareShare(cat, entries = []) {
  return toBase64Url(buildSharePayload(cat, entries));
}

export function decodeCompareShare(token) {
  try {
    const payload = fromBase64Url(token);
    if (!payload || payload.v !== 1 || !payload.c) return null;

    const entries = [];
    for (const id of payload.o || []) {
      if (!id) continue;
      entries.push({ source: "oriyon", id: String(id), cat: payload.c });
    }
    for (const row of payload.e || []) {
      if (!row?.u) continue;
      entries.push({
        source: "external",
        key: `share_${getEntryKey({ source: "external", key: row.u }) || Date.now()}`,
        cat: payload.c,
        platform: String(row.p || "other"),
        url: String(row.u),
        fetchedAt: "",
        snapshot: { title: "", price: "", location: "", image: "", specs: [] },
        _needsImport: true,
      });
    }

    return { cat: payload.c, entries };
  } catch {
    return null;
  }
}

export function buildCompareShareUrl(cat, entries = [], origin = "") {
  const path = getComparePath(cat);
  const token = encodeCompareShare(cat, entries);
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}${path}?share=${encodeURIComponent(token)}`;
}

export function buildTelegramShareUrl(url, text = "") {
  const params = new URLSearchParams({
    url,
    text: text || "Сравнение объявлений на Oriyon.store",
  });
  return `https://t.me/share/url?${params.toString()}`;
}

export async function shareCompareLink({ url, title, t }) {
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title, url });
      return { ok: true, method: "native" };
    }
  } catch {
    /* cancelled */
    return { ok: false, method: "cancelled" };
  }

  try {
    await navigator.clipboard.writeText(url);
    return { ok: true, method: "clipboard" };
  } catch {
    return { ok: false, method: "failed" };
  }
}
