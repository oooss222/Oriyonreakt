const fs = require("fs");
const path = require("path");
const { pool } = require("../db");

const EMAIL = "shohtel.shop@diyor.local";
const PASSWORD_HASH =
  "$2b$10$CcjfeWNoMyn3LDiTSDAeCutq99SmpzAZ2jgli4wxCGfvGtTVj78jy";
const CATALOG_PATH = path.join(
  __dirname,
  "../../../data/somon-author-777321.json"
);

const RAM_OPTIONS = new Set([2, 3, 4, 6, 8, 12, 16]);
const STORAGE_LABEL = {
  32: "32 GB",
  64: "64 GB",
  128: "128 GB",
  256: "256 GB",
  512: "512 GB",
  1024: "1 TB",
  1: "1 TB",
};

function brandOf(title) {
  if (/^samsung/i.test(title)) return "Samsung";
  if (/^xiaomi/i.test(title)) return "Xiaomi";
  if (/^(honor|huawei honor)/i.test(title)) return "Honor";
  if (/^huawei/i.test(title)) return "Huawei";
  if (/^tecno/i.test(title)) return "Tecno";
  if (/^realme/i.test(title)) return "Realme";
  if (/^infinix/i.test(title)) return "Infinix";
  if (/^itel/i.test(title)) return "Itel";
  return "";
}

function storageOf(item) {
  const source = `${item.storage || ""} ${item.title || ""}`;
  const match = source.match(/(\d+)\s*gb/i);
  if (!match) return "";
  return STORAGE_LABEL[Number(match[1])] || "";
}

function ramOf(title) {
  const compact = String(title || "").replace(/\s/g, "");
  const expanded = compact.match(/(\d+)\+\d+\/(\d+)\/\d+/);
  if (expanded) {
    const ram = Number(expanded[2]);
    const physical = Number(expanded[1]);
    const chosen = RAM_OPTIONS.has(ram) ? ram : physical;
    if (RAM_OPTIONS.has(chosen)) return `${chosen} GB`;
  }

  const pair = compact.match(/(\d+)\/(\d+)gb/i);
  if (pair && RAM_OPTIONS.has(Number(pair[1])) && Number(pair[2]) >= 32) {
    return `${Number(pair[1])} GB`;
  }

  return "";
}

function specsOf(item) {
  const specs = [];
  const brand = brandOf(item.title);
  const storage = storageOf(item);
  const ram = ramOf(item.title);

  if (brand) specs.push({ name: "Производитель", value: brand });
  if (storage) specs.push({ name: "Память", value: storage });
  if (ram) specs.push({ name: "Оперативная память", value: ram });
  specs.push({
    name: "Состояние",
    value: /б\/?у/i.test(item.condition || "") ? "Б/у" : "Новый",
  });
  return specs;
}

function descriptionOf(item) {
  const parts = [item.title];
  if (item.storage) parts.push(`Память: ${item.storage}.`);
  parts.push("Состояние: новый.");
  parts.push("Душанбе.");
  if (item.oldPrice) parts.push(`Прежняя цена: ${item.oldPrice} сомони.`);
  return parts.join(" ").slice(0, 1000);
}

async function seedSomonShop() {
  if (process.env.NODE_ENV !== "production") return;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.role', 'system', true)");

    const existing = await client.query(
      `
      SELECT
        u.id,
        (
          SELECT COUNT(*)::int
          FROM listings l
          WHERE l.owner = u.id AND l.status = 'approved'
        ) AS n
      FROM users u
      WHERE u.email = $1
      `,
      [EMAIL]
    );

    if (existing.rows[0] && existing.rows[0].n >= 100) {
      await client.query("COMMIT");
      return;
    }

    if (!fs.existsSync(CATALOG_PATH)) {
      await client.query("ROLLBACK");
      console.error("Somon shop catalog is missing, listings were not seeded");
      return;
    }

    const data = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
    const seller = data.seller || {};
    const listings = Array.isArray(data.listings) ? data.listings : [];
    let userId = existing.rows[0]?.id || null;

    if (!userId) {
      const insertedUser = await client.query(
        `
        INSERT INTO users (
          email,
          password,
          name,
          phone,
          seller_type,
          company_name,
          company_description,
          company_logo,
          company_address,
          company_website,
          company_instagram,
          role,
          email_verified,
          phone_verified,
          trust_level,
          approved_listings_count
        )
        VALUES (
          $1, $2, $3, '', 'company', $3, $4, $5, $6, $7, $7,
          'user', true, false, 'trusted', 0
        )
        RETURNING id
        `,
        [
          EMAIL,
          PASSWORD_HASH,
          seller.name || "Шоҳимардон Магазин Huawei",
          "Магазин смартфонов в Душанбе. Samsung, Xiaomi, Honor, Tecno, Realme, Infinix и Itel. Новые телефоны, гарантия и помощь с выбором.",
          seller.logo || "",
          "Душанбе",
          "https://www.instagram.com/shohtel_tj",
        ]
      );
      userId = insertedUser.rows[0].id;
    }

    let inserted = 0;

    for (let index = 0; index < listings.length; index += 1) {
      const item = listings[index];
      const publicId = Number(item.id);
      if (!Number.isFinite(publicId)) continue;

      const images = (item.images || []).filter((url) =>
        /^https:\/\/cdntj\.somon\.tj\//.test(url)
      );
      const bumpedAt = new Date(Date.now() - index * 1000).toISOString();
      const result = await client.query(
        `
        INSERT INTO listings (
          public_id,
          title,
          price,
          description,
          location,
          cat,
          subcategory,
          images,
          specs,
          owner,
          status,
          moderated_at,
          bumped_at,
          price_num,
          created_at,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, 'phones', 'Мобильные телефоны',
          $6::jsonb, $7::jsonb, $8, 'approved', now(), $9, $10, $9, $9
        )
        ON CONFLICT (public_id) DO NOTHING
        RETURNING id
        `,
        [
          publicId,
          String(item.title || "").trim().slice(0, 80),
          String(item.price ?? ""),
          descriptionOf(item),
          item.city || "Душанбе",
          JSON.stringify(images),
          JSON.stringify(specsOf(item)),
          userId,
          bumpedAt,
          item.price,
        ]
      );

      if (result.rows[0]) inserted += 1;
    }

    await client.query(
      `
      UPDATE users
      SET approved_listings_count = (
        SELECT COUNT(*)::int FROM listings WHERE owner = $1 AND status = 'approved'
      ),
      trust_level = 'trusted',
      updated_at = now()
      WHERE id = $1
      `,
      [userId]
    );

    await client.query("COMMIT");
    console.log(`Seeded somon shop listings: ${inserted}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { seedSomonShop };
