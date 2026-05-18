const { query, mapListing } = require("../db");

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const n = Number(String(value).replace(",", "."));

  return Number.isFinite(n) ? n : null;
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
    sort = "new",
    limit = 50,
    offset = 0,
  } = {}) {
    const conditions = [];
    const values = [];

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);

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

    if (cat) {
      values.push(cat);
      conditions.push(`cat = $${values.length}`);
    }

    if (subcategory) {
      values.push(subcategory);
      conditions.push(`subcategory = $${values.length}`);
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

    let orderBy = "created_at DESC";

    if (sort === "old") {
      orderBy = "created_at ASC";
    }

    if (sort === "price_asc") {
      orderBy = `${priceExpr} ASC NULLS LAST, created_at DESC`;
    }

    if (sort === "price_desc") {
      orderBy = `${priceExpr} DESC NULLS LAST, created_at DESC`;
    }

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

 static async findById(id) {
  const result = await query(
    `
    SELECT
      l.*,
      u.name AS seller_name,
      u.phone AS seller_phone,
      u.whatsapp AS seller_whatsapp,
      u.telegram AS seller_telegram
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
    phone: result.rows[0].seller_phone || "",
    whatsapp: result.rows[0].seller_whatsapp || "",
    telegram: result.rows[0].seller_telegram || "",
  };
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
}

module.exports = ListingModel;