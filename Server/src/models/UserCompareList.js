const { query } = require("../db");

const SUPPORTED = [
  "realestate",
  "transport",
  "phones",
  "electronics",
  "computers",
  "furniture",
];

function normalizeCat(cat) {
  const key = String(cat || "").trim();
  return SUPPORTED.includes(key) ? key : null;
}

function sanitizeEntries(entries = []) {
  if (!Array.isArray(entries)) return [];

  const seen = new Set();
  const next = [];

  for (const raw of entries) {
    if (!raw || typeof raw !== "object") continue;

    if (raw.source === "oriyon" && raw.id) {
      const id = String(raw.id);
      if (seen.has(id)) continue;
      seen.add(id);
      next.push({ source: "oriyon", id, cat: raw.cat || "" });
    } else if (raw.source === "external" && (raw.key || raw.url)) {
      const key = String(raw.key || raw.url);
      if (seen.has(key)) continue;
      seen.add(key);
      next.push({
        source: "external",
        key: String(raw.key || `ext_${next.length}`),
        cat: raw.cat || "",
        platform: String(raw.platform || "other"),
        url: String(raw.url || "").trim(),
        fetchedAt: raw.fetchedAt || new Date().toISOString(),
        snapshot:
          raw.snapshot && typeof raw.snapshot === "object" ? raw.snapshot : {},
      });
    }

    if (next.length >= 4) break;
  }

  return next;
}

class UserCompareList {
  static async getAll(userId) {
    const result = await query(
      `
      SELECT cat, entries, updated_at
      FROM user_compare_lists
      WHERE user_id = $1
      `,
      [userId]
    );

    const buckets = {};
    for (const row of result.rows) {
      buckets[row.cat] = {
        entries: sanitizeEntries(row.entries),
        updatedAt: row.updated_at,
      };
    }
    return buckets;
  }

  static async getByCat(userId, cat) {
    const key = normalizeCat(cat);
    if (!key) return { entries: [], updatedAt: null };

    const result = await query(
      `
      SELECT entries, updated_at
      FROM user_compare_lists
      WHERE user_id = $1 AND cat = $2
      `,
      [userId, key]
    );

    const row = result.rows[0];
    if (!row) return { entries: [], updatedAt: null, cat: key };

    return {
      cat: key,
      entries: sanitizeEntries(row.entries),
      updatedAt: row.updated_at,
    };
  }

  static async upsert(userId, cat, entries = []) {
    const key = normalizeCat(cat);
    if (!key) throw new Error("INVALID_CAT");

    const cleaned = sanitizeEntries(entries).map((entry) => ({
      ...entry,
      cat: key,
    }));

    const result = await query(
      `
      INSERT INTO user_compare_lists (user_id, cat, entries, updated_at)
      VALUES ($1, $2, $3::jsonb, now())
      ON CONFLICT (user_id, cat)
      DO UPDATE SET
        entries = EXCLUDED.entries,
        updated_at = now()
      RETURNING entries, updated_at
      `,
      [userId, key, JSON.stringify(cleaned)]
    );

    const row = result.rows[0];
    return {
      cat: key,
      entries: sanitizeEntries(row.entries),
      updatedAt: row.updated_at,
    };
  }
}

module.exports = UserCompareList;
