const { query, mapListing, LISTING_STATUSES } = require("../db");
const { extractRealEstateMeta } = require("../lib/realEstateMeta");
const { parsePriceValue } = require("../lib/priceValue");
const {
  assertEnumValue,
  bindLike,
  safeLimit,
  safeOffset,
} = require("../lib/sqlSafety");

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const n = Number(String(value).replace(",", "."));

  return Number.isFinite(n) ? n : null;
}

const REGION_CITIES = {
  Душанбе: ["Душанбе"],
  Худжанд: ["Худжанд"],
};

// Columns are table-qualified because these clauses run against queries that
// join users, where created_at would otherwise be ambiguous.
const PROMOTION_ORDER =
  "(listings.vip_until > now()) DESC, (listings.top_until > now()) DESC";

// Selects the owner columns the listing cards need. A join keeps this to one
// lookup per row instead of one per column.
const OWNER_JOIN_SELECT = `
        owner_user.seller_type AS owner_seller_type,
        owner_user.business_verified AS owner_business_verified,
        owner_user.company_name AS owner_company_name`;

const OWNER_JOIN = `
      LEFT JOIN users owner_user ON owner_user.id = listings.owner`;

function buildListingOrderBy(sort, priceExpr) {
  if (sort === "old") {
    return "listings.created_at ASC";
  }

  if (sort === "price_asc") {
    return `${PROMOTION_ORDER}, ${priceExpr} ASC NULLS LAST, listings.created_at DESC`;
  }

  if (sort === "price_desc") {
    return `${PROMOTION_ORDER}, ${priceExpr} DESC NULLS LAST, listings.created_at DESC`;
  }

  if (sort === "views_desc") {
    return `${PROMOTION_ORDER}, COALESCE(listings.views, 0) DESC, listings.created_at DESC`;
  }

  if (sort === "price_per_sqm_asc") {
    return `${PROMOTION_ORDER}, listings.re_price_per_sqm ASC NULLS LAST, listings.created_at DESC`;
  }

  if (sort === "price_per_sqm_desc") {
    return `${PROMOTION_ORDER}, listings.re_price_per_sqm DESC NULLS LAST, listings.created_at DESC`;
  }

  return `${PROMOTION_ORDER}, COALESCE(listings.bumped_at, listings.created_at) DESC, listings.created_at DESC`;
}

function parseGuestCapacity(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const digits = raw.replace(/[^\d]/g, "");
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const MULTI_VALUE_AND_SPECS = new Set(["Удобства", "Техника"]);

function appendSpecContainsValue(conditions, values, specName, part) {
  values.push(specName);
  const nameIdx = values.length;
  values.push(part);
  const partIdx = values.length;

  conditions.push(`
    EXISTS (
      SELECT 1
      FROM jsonb_array_elements(specs) AS spec
      WHERE spec->>'name' = $${nameIdx}
        AND (
          spec->>'value' = $${partIdx}
          OR spec->>'value' LIKE $${partIdx} || ',%'
          OR spec->>'value' LIKE '%,' || $${partIdx} || ',%'
          OR spec->>'value' LIKE '%,' || $${partIdx}
        )
    )
  `);
}

function appendSpecMatch(conditions, values, specName, specValue) {
  const parts = String(specValue || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!parts.length) return;

  if (MULTI_VALUE_AND_SPECS.has(specName)) {
    parts.forEach((part) => {
      appendSpecContainsValue(conditions, values, specName, part);
    });
    return;
  }

  values.push(specName);
  const nameIdx = values.length;

  if (parts.length <= 1) {
    values.push(parts[0]);
    const valueIdx = values.length;

    conditions.push(`
        EXISTS (
          SELECT 1
          FROM jsonb_array_elements(specs) AS spec
          WHERE spec->>'name' = $${nameIdx}
            AND spec->>'value' = $${valueIdx}
        )
      `);
    return;
  }

  values.push(parts);
  const valueIdx = values.length;

  conditions.push(`
        EXISTS (
          SELECT 1
          FROM jsonb_array_elements(specs) AS spec
          WHERE spec->>'name' = $${nameIdx}
            AND spec->>'value' = ANY($${valueIdx})
        )
      `);
}

function appendSpecNumericRange(conditions, values, specName, fromValue, toValue) {
  const min = toNumberOrNull(fromValue);
  const max = toNumberOrNull(toValue);

  if (min === null && max === null) return;

  values.push(specName);
  const nameIdx = values.length;

  const parts = [
    `
    EXISTS (
      SELECT 1
      FROM jsonb_array_elements(specs) AS spec
      WHERE spec->>'name' = $${nameIdx}
    `,
  ];

  if (min !== null) {
    values.push(min);
    parts.push(`
        AND CAST(
          NULLIF(regexp_replace(spec->>'value', '[^0-9]', '', 'g'), '')
          AS INTEGER
        ) >= $${values.length}
    `);
  }

  if (max !== null) {
    values.push(max);
    parts.push(`
        AND CAST(
          NULLIF(regexp_replace(spec->>'value', '[^0-9]', '', 'g'), '')
          AS INTEGER
        ) <= $${values.length}
    `);
  }

  parts.push(`
    )
  `);

  conditions.push(parts.join(""));
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
  sellerType,
  areaFrom,
  areaTo,
  floorFrom,
  floorTo,
  floorNotFirst,
  floorNotLast,
  pricePerSqmFrom,
  pricePerSqmTo,
  guestsMin,
  yearFrom,
  yearTo,
  mileageFrom,
  mileageTo,
  onlyWithPhotos,
  verifiedOnly,
} = {}) {
  const conditions = [];
  const values = [];

  const minPrice = toNumberOrNull(priceFrom);
  const maxPrice = toNumberOrNull(priceTo);

  // Written by the app on every insert and update, so the range filter and the
  // price sort can use an index instead of casting text per row.
  const priceExpr = "listings.price_num";

  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  if (owner) {
    values.push(owner);
    conditions.push(`owner = $${values.length}`);
  }

  if (sellerType === "company" || sellerType === "private") {
    values.push(sellerType);
    conditions.push(`
      owner IN (
        SELECT id
        FROM users
        WHERE seller_type = $${values.length}
          AND is_blocked = false
      )
    `);
  }

  if (cat) {
    values.push(cat);
    conditions.push(`cat = $${values.length}`);
  }

  if (subcategory) {
    // Values are trimmed on write and existing rows are normalised at startup,
    // so this compares the raw column and can use idx_listings_subcategory.
    values.push(String(subcategory).trim());
    conditions.push(`subcategory = $${values.length}`);
  }

  if (search) {
    const idx = bindLike(values, search);

    conditions.push(`
      (
        title ILIKE $${idx} ESCAPE '\\'
        OR description ILIKE $${idx} ESCAPE '\\'
        OR location ILIKE $${idx} ESCAPE '\\'
        OR cat ILIKE $${idx} ESCAPE '\\'
        OR subcategory ILIKE $${idx} ESCAPE '\\'
        OR specs::text ILIKE $${idx} ESCAPE '\\'
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

      appendSpecMatch(conditions, values, specName, specValue);
    }
  }

  appendSpecNumericRange(conditions, values, "Год", yearFrom, yearTo);
  appendSpecNumericRange(conditions, values, "Пробег", mileageFrom, mileageTo);

  const minArea = toNumberOrNull(areaFrom);
  const maxArea = toNumberOrNull(areaTo);
  const minFloor = toNumberOrNull(floorFrom);
  const maxFloor = toNumberOrNull(floorTo);

  if (minArea !== null) {
    values.push(minArea);
    conditions.push(`re_area_sqm >= $${values.length}`);
  }

  if (maxArea !== null) {
    values.push(maxArea);
    conditions.push(`re_area_sqm <= $${values.length}`);
  }

  if (minFloor !== null) {
    values.push(minFloor);
    conditions.push(`re_floor >= $${values.length}`);
  }

  if (maxFloor !== null) {
    values.push(maxFloor);
    conditions.push(`re_floor <= $${values.length}`);
  }

  if (floorNotFirst) {
    conditions.push(`(re_floor IS NULL OR re_floor > 1)`);
  }

  if (floorNotLast) {
    conditions.push(`
      (
        re_floor IS NULL
        OR re_floors_total IS NULL
        OR re_floor < re_floors_total
      )
    `);
  }

  const minPricePerSqm = toNumberOrNull(pricePerSqmFrom);
  const maxPricePerSqm = toNumberOrNull(pricePerSqmTo);

  if (minPricePerSqm !== null) {
    values.push(minPricePerSqm);
    conditions.push(`re_price_per_sqm >= $${values.length}`);
  }

  if (maxPricePerSqm !== null) {
    values.push(maxPricePerSqm);
    conditions.push(`re_price_per_sqm <= $${values.length}`);
  }

  const minGuests = parseGuestCapacity(guestsMin);
  if (minGuests !== null) {
    values.push(minGuests);
    conditions.push(`
      (
        NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements(specs) AS guest_spec
          WHERE guest_spec->>'name' = 'Гостей'
            AND NULLIF(TRIM(guest_spec->>'value'), '') IS NOT NULL
        )
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements(specs) AS guest_spec
          WHERE guest_spec->>'name' = 'Гостей'
            AND CAST(
              NULLIF(
                regexp_replace(guest_spec->>'value', '[^0-9]', '', 'g'),
                ''
              ) AS INTEGER
            ) >= $${values.length}
        )
      )
    `);
  }

  if (onlyWithPhotos) {
    conditions.push(`COALESCE(jsonb_array_length(images), 0) > 0`);
  }

  if (verifiedOnly) {
    conditions.push(`
      owner IN (
        SELECT id
        FROM users
        WHERE seller_type = 'company'
          AND business_verified = true
          AND is_blocked = false
      )
    `);
  }

  return { conditions, values, priceExpr };
}

class ListingModel {
  static async create(data) {
    const reMeta =
      data.cat === "realestate"
        ? extractRealEstateMeta({
            specs: data.specs || [],
            price: data.price || "",
            location: data.location || "",
            lat: data.lat,
            lng: data.lng,
          })
        : {};

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
      rejection_reason,
      re_deal_type,
      re_rooms,
      re_area_sqm,
      re_floor,
      re_floors_total,
      re_district,
      re_lat,
      re_lng,
      re_price_per_sqm,
      price_num
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
      '',
      $10,
      $11,
      $12,
      $13,
      $14,
      $15,
      $16,
      $17,
      $18,
      $19
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
        reMeta.re_deal_type ?? null,
        reMeta.re_rooms ?? null,
        reMeta.re_area_sqm ?? null,
        reMeta.re_floor ?? null,
        reMeta.re_floors_total ?? null,
        reMeta.re_district ?? null,
        reMeta.re_lat ?? null,
        reMeta.re_lng ?? null,
        reMeta.re_price_per_sqm ?? null,
        parsePriceValue(data.price),
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
    sellerType,
    areaFrom,
    areaTo,
    floorFrom,
    floorTo,
    floorNotFirst,
    floorNotLast,
    pricePerSqmFrom,
    pricePerSqmTo,
    guestsMin,
    yearFrom,
    yearTo,
    mileageFrom,
    mileageTo,
    onlyWithPhotos,
    verifiedOnly,
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
      sellerType,
      areaFrom,
      areaTo,
      floorFrom,
      floorTo,
      floorNotFirst,
      floorNotLast,
      pricePerSqmFrom,
      pricePerSqmTo,
      guestsMin,
      yearFrom,
      yearTo,
      mileageFrom,
      mileageTo,
      onlyWithPhotos,
      verifiedOnly,
    });

    let orderBy = buildListingOrderBy(sort, priceExpr);

    let sql = `
      SELECT
        listings.*,${OWNER_JOIN_SELECT}
      FROM listings${OWNER_JOIN}
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
    sellerType,
    areaFrom,
    areaTo,
    floorFrom,
    floorTo,
    floorNotFirst,
    floorNotLast,
    pricePerSqmFrom,
    pricePerSqmTo,
    guestsMin,
    yearFrom,
    yearTo,
    mileageFrom,
    mileageTo,
    onlyWithPhotos,
    verifiedOnly,
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
      sellerType,
      areaFrom,
      areaTo,
      floorFrom,
      floorTo,
      floorNotFirst,
      floorNotLast,
      pricePerSqmFrom,
      pricePerSqmTo,
      guestsMin,
      yearFrom,
      yearTo,
      mileageFrom,
      mileageTo,
      onlyWithPhotos,
      verifiedOnly,
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

  static async statsByCategory(cat, status = "approved", location = "") {
    const locationFilter = location ? "AND location = $3" : "";
    const params = location ? [cat, status, location] : [cat, status];

    const totalResult = await query(
      `
      SELECT COUNT(*)::int AS count
      FROM listings
      WHERE cat = $1 AND status = $2 ${locationFilter}
      `,
      params
    );

    const subResult = await query(
      `
      SELECT subcategory, COUNT(*)::int AS count
      FROM listings
      WHERE cat = $1 AND status = $2 ${locationFilter}
        AND COALESCE(subcategory, '') <> ''
      GROUP BY subcategory
      `,
      params
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

  static async marketStats({
    cat,
    location = "",
    subcategory = "",
  } = {}) {
    const conditions = [`status = 'approved'`, `cat = $1`];
    const values = [String(cat || "").trim()];

    if (location) {
      values.push(String(location).trim());
      conditions.push(`location = $${values.length}`);
    }

    if (subcategory) {
      values.push(String(subcategory).trim());
      conditions.push(`subcategory = $${values.length}`);
    }

    const result = await query(
      `
      WITH priced AS (
        SELECT
          price_num,
          re_price_per_sqm
        FROM listings
        WHERE ${conditions.join(" AND ")}
      )
      SELECT
        (SELECT COUNT(*)::int FROM priced WHERE price_num IS NOT NULL AND price_num > 0) AS sample,
        (
          SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY price_num)
          FROM priced
          WHERE price_num IS NOT NULL AND price_num > 0
        ) AS median_price,
        (
          SELECT AVG(price_num)
          FROM priced
          WHERE price_num IS NOT NULL AND price_num > 0
        ) AS avg_price,
        (
          SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY re_price_per_sqm)
          FROM priced
          WHERE re_price_per_sqm IS NOT NULL AND re_price_per_sqm > 0
        ) AS median_price_per_sqm
      `,
      values
    );

    const row = result.rows[0] || {};

    return {
      sample: Number(row.sample || 0),
      medianPrice: row.median_price != null ? Math.round(Number(row.median_price)) : null,
      avgPrice: row.avg_price != null ? Math.round(Number(row.avg_price)) : null,
      medianPricePerSqm:
        row.median_price_per_sqm != null
          ? Math.round(Number(row.median_price_per_sqm))
          : null,
      location: location || "",
      subcategory: subcategory || "",
      cat: String(cat || "").trim(),
    };
  }

  static async findById(id) {
  const result = await query(
    `
    SELECT
      l.*,
      u.name AS seller_name,
      u.phone AS seller_phone,
      u.whatsapp AS seller_whatsapp,
      u.telegram AS seller_telegram,
      u.seller_type AS owner_seller_type,
      u.business_verified AS owner_business_verified,
      u.company_name AS owner_company_name,
      u.company_logo AS owner_company_logo,
      u.company_description AS owner_company_description,
      u.company_website AS owner_company_website

    FROM listings l
    LEFT JOIN users u ON u.id = l.owner
    WHERE l.id = $1
    LIMIT 1
    `,
    [id]
  );

  const listing = mapListing(result.rows[0]);

  if (!listing) return null;

  const row = result.rows[0];

  return {
    ...listing,
    sellerName: row.seller_name || "",
    phone: row.seller_phone || "",
    sellerWhatsapp: row.seller_whatsapp || "",
    sellerTelegram: row.seller_telegram || "",
    ownerCompanyLogo: row.owner_company_logo || "",
    ownerCompanyDescription: row.owner_company_description || "",
    ownerCompanyWebsite: row.owner_company_website || "",
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

    const {
      listingSnapshot,
    } = require("../lib/moderationEngine");
    const previousSnapshot = listingSnapshot(existing);

    const nextCat = data.cat ?? existing.cat;
    const nextSpecs = data.specs ?? existing.specs;
    const nextPrice = data.price ?? existing.price;
    const nextLocation = data.location ?? existing.location;

    const reMeta =
      nextCat === "realestate"
        ? extractRealEstateMeta({
            specs: nextSpecs || [],
            price: nextPrice || "",
            location: nextLocation || "",
            lat: data.lat ?? existing.reLat,
            lng: data.lng ?? existing.reLng,
          })
        : null;

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
        appeal_status = 'none',
        appeal_text = '',
        appeal_at = NULL,
        previous_snapshot = $11::jsonb,
        re_deal_type = COALESCE($12, re_deal_type),
        re_rooms = COALESCE($13, re_rooms),
        re_area_sqm = COALESCE($14, re_area_sqm),
        re_floor = COALESCE($15, re_floor),
        re_floors_total = COALESCE($16, re_floors_total),
        re_district = COALESCE($17, re_district),
        re_lat = COALESCE($18, re_lat),
        re_lng = COALESCE($19, re_lng),
        re_price_per_sqm = COALESCE($20, re_price_per_sqm),
        -- Only rewrite when a new price was supplied; an unparseable price must
        -- clear the numeric mirror rather than leave a stale value behind.
        price_num = CASE WHEN $4::text IS NULL THEN price_num ELSE $21 END,
        updated_at = now()
      WHERE id = $1 AND owner = $2
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
        JSON.stringify(previousSnapshot),
        reMeta?.re_deal_type ?? null,
        reMeta?.re_rooms ?? null,
        reMeta?.re_area_sqm ?? null,
        reMeta?.re_floor ?? null,
        reMeta?.re_floors_total ?? null,
        reMeta?.re_district ?? null,
        reMeta?.re_lat ?? null,
        reMeta?.re_lng ?? null,
        reMeta?.re_price_per_sqm ?? null,
        data.price == null ? null : parsePriceValue(data.price),
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
      const safeStatus = assertEnumValue(status, LISTING_STATUSES, "STATUS");
      values.push(safeStatus);
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
      const idx = bindLike(values, search);

      conditions.push(`
        (
          l.title ILIKE $${idx} ESCAPE '\\'
          OR l.description ILIKE $${idx} ESCAPE '\\'
          OR l.location ILIKE $${idx} ESCAPE '\\'
          OR u.name ILIKE $${idx} ESCAPE '\\'
          OR u.email ILIKE $${idx} ESCAPE '\\'
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

  static async findByOwner(ownerId, { limit = 200 } = {}) {
    const result = await query(
      `
      SELECT *
      FROM listings
      WHERE owner = $1
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [ownerId, Math.min(Math.max(Number(limit) || 200, 1), 500)]
    );

    return result.rows.map(mapListing);
  }

  static mapModerationRow(row) {
    const listing = mapListing(row);
    const {
      computeDiff,
      listingSnapshot,
    } = require("../lib/moderationEngine");

    listing.reportCount = Number(row.report_count || 0);
    listing.ownerTrustLevel = row.owner_trust_level || "new";
    listing.ownerName = row.owner_name || "";
    listing.contentDiff = listing.previousSnapshot
      ? computeDiff(listing.previousSnapshot, listingSnapshot(listing))
      : [];

    return listing;
  }

  static async countPending() {
    const result = await query(
      `
      SELECT COUNT(*)::int AS count
      FROM listings
      WHERE status = 'pending'
      `
    );

    return Number(result.rows[0]?.count || 0);
  }

  static async getModerationStats() {
    const [queueResult, slaResult, rejectResult, appealResult] =
      await Promise.all([
        query(
          `
          SELECT
            COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
            COUNT(*) FILTER (
              WHERE status = 'pending'
                AND created_at < now() - interval '24 hours'
            )::int AS pending_over_24h,
            COUNT(*) FILTER (
              WHERE status = 'pending'
                AND jsonb_array_length(COALESCE(moderation_flags, '[]'::jsonb)) > 0
            )::int AS flagged,
            COUNT(*) FILTER (WHERE appeal_status = 'pending')::int AS appeals_pending
          FROM listings
          `
        ),
        query(
          `
          SELECT
            COALESCE(
              AVG(EXTRACT(EPOCH FROM (moderated_at - created_at)) / 3600),
              0
            ) AS avg_hours
          FROM listings
          WHERE moderated_at IS NOT NULL
            AND moderated_at >= now() - interval '30 days'
          `
        ),
        query(
          `
          SELECT
            COALESCE(NULLIF(cat, ''), 'unknown') AS cat,
            COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected,
            COUNT(*) FILTER (WHERE status = 'approved')::int AS approved
          FROM listings
          WHERE created_at >= now() - interval '30 days'
          GROUP BY 1
          ORDER BY rejected DESC, cat ASC
          LIMIT 12
          `
        ),
        query(
          `
          SELECT COUNT(*)::int AS pending_reports
          FROM listing_reports
          WHERE status = 'pending'
          `
        ),
      ]);

    const queue = queueResult.rows[0] || {};

    return {
      pending: Number(queue.pending || 0),
      pendingOver24h: Number(queue.pending_over_24h || 0),
      flagged: Number(queue.flagged || 0),
      appealsPending: Number(queue.appeals_pending || 0),
      pendingReports: Number(appealResult.rows[0]?.pending_reports || 0),
      avgModerationHours: Number(Number(slaResult.rows[0]?.avg_hours || 0).toFixed(1)),
      byCategory: rejectResult.rows.map((row) => ({
        cat: row.cat,
        rejected: Number(row.rejected || 0),
        approved: Number(row.approved || 0),
      })),
    };
  }

  static async processModeration(listingId, { isUpdate = false, io = null } = {}) {
    const listing = await this.findById(listingId);

    if (!listing) return null;

    const User = require("./User");
    const owner = await User.findById(listing.owner);
    const { evaluateListing } = require("../lib/moderationEngine");
    const {
      notifyModerators,
      notifySellerModerationResult,
    } = require("../lib/moderationNotify");

    const evaluation = await evaluateListing(listing, owner, { isUpdate });
    const flags = evaluation.flags.map((item) => ({
      code: item.code,
      message: item.message,
      severity: item.severity || "medium",
    }));

    if (evaluation.action === "auto_reject") {
      const result = await query(
        `
        UPDATE listings
        SET
          status = 'rejected',
          rejection_reason = $2,
          moderation_flags = $3::jsonb,
          auto_moderation_reason = $4,
          moderated_at = now(),
          updated_at = now()
        WHERE id = $1
        RETURNING *
        `,
        [
          listingId,
          evaluation.reason,
          JSON.stringify(flags),
          evaluation.autoModerationReason || evaluation.reason,
        ]
      );

      const updated = mapListing(result.rows[0]);
      await notifySellerModerationResult(updated, "rejected", evaluation.reason);
      await notifyModerators(io, { type: "auto_reject", listing: updated });
      return updated;
    }

    if (evaluation.action === "auto_approve") {
      const updated = await this.approve(listingId, null);

      await query(
        `
        UPDATE listings
        SET
          moderation_flags = $2::jsonb,
          auto_moderation_reason = $3
        WHERE id = $1
        `,
        [
          listingId,
          JSON.stringify(flags),
          evaluation.autoModerationReason || "Доверенный продавец",
        ]
      );

      await User.recordApprovedListing(listing.owner);

      const fresh = await this.findById(listingId);
      await notifySellerModerationResult(fresh, "approved");
      await notifyModerators(io, { type: "auto_approve", listing: fresh });
      return fresh || updated;
    }

    const result = await query(
      `
      UPDATE listings
      SET
        status = 'pending',
        moderation_flags = $2::jsonb,
        auto_moderation_reason = $3,
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [
        listingId,
        JSON.stringify(flags),
        evaluation.autoModerationReason || "",
      ]
    );

    const updated = mapListing(result.rows[0]);
    await notifyModerators(io, {
      type: isUpdate ? "updated" : "queued",
      listing: updated,
    });

    return updated;
  }

  static async submitAppeal(id, ownerId, text) {
    const appealText = String(text || "").trim();

    if (appealText.length < 10) {
      throw new Error("APPEAL_TOO_SHORT");
    }

    const existing = await this.findById(id);

    if (!existing || String(existing.owner) !== String(ownerId)) {
      return null;
    }

    if (existing.status !== "rejected") {
      throw new Error("NOT_REJECTED");
    }

    if (existing.appealStatus === "pending") {
      throw new Error("APPEAL_ALREADY_PENDING");
    }

    const result = await query(
      `
      UPDATE listings
      SET
        appeal_status = 'pending',
        appeal_text = $3,
        appeal_at = now(),
        status = 'pending',
        updated_at = now()
      WHERE id = $1 AND owner = $2
      RETURNING *
      `,
      [id, ownerId, appealText]
    );

    return mapListing(result.rows[0]);
  }

  static async resolveAppeal(id, moderatorId, approved, note = "") {
    const existing = await this.findById(id);

    if (!existing || existing.appealStatus !== "pending") {
      return null;
    }

    if (approved) {
      const listing = await this.approve(id, moderatorId);

      await query(
        `
        UPDATE listings
        SET appeal_status = 'approved'
        WHERE id = $1
        `,
        [id]
      );

      return this.findById(id) || listing;
    }

    const reason = String(note || existing.rejectionReason || "Апелляция отклонена").trim();

    const result = await query(
      `
      UPDATE listings
      SET
        status = 'rejected',
        rejection_reason = $3,
        appeal_status = 'rejected',
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

  static async findForModeration({
    status = "pending",
    limit = 100,
    offset = 0,
  } = {}) {
    const safeStatus =
      assertEnumValue(status, LISTING_STATUSES, "STATUS") || "pending";
    const safeLimitValue = safeLimit(limit, { fallback: 100, max: 200 });
    const safeOffsetValue = safeOffset(offset);

    const result = await query(
      `
      SELECT
        l.*,
        u.trust_level AS owner_trust_level,
        u.name AS owner_name,
        COALESCE(r.report_count, 0)::int AS report_count
      FROM listings l
      JOIN users u ON u.id = l.owner
      LEFT JOIN (
        SELECT listing_id, COUNT(*)::int AS report_count
        FROM listing_reports
        WHERE status = 'pending'
        GROUP BY listing_id
      ) r ON r.listing_id = l.id
      WHERE l.status = $1
      ORDER BY
        CASE WHEN l.appeal_status = 'pending' THEN 0 ELSE 1 END,
        COALESCE(r.report_count, 0) DESC,
        CASE
          WHEN jsonb_array_length(COALESCE(l.images, '[]'::jsonb)) = 0 THEN 0
          ELSE 1
        END,
        CASE
          WHEN jsonb_array_length(COALESCE(l.moderation_flags, '[]'::jsonb)) > 0 THEN 0
          ELSE 1
        END,
        l.created_at ASC
      LIMIT $2 OFFSET $3
      `,
      [safeStatus, safeLimitValue, safeOffsetValue]
    );

    return result.rows.map((row) => this.mapModerationRow(row));
  }

  static async approve(id, moderatorId) {
    const SiteSettings = require("./SiteSettings");
    const settings = await SiteSettings.get();
    const ttlDays = Number(settings.listingTtlDays || 60);

    const result = await query(
      `
      UPDATE listings
      SET
        status = 'approved',
        rejection_reason = '',
        moderated_by = $2,
        moderated_at = now(),
        expires_at = now() + ($3 || ' days')::interval,
        expiry_notice_sent_at = NULL,
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id, moderatorId, String(ttlDays)]
    );

    const listing = mapListing(result.rows[0]);

    if (listing && moderatorId) {
      const User = require("./User");
      await User.recordApprovedListing(listing.owner);
    }

    return listing;
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

  static async republish(id, ownerId) {
    const SiteSettings = require("./SiteSettings");
    const settings = await SiteSettings.get();
    const ttlDays = Number(settings.listingTtlDays || 60);

    const result = await query(
      `
      UPDATE listings
      SET
        status = 'approved',
        expires_at = now() + ($3 || ' days')::interval,
        expiry_notice_sent_at = NULL,
        updated_at = now()
      WHERE id = $1 AND owner = $2
      RETURNING *
      `,
      [id, ownerId, String(ttlDays)]
    );

    return mapListing(result.rows[0]);
  }

  static async promote(id, userId, type, days) {
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
    const { getPromotionPlan } = require("../lib/promotionPlans");
    const plan = getPromotionPlan(normalizedType, days);

    if (!plan) {
      throw new Error("INVALID_DAYS");
    }

    const price = plan.price;
    const planDays = plan.days;
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
      ? new Date((currentVipUntil || now).getTime() + planDays * msPerDay)
      : currentVipUntil;
    const nextTopUntil = !isVip
      ? new Date((currentTopUntil || now).getTime() + planDays * msPerDay)
      : currentTopUntil;

    await User.chargeWallet(userId, price, {
      description: isVip
        ? `VIP продвижение (${planDays} дн.): ${safeTitle}`
        : `TOP продвижение (${planDays} дн.): ${safeTitle}`,
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

  /**
   * @param {string[]} ids
   * @param {{status?: string|null}} options `status: null` returns any status
   *   the caller is allowed to see, which favourites rely on so a sold listing
   *   does not silently vanish from the list.
   */
  static async findByIds(ids = [], { status = "approved" } = {}) {
    const clean = [...new Set(ids.map((id) => String(id || "").trim()).filter(Boolean))];
    if (!clean.length) return [];

    const values = [clean];
    const conditions = ["listings.id = ANY($1::uuid[])"];

    if (status) {
      values.push(status);
      conditions.push(`listings.status = $${values.length}`);
    }

    const result = await query(
      `
      SELECT
        listings.*,${OWNER_JOIN_SELECT}
      FROM listings${OWNER_JOIN}
      WHERE ${conditions.join(" AND ")}
      `,
      values
    );

    const mapped = new Map(
      result.rows.map((row) => [String(row.id), mapListing(row)])
    );

    return clean.map((id) => mapped.get(id)).filter(Boolean);
  }

  static async findPopularByCity(location = "Душанбе", limit = 60) {
    return this.findAll({
      location,
      sort: "views_desc",
      limit,
      offset: 0,
    });
  }

  static async findForRecommendations({
    cats = [],
    location,
    priceFrom,
    priceTo,
    limit = 200,
  } = {}) {
    const safeLimit = Math.min(Math.max(Number(limit) || 200, 1), 200);
    const conditions = [`listings.status = 'approved'`];
    const values = [];

    const normalizedCats = [...new Set(cats.map(String).filter(Boolean))];
    if (normalizedCats.length) {
      values.push(normalizedCats);
      conditions.push(`listings.cat = ANY($${values.length}::text[])`);
    }

    if (location) {
      values.push(String(location).trim());
      conditions.push(`listings.location = $${values.length}`);
    }

    const priceExpr = "listings.price_num";

    const minPrice = toNumberOrNull(priceFrom);
    const maxPrice = toNumberOrNull(priceTo);

    if (minPrice != null) {
      values.push(minPrice);
      conditions.push(`${priceExpr} >= $${values.length}`);
    }

    if (maxPrice != null) {
      values.push(maxPrice);
      conditions.push(`${priceExpr} <= $${values.length}`);
    }

    values.push(safeLimit);

    const result = await query(
      `
      SELECT
        listings.*,${OWNER_JOIN_SELECT}
      FROM listings${OWNER_JOIN}
      WHERE ${conditions.join(" AND ")}
      ORDER BY ${PROMOTION_ORDER}, COALESCE(listings.bumped_at, listings.created_at) DESC, listings.created_at DESC
      LIMIT $${values.length}
      `,
      values
    );

    return result.rows.map(mapListing);
  }

  static async bumpAllApprovedForOwner(ownerId) {
    const result = await query(
      `
      UPDATE listings
      SET
        bumped_at = now(),
        updated_at = now()
      WHERE owner = $1
        AND status = 'approved'
      RETURNING id
      `,
      [ownerId]
    );

    return result.rows.length;
  }
}

module.exports = ListingModel;
module.exports.buildListingFilters = buildListingFilters;