const { query } = require("../db");

const MAX_IMAGES = 12;
const MAX_TITLE = 120;
const MAX_DESC = 5000;

function sanitizeImages(images = []) {
  if (!Array.isArray(images)) return [];

  return images
    .map((img) => {
      if (!img) return null;
      if (typeof img === "string") {
        const url = img.trim();
        return url ? { url, alt: "" } : null;
      }
      const url = String(img.url || img.src || "").trim();
      if (!url) return null;
      return {
        url,
        alt: String(img.alt || "").slice(0, 200),
      };
    })
    .filter(Boolean)
    .slice(0, MAX_IMAGES);
}

function sanitizeSpecs(specs = []) {
  if (!Array.isArray(specs)) return [];

  return specs
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const name = String(row.name || "").trim();
      if (!name) return null;
      return {
        name: name.slice(0, 80),
        value: String(row.value ?? "").slice(0, 200),
        locked: Boolean(row.locked),
      };
    })
    .filter(Boolean)
    .slice(0, 40);
}

function sanitizeGeo(geo) {
  if (!geo || typeof geo !== "object") return null;
  const lat = Number(geo.lat);
  const lng = Number(geo.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function sanitizePayload(raw = {}) {
  const formIn = raw.form && typeof raw.form === "object" ? raw.form : {};

  const form = {
    title: String(formIn.title || "").slice(0, MAX_TITLE),
    price: String(formIn.price || "").slice(0, 40),
    location: String(formIn.location || "").slice(0, 80),
    cat: String(formIn.cat || "").slice(0, 40),
    subcategory: String(formIn.subcategory || "").slice(0, 80),
    description: String(formIn.description || "").slice(0, MAX_DESC),
  };

  return {
    form,
    specs: sanitizeSpecs(raw.specs),
    geo: sanitizeGeo(raw.geo),
    existingImages: sanitizeImages(raw.existingImages),
  };
}

function hasMeaningfulPayload(payload) {
  if (!payload?.form) return false;
  const { form, specs = [], existingImages = [] } = payload;
  if (form.title?.trim()) return true;
  if (form.description?.trim()) return true;
  if (String(form.price || "").replace(/\D/g, "")) return true;
  if (existingImages.length > 0) return true;
  return specs.some((row) => String(row?.value || "").trim());
}

class ListingDraft {
  static async get(userId) {
    const result = await query(
      `
      SELECT payload, updated_at
      FROM listing_drafts
      WHERE user_id = $1
      `,
      [userId]
    );

    const row = result.rows[0];
    if (!row) return null;

    const payload = sanitizePayload(row.payload || {});
    if (!hasMeaningfulPayload(payload)) return null;

    const updatedAt = row.updated_at
      ? new Date(row.updated_at).getTime()
      : Date.now();

    return {
      ...payload,
      savedAt: updatedAt,
      updatedAt: row.updated_at,
    };
  }

  static async upsert(userId, rawPayload = {}) {
    const payload = sanitizePayload(rawPayload);

    if (!hasMeaningfulPayload(payload)) {
      await ListingDraft.clear(userId);
      return null;
    }

    const result = await query(
      `
      INSERT INTO listing_drafts (user_id, payload, updated_at)
      VALUES ($1, $2::jsonb, now())
      ON CONFLICT (user_id)
      DO UPDATE SET
        payload = EXCLUDED.payload,
        updated_at = now()
      RETURNING payload, updated_at
      `,
      [userId, JSON.stringify(payload)]
    );

    const row = result.rows[0];
    const updatedAt = row.updated_at
      ? new Date(row.updated_at).getTime()
      : Date.now();

    return {
      ...sanitizePayload(row.payload || payload),
      savedAt: updatedAt,
      updatedAt: row.updated_at,
    };
  }

  static async clear(userId) {
    await query(`DELETE FROM listing_drafts WHERE user_id = $1`, [userId]);
    return true;
  }
}

module.exports = ListingDraft;
