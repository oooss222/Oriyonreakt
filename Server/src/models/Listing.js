const { query, mapListing } = require("../db");

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const n = Number(String(value).replace(",", "."));

  return Number.isFinite(n) ? n : null;
}

const REGION_CITIES = {
  Душанбе: ["Душанбе", "Вахдат", "Турсунзаде", "Рогун"],
  "Согдийская область": ["Худжанд", "Истаравшан", "Исфара", "Пенджикент"],
  "Хатлонская область": ["Бохтар", "Куляб"],
  ГБАО: ["Хорог"],
  РРП: ["Душанбе", "Турсунзаде", "Вахдат"],
};

const PROMOTION_ORDER =
  "(vip_until > now()) DESC, (top_until > now()) DESC";

function buildListingOrderBy(sort, priceExpr) {
  if (sort === "old") {
    return "created_at ASC";
  }

  if (sort === "price_asc") {
    return `${PROMOTION_ORDER}, ${priceExpr} ASC NULLS LAST, created_at DESC`;
  }

  if (sort === "price_desc") {
    return `${PROMOTION_ORDER}, ${priceExpr} DESC NULLS LAST, created_at DESC`;
  }

  if (sort === "views_desc") {
    return `${PROMOTION_ORDER}, COALESCE(views, 0) DESC, created_at DESC`;
  }

  return `${PROMOTION_ORDER}, COALESCE(bumped_at, created_at) DESC, created_at DESC`;
}

function buildListingFilters({
  cat,
  subcategory,
  search,
  status = "approved",
  priceFrom,
  priceTo,
  specs,
  location,
  region,
  owner,
} = {}) {
  const conditions = [];
  const values = [];

  const minPrice = toNumberOrNull(priceFrom);
  const maxPrice = toNumberOrNull(priceTo);

  const priceExpr = `
    NULLIF(
      replace(
        regexp_replace(price, '[^0-9,.-]', '', 'g'),
        ',',
        '.'
      ),
      ''
    )::numeric
  `;

  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  if (owner) {
    values.push(owner);
    conditions.push(`owner = $${values.length}`);
  }

  if (cat) {
    values.push(cat);
    conditions.push(`cat = $${values.length}`);
  }

  if (subcategory) {
    values.push(String(subcategory).trim());
    conditions.push(`TRIM(subcategory) = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`
      (
        title ILIKE $${values.length}
        OR description ILIKE $${values.length}
        OR location ILIKE $${values.length}
        OR cat ILIKE $${values.length}
        OR subcategory ILIKE $${values.length}
        OR specs::text ILIKE $${values.length}
      )
    `);
  }

  if (minPrice !== null) {
    values.push(minPrice);
    conditions.push(`${priceExpr} >= $${values.length}`);
  }

  if (maxPrice !== null) {
    values.push(maxPrice);
    conditions.push(`${priceExpr} <= $${values.length}`);
  }

  if (location) {
    values.push(String(location).trim());
    conditions.push(`location = $${values.length}`);
  } else if (region && REGION_CITIES[region]) {
    values.push(REGION_CITIES[region]);
    conditions.push(`location = ANY($${values.length})`);
  }

  if (specs && typeof specs === "object") {
    for (const [name, value] of Object.entries(specs)) {
      const specName = String(name || "").trim();
      const specValue = String(value || "").trim();

      if (!specName || !specValue) continue;

      values.push(specName);
      const nameIdx = values.length;
      values.push(specValue);
      const valueIdx = values.length;

      conditions.push(`
        EXISTS (
          SELECT 1
          FROM jsonb_array_elements(specs) AS spec
          WHERE spec->>'name' = $${nameIdx}
            AND spec->>'value' = $${valueIdx}
        )
      `);
    }
  }

  return { conditions, values, priceExpr };
}

class ListingModel {
  static async create(data) {
  const result = await query(
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
      rejection_reason
    )
    VALUES (
      FLOOR(10000000 + RANDOM() * 90000000),
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7::jsonb,
      $8::jsonb,
      $9,
      'pending',
      ''
    )
    RETURNING *
    `,
    [
      data.title,
      data.price || "",
      data.description || "",
      data.location || "",
      data.cat,
      data.subcategory || "",
      JSON.stringify(data.images || []),
      JSON.stringify(data.specs || []),
      data.owner,
    ]
  );

  return mapListing(result.rows[0]);
}

  static async findAll({
    cat,
    subcategory,
    search,
    status = "approved",
    priceFrom,
    priceTo,
    specs,
    location,
    region,
    owner,
    sort = "new",
    limit = 50,
    offset = 0,
  } = {}) {
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const { conditions, values, priceExpr } = buildListingFilters({
      cat,
      subcategory,
      search,
      status,
      priceFrom,
      priceTo,
      specs,
      location,
      region,
      owner,
    });

    let orderBy = buildListingOrderBy(sort, priceExpr);

    let sql = `
      SELECT *
      FROM listings
    `;

    if (conditions.length) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    values.push(safeLimit);
    sql += ` ORDER BY ${orderBy} LIMIT $${values.length}`;

    values.push(safeOffset);
    sql += ` OFFSET $${values.length}`;

    const result = await query(sql, values);

    return result.rows.map(mapListing);
  }

  static async count({
    cat,
    subcategory,
    search,
    status = "approved",
    priceFrom,
    priceTo,
    specs,
    location,
    region,
    owner,
  } = {}) {
    const { conditions, values } = buildListingFilters({
      cat,
      subcategory,
      search,
      status,
      priceFrom,
      priceTo,
      specs,
      location,
      region,
      owner,
    });

    let sql = `
      SELECT COUNT(*)::int AS count
      FROM listings
    `;

    if (conditions.length) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    const result = await query(sql, values);

    return Number(result.rows[0]?.count || 0);
  }

  static async statsByCategory(cat, status = "approved") {
    const totalResult = await query(
      `
      SELECT COUNT(*)::int AS count
      FROM listings
      WHERE cat = $1 AND status = $2
      `,
      [cat, status]
    );

    const subResult = await query(
      `
      SELECT subcategory, COUNT(*)::int AS count
      FROM listings
      WHERE cat = $1 AND status = $2 AND COALESCE(subcategory, '') <> ''
      GROUP BY subcategory
      `,
      [cat, status]
    );

    const bySubcategory = {};

    for (const row of subResult.rows) {
      bySubcategory[row.subcategory] = row.count;
    }

    return {
      total: Number(totalResult.rows[0]?.count || 0),
      bySubcategory,
    };
  }

 static async findById(id) {
  const result = await query(
    `
    SELECT
      l.*,
      u.name AS seller_name,
      u.phone AS seller_phone

    FROM listings l
    LEFT JOIN users u ON u.id = l.owner
    WHERE l.id = $1
    LIMIT 1
    `,
    [id]
  );

  const listing = mapListing(result.rows[0]);

  if (!listing) return null;

  return {
    ...listing,
    sellerName: result.rows[0].seller_name || "",
    phone: result.rows[0].seller_phone || ""

  };
}

  static async incrementViews(id) {
    const result = await query(
      `
      UPDATE listings
      SET views = COALESCE(views, 0) + 1
      WHERE id = $1
      RETURNING views
      `,
      [id]
    );

    return Number(result.rows[0]?.views || 0);
  }

  static async update(id, ownerId, data) {
    const existing = await this.findById(id);

    if (!existing) return null;

    if (existing.owner !== ownerId) {
      throw new Error("FORBIDDEN");
    }

    const result = await query(
      `
      UPDATE listings
      SET
        title = COALESCE($3, title),
        price = COALESCE($4, price),
        description = COALESCE($5, description),
        location = COALESCE($6, location),
        cat = COALESCE($7, cat),
        subcategory = COALESCE($8, subcategory),
        images = COALESCE($9::jsonb, images),
        specs = COALESCE($10::jsonb, specs),
        status = 'pending',
        rejection_reason = '',
        moderated_by = NULL,
        moderated_at = NULL,
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [
        id,
        ownerId,
        data.title,
        data.price,
        data.description,
        data.location,
        data.cat,
        data.subcategory,
        data.images ? JSON.stringify(data.images) : null,
        data.specs ? JSON.stringify(data.specs) : null,
      ]
    );

    return mapListing(result.rows[0]);
  }

  static async adminDelete(id) {
  const result = await query(
    `
    DELETE FROM listings
    WHERE id = $1
    RETURNING *
    `,
    [id]
  );

  return mapListing(result.rows[0]);
}

  static async adminSetStatus(id, status) {
    const allowed = new Set([
      "pending",
      "approved",
      "rejected",
      "sold",
      "archived",
    ]);

    if (!allowed.has(status)) {
      throw new Error("INVALID_STATUS");
    }

    const result = await query(
      `
      UPDATE listings
      SET
        status = $2,
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id, status]
    );

    return mapListing(result.rows[0]);
  }

  static async findForAdmin({
    status,
    search,
    cat,
    owner,
    limit = 50,
    offset = 0,
  } = {}) {
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);
    const conditions = [];
    const values = [];

    if (status && status !== "all") {
      values.push(status);
      conditions.push(`l.status = $${values.length}`);
    }

    if (cat) {
      values.push(cat);
      conditions.push(`l.cat = $${values.length}`);
    }

    if (owner) {
      values.push(owner);
      conditions.push(`l.owner = $${values.length}`);
    }

    if (search) {
      values.push(`%${String(search).trim()}%`);
      conditions.push(`
        (
          l.title ILIKE $${values.length}
          OR l.description ILIKE $${values.length}
          OR l.location ILIKE $${values.length}
          OR u.name ILIKE $${values.length}
          OR u.email ILIKE $${values.length}
        )
      `);
    }

    const whereSql = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    values.push(safeLimit);
    const limitIdx = values.length;
    values.push(safeOffset);
    const offsetIdx = values.length;

    const result = await query(
      `
      SELECT
        l.*,
        u.name AS owner_name,
        u.email AS owner_email
      FROM listings l
      LEFT JOIN users u ON u.id = l.owner
      ${whereSql}
      ORDER BY l.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `,
      values
    );

    return result.rows.map((row) => ({
      ...mapListing(row),
      ownerName: row.owner_name || "",
      ownerEmail: row.owner_email || "",
    }));
  }

  static async deleteById(id) {
  await query(
    `
    DELETE FROM listings
    WHERE id = $1
    `,
    [id]
  );

  return true;
}

   static async delete(id, ownerId) {
    const listing = await this.findById(id);

    if (!listing) return false;

    if (listing.owner !== ownerId) {
      throw new Error("FORBIDDEN");
    }

    await query(
      `
      DELETE FROM listings
      WHERE id = $1
      `,
      [id]
    );

    return true;
  }

  static async findByOwner(ownerId) {
    const result = await query(
      `
      SELECT *
      FROM listings
      WHERE owner = $1
      ORDER BY created_at DESC
      `,
      [ownerId]
    );

    return result.rows.map(mapListing);
  }

  static async findForModeration({
    status = "pending",
    limit = 100,
    offset = 0,
  } = {}) {
    const result = await query(
      `
      SELECT *
      FROM listings
      WHERE status = $1
      ORDER BY created_at ASC
      LIMIT $2 OFFSET $3
      `,
      [status, limit, offset]
    );

    return result.rows.map(mapListing);
  }

  static async approve(id, moderatorId) {
    const result = await query(
      `
      UPDATE listings
      SET
        status = 'approved',
        rejection_reason = '',
        moderated_by = $2,
        moderated_at = now(),
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id, moderatorId]
    );

    return mapListing(result.rows[0]);
  }

  static async reject(id, moderatorId, reason) {
    const result = await query(
      `
      UPDATE listings
      SET
        status = 'rejected',
        rejection_reason = $3,
        moderated_by = $2,
        moderated_at = now(),
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id, moderatorId, reason]
    );

    return mapListing(result.rows[0]);
  }

  static async updateOwnerStatus(id, ownerId, status) {
    const allowed = new Set(["approved", "sold", "archived"]);

    if (!allowed.has(status)) {
      throw new Error("INVALID_STATUS");
    }

    const existing = await this.findById(id);

    if (!existing) return null;

    if (String(existing.owner) !== String(ownerId)) {
      throw new Error("FORBIDDEN");
    }

    const result = await query(
      `
      UPDATE listings
      SET
        status = $3,
        updated_at = now()
      WHERE id = $1 AND owner = $2
      RETURNING *
      `,
      [id, ownerId, status]
    );

    return mapListing(result.rows[0]);
  }

  static async promote(id, userId, type) {
    const normalizedType = String(type || "").trim().toLowerCase();

    if (!["vip", "top", "bump"].includes(normalizedType)) {
      throw new Error("INVALID_TYPE");
    }

    const listing = await this.findById(id);

    if (!listing) {
      return null;
    }

    if (String(listing.owner) !== String(userId)) {
      throw new Error("FORBIDDEN");
    }

    if (listing.status !== "approved") {
      throw new Error("NOT_APPROVED");
    }

    const SiteSettings = require("./SiteSettings");
    const User = require("./User");
    const settings = await SiteSettings.get();
    const safeTitle = String(listing.title || "объявление").slice(0, 120);

    if (normalizedType === "bump") {
      const bumpPrice = Math.max(0, Number(settings.bumpPrice) || 0);

      if (bumpPrice > 0) {
        await User.chargeWallet(userId, bumpPrice, {
          description: `Обновление даты: ${safeTitle}`,
        });
      }

      const bumpResult = await query(
        `
        UPDATE listings
        SET
          bumped_at = now(),
          updated_at = now()
        WHERE id = $1 AND owner = $2
        RETURNING *
        `,
        [id, userId]
      );

      return mapListing(bumpResult.rows[0]);
    }

    const isVip = normalizedType === "vip";
    const price = isVip ? settings.vipPrice : settings.topPrice;
    const days = isVip ? 7 : 3;
    const now = new Date();
    const msPerDay = 86400000;

    const currentVipUntil =
      listing.vipUntil && new Date(listing.vipUntil) > now
        ? new Date(listing.vipUntil)
        : null;
    const currentTopUntil =
      listing.topUntil && new Date(listing.topUntil) > now
        ? new Date(listing.topUntil)
        : null;

    const nextVipUntil = isVip
      ? new Date((currentVipUntil || now).getTime() + days * msPerDay)
      : currentVipUntil;
    const nextTopUntil = !isVip
      ? new Date((currentTopUntil || now).getTime() + days * msPerDay)
      : currentTopUntil;

    await User.chargeWallet(userId, price, {
      description: isVip
        ? `VIP продвижение: ${safeTitle}`
        : `TOP продвижение: ${safeTitle}`,
    });

    const result = await query(
      `
      UPDATE listings
      SET
        vip_until = COALESCE($3, vip_until),
        top_until = COALESCE($4, top_until),
        bumped_at = now(),
        updated_at = now()
      WHERE id = $1 AND owner = $2
      RETURNING *
      `,
      [id, userId, nextVipUntil, nextTopUntil]
    );

    return mapListing(result.rows[0]);
  }

  static async suggest(search = "", limit = 8) {
    const text = String(search || "").trim();

    if (text.length < 2) {
      return [];
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 20);

    const result = await query(
      `
      SELECT id, title, price, images, location, cat, subcategory, views,
        vip_until, top_until, bumped_at, created_at
      FROM listings
      WHERE status = 'approved'
        AND title ILIKE $1
      ORDER BY ${PROMOTION_ORDER}, COALESCE(bumped_at, created_at) DESC, created_at DESC
      LIMIT $2
      `,
      [`%${text}%`, safeLimit]
    );

    return result.rows.map(mapListing);
  }
}

module.exports = ListingModel;