const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { query, mapUser, USER_ROLES } = require("../db");
const {
  assertEnumValue,
  safeSort,
  safeLimit,
  safeOffset,
  bindLike,
} = require("../lib/sqlSafety");
const {
  normalizePhone,
  phoneToSyntheticEmail,
} = require("../lib/phoneUtils");
const {
  getListingLimit,
  canSwitchToPrivate,
  ACTIVE_LISTING_STATUSES,
  normalizeAutoBumpIntervalHours,
} = require("../lib/businessAccount");

function normalizeWebsite(value = "") {
  const trimmed = String(value || "").trim();

  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function normalizeInstagram(value = "") {
  const trimmed = String(value || "").trim();

  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const handle = trimmed.replace(/^@/, "");

  return `https://instagram.com/${handle}`;
}

class UserModel {
  static async create({
    email,
    password,
    name,
    phone = "",
    sellerType = "private",
    companyName = "",
    role = "user",
    registrationDeviceType = "",
    registrationDeviceModel = "",
    registrationUserAgent = "",
  }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedSellerType = sellerType === "company" ? "company" : "private";
    const normalizedCompanyName =
      normalizedSellerType === "company"
        ? String(companyName || name || "").trim()
        : "";

    const result = await query(
      `
      INSERT INTO users (
        email,
        password,
        name,
        phone,
        seller_type,
        company_name,
        role,
        registration_device_type,
        registration_device_model,
        registration_user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
      `,
      [
        email,
        hashedPassword,
        name,
        phone,
        normalizedSellerType,
        normalizedCompanyName,
        role,
        String(registrationDeviceType || "").slice(0, 32),
        String(registrationDeviceModel || "").slice(0, 120),
        String(registrationUserAgent || "").slice(0, 500),
      ]
    );

    return mapUser(result.rows[0]);
  }

  static async findByEmail(email) {
    const result = await query(
      `
      SELECT *
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [email]
    );

    return mapUser(result.rows[0]);
  }

  static async findByPhone(phone) {
    const normalized = normalizePhone(phone);

    if (!normalized) {
      return null;
    }

    const result = await query(
      `
      SELECT *
      FROM users
      WHERE phone = $1
      LIMIT 1
      `,
      [normalized]
    );

    return mapUser(result.rows[0]);
  }

  static async createFromPhone({
    phone,
    name,
    registrationDeviceType = "",
    registrationDeviceModel = "",
    registrationUserAgent = "",
  }) {
    const normalizedPhone = normalizePhone(phone);
    const email = phoneToSyntheticEmail(normalizedPhone);
    const hashedPassword = await bcrypt.hash(
      crypto.randomBytes(32).toString("hex"),
      10
    );
    const trimmedName = String(name || "").trim() || "Пользователь";

    const result = await query(
      `
      INSERT INTO users (
        email,
        password,
        name,
        phone,
        seller_type,
        role,
        phone_verified,
        email_verified,
        registration_device_type,
        registration_device_model,
        registration_user_agent
      )
      VALUES ($1, $2, $3, $4, 'private', 'user', true, true, $5, $6, $7)
      RETURNING *
      `,
      [
        email,
        hashedPassword,
        trimmedName,
        normalizedPhone,
        String(registrationDeviceType || "").slice(0, 32),
        String(registrationDeviceModel || "").slice(0, 120),
        String(registrationUserAgent || "").slice(0, 500),
      ]
    );

    return mapUser(result.rows[0]);
  }

  static async updatePhoneVerified(userId, verified = true) {
    await query(
      `UPDATE users SET phone_verified = $2, updated_at = now() WHERE id = $1`,
      [userId, Boolean(verified)]
    );
  }

  static async findById(id) {
    const result = await query(
      `
      SELECT *
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    return mapUser(result.rows[0]);
  }

  static async getAll() {
    const result = await query(
      `
      SELECT *
      FROM users
      ORDER BY created_at DESC
      `
    );

    return result.rows.map(mapUser);
  }

  static async findPaginated({
    q = "",
    role = "",
    status = "",
    business = "",
    sort = "created_desc",
    limit = 25,
    offset = 0,
  } = {}) {
    const conditions = [];
    const values = [];

    const safeRole = assertEnumValue(role, USER_ROLES, "ROLE");

    if (safeRole) {
      values.push(safeRole);
      conditions.push(`role = $${values.length}`);
    }

    if (business === "company") {
      conditions.push("seller_type = 'company'");
    } else if (business === "unverified") {
      conditions.push(
        "seller_type = 'company' AND business_verified = false"
      );
    } else if (business === "verified") {
      conditions.push(
        "seller_type = 'company' AND business_verified = true"
      );
    }

    if (status === "active") {
      conditions.push("is_blocked = false");
    } else if (status === "blocked") {
      conditions.push("is_blocked = true");
    }

    const search = String(q || "").trim();

    if (search) {
      const idx = bindLike(values, search);

      conditions.push(`
        (
          name ILIKE $${idx} ESCAPE '\\'
          OR email ILIKE $${idx} ESCAPE '\\'
          OR phone ILIKE $${idx} ESCAPE '\\'
          OR company_name ILIKE $${idx} ESCAPE '\\'
        )
      `);
    }

    const whereSql = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const sortMap = {
      created_desc: "created_at DESC",
      created_asc: "created_at ASC",
      balance_desc: "wallet_balance DESC NULLS LAST",
      balance_asc: "wallet_balance ASC NULLS LAST",
      role_asc: "role ASC, name ASC",
      name_asc: "name ASC",
    };

    const orderBy = safeSort(sort, sortMap, "created_desc");
    const safeLimitValue = safeLimit(limit, { fallback: 25, max: 100 });
    const safeOffsetValue = safeOffset(offset);

    const countResult = await query(
      `
      SELECT COUNT(*)::int AS total
      FROM users
      ${whereSql}
      `,
      values
    );

    const listValues = [...values, safeLimitValue, safeOffsetValue];
    const limitIdx = listValues.length - 1;
    const offsetIdx = listValues.length;

    const result = await query(
      `
      SELECT *
      FROM users
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `,
      listValues
    );

    const total = Number(countResult.rows[0]?.total || 0);

    return {
      items: result.rows.map(mapUser),
      total,
      limit: safeLimit,
      offset: safeOffset,
      page: Math.floor(safeOffset / safeLimit) + 1,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }

  static async comparePassword(user, password) {
    return bcrypt.compare(password, user.password);
  }

  static sanitizePublic(user, { listingsCount = 0 } = {}) {
    if (!user || user.isBlocked) return null;

    const isCompany = user.sellerType === "company";

    return {
      id: user.id,
      _id: user.id,
      name: user.name || "Продавец",
      sellerType: user.sellerType || "private",
      companyName: user.companyName || "",
      companyDescription: user.companyDescription || "",
      companyLogo: user.companyLogo || "",
      companyAddress: user.companyAddress || "",
      companyWebsite: user.companyWebsite || "",
      companyInstagram: user.companyInstagram || "",
      businessVerified: Boolean(user.businessVerified),
      businessVerifiedAt: user.businessVerifiedAt || null,
      displayName:
        isCompany && user.companyName ? user.companyName : user.name || "Продавец",
      whatsapp: user.whatsapp || "",
      telegram: user.telegram || "",
      emailVerified: Boolean(user.emailVerified),
      createdAt: user.createdAt,
      listingsCount,
    };
  }

  static async getPublicProfile(id) {
    const user = await this.findById(id);

    if (!user || user.isBlocked) {
      return null;
    }

    const Review = require("./Review");

    const [countResult, ratingSummary] = await Promise.all([
      query(
        `
      SELECT COUNT(*)::int AS count
      FROM listings
      WHERE owner = $1 AND status = 'approved'
      `,
        [id]
      ),
      Review.getSellerSummary(id),
    ]);

    const listingsCount = Number(countResult.rows[0]?.count || 0);

    return {
      ...this.sanitizePublic(user, { listingsCount }),
      ratingAverage: ratingSummary.average,
      ratingCount: ratingSummary.count,
      phoneVerified: Boolean(String(user.phone || "").replace(/\D/g, "").length >= 9),
    };
  }

  static registrationDeviceFields(user, { includeUserAgent = false } = {}) {
    if (!user) return {};

    const fields = {
      registrationDeviceType: user.registrationDeviceType || null,
      registrationDeviceModel: user.registrationDeviceModel || null,
    };

    if (includeUserAgent) {
      fields.registrationUserAgent = user.registrationUserAgent || null;
    }

    return fields;
  }

  static sanitize(user) {
    if (!user) return null;

    return {
      id: user.id,
      _id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      whatsapp: user.whatsapp || "",
      telegram: user.telegram || "",
      extraPhones: Array.isArray(user.extraPhones) ? user.extraPhones : [],
      sellerType: user.sellerType,
      companyName: user.companyName || "",
      companyDescription: user.companyDescription || "",
      companyLogo: user.companyLogo || "",
      companyAddress: user.companyAddress || "",
      companyWebsite: user.companyWebsite || "",
      companyInstagram: user.companyInstagram || "",
      businessVerified: Boolean(user.businessVerified),
      businessVerifiedAt: user.businessVerifiedAt || null,
      listingAutoBumpEnabled: Boolean(user.listingAutoBumpEnabled),
      listingAutoBumpIntervalHours: Number(user.listingAutoBumpIntervalHours || 24),
      listingAutoBumpLastAt: user.listingAutoBumpLastAt || null,
      role: user.role || "user",
      isBlocked: Boolean(user.isBlocked),
      emailVerified: user.emailVerified,
      walletBalance: Number(user.walletBalance || 0),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static async countActiveListings(userId) {
    const result = await query(
      `
      SELECT COUNT(*)::int AS count
      FROM listings
      WHERE owner = $1
        AND status = ANY($2::text[])
      `,
      [userId, ACTIVE_LISTING_STATUSES]
    );

    return Number(result.rows[0]?.count || 0);
  }

  static async getBusinessStats(userId) {
    const [user, activeListings, viewsResult, statusResult] = await Promise.all([
      this.findById(userId),
      this.countActiveListings(userId),
      query(
        `
        SELECT COALESCE(SUM(views), 0)::int AS views
        FROM listings
        WHERE owner = $1 AND status = 'approved'
        `,
        [userId]
      ),
      query(
        `
        SELECT status, COUNT(*)::int AS count
        FROM listings
        WHERE owner = $1
        GROUP BY status
        `,
        [userId]
      ),
    ]);

    if (!user) return null;

    const byStatus = {};

    for (const row of statusResult.rows) {
      byStatus[row.status] = Number(row.count || 0);
    }

    return {
      sellerType: user.sellerType,
      activeListings,
      totalViews: Number(viewsResult.rows[0]?.views || 0),
      businessVerified: Boolean(user.businessVerified),
      listingAutoBumpEnabled: Boolean(user.listingAutoBumpEnabled),
      listingAutoBumpIntervalHours: Number(user.listingAutoBumpIntervalHours || 24),
      listingAutoBumpLastAt: user.listingAutoBumpLastAt || null,
      byStatus,
    };
  }

  static async getSellerAnalytics(userId, period = "7d") {
    const periodKey = ["7d", "30d", "all"].includes(period) ? period : "7d";
    const dayCount = periodKey === "7d" ? 7 : periodKey === "30d" ? 30 : 90;
    const intervalClause =
      periodKey === "all"
        ? "ue.created_at >= now() - interval '365 days'"
        : `ue.created_at >= now() - ($2::text || ' days')::interval`;

    const eventValues =
      periodKey === "all" ? [userId] : [userId, String(dayCount)];

    const [user, listingStats, seriesResult, topResult, prevResult] =
      await Promise.all([
        this.findById(userId),
        query(
          `
          SELECT
            COUNT(*) FILTER (WHERE status = 'approved')::int AS active,
            COUNT(*)::int AS total,
            COALESCE(SUM(views), 0)::int AS views
          FROM listings
          WHERE owner = $1
          `,
          [userId]
        ),
        query(
          `
          SELECT
            to_char(date_trunc('day', ue.created_at), 'YYYY-MM-DD') AS day,
            ue.event_type,
            COUNT(*)::int AS count
          FROM user_events ue
          INNER JOIN listings l ON l.id = ue.listing_id
          WHERE l.owner = $1
            AND ue.event_type IN ('listing_view', 'favorite', 'contact_intent')
            AND ${intervalClause}
          GROUP BY 1, 2
          ORDER BY 1 ASC
          `,
          eventValues
        ),
        query(
          `
          SELECT
            l.id,
            l.title,
            l.cat,
            l.location,
            l.images,
            l.views,
            COALESCE(SUM(CASE WHEN ue.event_type = 'listing_view' THEN 1 ELSE 0 END), 0)::int AS period_views,
            COALESCE(SUM(CASE WHEN ue.event_type = 'favorite' THEN 1 ELSE 0 END), 0)::int AS favorites,
            COALESCE(SUM(CASE WHEN ue.event_type = 'contact_intent' THEN 1 ELSE 0 END), 0)::int AS reveals
          FROM listings l
          LEFT JOIN user_events ue
            ON ue.listing_id = l.id
            AND ue.event_type IN ('listing_view', 'favorite', 'contact_intent')
            AND ${
              periodKey === "all"
                ? "ue.created_at >= now() - interval '365 days'"
                : "ue.created_at >= now() - ($2::text || ' days')::interval"
            }
          WHERE l.owner = $1
          GROUP BY l.id
          ORDER BY period_views DESC, l.views DESC
          LIMIT 8
          `,
          eventValues
        ),
        query(
          `
          SELECT
            ue.event_type,
            COUNT(*)::int AS count
          FROM user_events ue
          INNER JOIN listings l ON l.id = ue.listing_id
          WHERE l.owner = $1
            AND ue.event_type IN ('listing_view', 'favorite', 'contact_intent')
            AND ue.created_at >= now() - ($2::text || ' days')::interval
            AND ue.created_at < now() - ($3::text || ' days')::interval
          GROUP BY ue.event_type
          `,
          [
            userId,
            String(dayCount * 2),
            String(dayCount),
          ]
        ),
      ]);

    if (!user) return null;

    const totals = { views: 0, favorites: 0, reveals: 0 };
    const byDay = {};

    for (const row of seriesResult.rows) {
      const day = row.day;
      if (!byDay[day]) {
        byDay[day] = { day, views: 0, favorites: 0, reveals: 0 };
      }
      if (row.event_type === "listing_view") {
        byDay[day].views += Number(row.count || 0);
        totals.views += Number(row.count || 0);
      } else if (row.event_type === "favorite") {
        byDay[day].favorites += Number(row.count || 0);
        totals.favorites += Number(row.count || 0);
      } else if (row.event_type === "contact_intent") {
        byDay[day].reveals += Number(row.count || 0);
        totals.reveals += Number(row.count || 0);
      }
    }

    const seriesDays = periodKey === "all" ? 14 : dayCount;
    const series = [];
    for (let i = seriesDays - 1; i >= 0; i -= 1) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      series.push(byDay[key] || { day: key, views: 0, favorites: 0, reveals: 0 });
    }

    const prev = { views: 0, favorites: 0, reveals: 0 };
    for (const row of prevResult.rows) {
      if (row.event_type === "listing_view") prev.views = Number(row.count || 0);
      if (row.event_type === "favorite") prev.favorites = Number(row.count || 0);
      if (row.event_type === "contact_intent") prev.reveals = Number(row.count || 0);
    }

    const pctChange = (curr, previous) => {
      if (!previous) return curr > 0 ? 100 : 0;
      return Math.round(((curr - previous) / previous) * 100);
    };

    const listingRow = listingStats.rows[0] || {};
    const phones = [
      user.phone,
      ...(Array.isArray(user.extraPhones) ? user.extraPhones : []),
    ].filter(Boolean);

    const phoneReveals = phones.map((phone, index) => ({
      phone,
      count: index === 0 ? totals.reveals : 0,
    }));

    const topListings = topResult.rows.map((row) => {
      const views = Number(row.period_views || 0) || Number(row.views || 0);
      const favorites = Number(row.favorites || 0);
      const reveals = Number(row.reveals || 0);
      const conversion = views > 0 ? Math.round((reveals / views) * 1000) / 10 : 0;
      let images = row.images;
      if (typeof images === "string") {
        try {
          images = JSON.parse(images);
        } catch {
          images = [];
        }
      }

      return {
        id: row.id,
        title: row.title,
        cat: row.cat,
        location: row.location,
        images: Array.isArray(images) ? images : [],
        views,
        favorites,
        reveals,
        conversion,
      };
    });

    return {
      period: periodKey,
      kpis: {
        views: totals.views,
        favorites: totals.favorites,
        reveals: totals.reveals,
        activeListings: Number(listingRow.active || 0),
        totalListings: Number(listingRow.total || 0),
        viewsChange: pctChange(totals.views, prev.views),
        favoritesChange: pctChange(totals.favorites, prev.favorites),
        revealsChange: pctChange(totals.reveals, prev.reveals),
        avgViewsPerDay:
          seriesDays > 0 ? Math.round(totals.views / seriesDays) : 0,
        favoriteConversion:
          totals.views > 0
            ? Math.round((totals.favorites / totals.views) * 1000) / 10
            : 0,
        revealConversion:
          totals.views > 0
            ? Math.round((totals.reveals / totals.views) * 1000) / 10
            : 0,
      },
      series,
      phoneReveals,
      topListings,
      lifetimeViews: Number(listingRow.views || 0),
    };
  }

  static async assertCanCreateListing(userId) {
    const user = await this.findById(userId);

    if (!user) {
      throw new Error("NOT_FOUND");
    }

    const activeListings = await this.countActiveListings(userId);
    const limit = getListingLimit(user);

    if (limit != null && activeListings >= limit) {
      const err = new Error("LISTING_LIMIT_REACHED");
      err.limit = limit;
      err.activeListings = activeListings;
      err.sellerType = user.sellerType || "private";
      throw err;
    }

    return { user, activeListings, limit };
  }

  static async updateProfile(id, fields = {}) {
    const current = await this.findById(id);

    if (!current) return null;

    const nextSellerType =
      fields.sellerType !== undefined ? fields.sellerType : current.sellerType;

    if (!["private", "company"].includes(nextSellerType)) {
      throw new Error("INVALID_SELLER_TYPE");
    }

    if (nextSellerType === "private" && current.sellerType === "company") {
      if (!canSwitchToPrivate(current)) {
        const err = new Error("TOO_MANY_LISTINGS_FOR_PRIVATE");
        err.activeListings = await this.countActiveListings(id);
        throw err;
      }
    }

    const name =
      fields.name !== undefined ? String(fields.name).trim() : current.name;
    const phone =
      fields.phone !== undefined ? String(fields.phone).trim() : current.phone;
    const whatsapp =
      fields.whatsapp !== undefined ? fields.whatsapp : current.whatsapp;
    const telegram =
      fields.telegram !== undefined ? fields.telegram : current.telegram;
    const extraPhones =
      fields.extraPhones !== undefined
        ? (Array.isArray(fields.extraPhones) ? fields.extraPhones : [])
            .map((p) => String(p || "").trim())
            .filter(Boolean)
            .filter((p) => p !== phone)
            .slice(0, 5)
        : current.extraPhones || [];

    const companyName =
      fields.companyName !== undefined
        ? String(fields.companyName).trim()
        : current.companyName;
    const companyDescription =
      fields.companyDescription !== undefined
        ? String(fields.companyDescription).trim()
        : current.companyDescription;
    const companyLogo =
      fields.companyLogo !== undefined
        ? String(fields.companyLogo).trim()
        : current.companyLogo;
    const companyAddress =
      fields.companyAddress !== undefined
        ? String(fields.companyAddress).trim()
        : current.companyAddress;
    const companyWebsite =
      fields.companyWebsite !== undefined
        ? normalizeWebsite(fields.companyWebsite)
        : current.companyWebsite;
    const companyInstagram =
      fields.companyInstagram !== undefined
        ? normalizeInstagram(fields.companyInstagram)
        : current.companyInstagram;

    const nextAutoBumpEnabled =
      fields.listingAutoBumpEnabled !== undefined
        ? Boolean(fields.listingAutoBumpEnabled)
        : Boolean(current.listingAutoBumpEnabled);
    const nextAutoBumpIntervalHours =
      fields.listingAutoBumpIntervalHours !== undefined
        ? normalizeAutoBumpIntervalHours(fields.listingAutoBumpIntervalHours)
        : normalizeAutoBumpIntervalHours(current.listingAutoBumpIntervalHours);
    const autoBumpSettingsChanged =
      fields.listingAutoBumpEnabled !== undefined ||
      fields.listingAutoBumpIntervalHours !== undefined;
    const shouldResetAutoBumpTimer =
      autoBumpSettingsChanged &&
      nextSellerType === "company" &&
      nextAutoBumpEnabled &&
      (!current.listingAutoBumpEnabled ||
        (fields.listingAutoBumpIntervalHours !== undefined &&
          nextAutoBumpIntervalHours !==
            normalizeAutoBumpIntervalHours(current.listingAutoBumpIntervalHours)));

    if (nextSellerType === "company" && !companyName && !name) {
      throw new Error("COMPANY_NAME_REQUIRED");
    }

    const result = await query(
      `
      UPDATE users
      SET
        name = $2,
        phone = $3,
        whatsapp = $4,
        telegram = $5,
        extra_phones = $6::jsonb,
        seller_type = $7,
        company_name = $8,
        company_description = $9,
        company_logo = $10,
        company_address = $11,
        company_website = $12,
        company_instagram = $13,
        listing_auto_bump_enabled = CASE
          WHEN $7 = 'company' THEN $14
          ELSE false
        END,
        listing_auto_bump_interval_hours = CASE
          WHEN $7 = 'company' THEN $15
          ELSE 24
        END,
        listing_auto_bump_last_at = CASE
          WHEN $7 = 'company' AND $16 THEN now()
          WHEN $7 = 'company' THEN listing_auto_bump_last_at
          ELSE NULL
        END,
        business_verified = CASE WHEN $7 = 'company' THEN business_verified ELSE false END,
        business_verified_at = CASE WHEN $7 = 'company' THEN business_verified_at ELSE NULL END,
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [
        id,
        name,
        phone,
        whatsapp,
        telegram,
        JSON.stringify(extraPhones),
        nextSellerType,
        nextSellerType === "company" ? companyName || name : "",
        nextSellerType === "company" ? companyDescription : "",
        nextSellerType === "company" ? companyLogo : "",
        nextSellerType === "company" ? companyAddress : "",
        nextSellerType === "company" ? companyWebsite : "",
        nextSellerType === "company" ? companyInstagram : "",
        nextAutoBumpEnabled,
        nextAutoBumpIntervalHours,
        shouldResetAutoBumpTimer,
      ]
    );

    return mapUser(result.rows[0]);
  }

  static async setBusinessVerified(userId, verified = true) {
    const result = await query(
      `
      UPDATE users
      SET
        business_verified = $2,
        business_verified_at = CASE WHEN $2 THEN now() ELSE NULL END,
        updated_at = now()
      WHERE id = $1 AND seller_type = 'company'
      RETURNING *
      `,
      [userId, Boolean(verified)]
    );

    return mapUser(result.rows[0]);
  }

  static async adjustWallet(id, amount, { description = "", createdBy = null } = {}) {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount === 0) {
      throw new Error("INVALID_AMOUNT");
    }

    if (numericAmount < 0) {
      const current = await this.findById(id);

      if (!current) {
        throw new Error("NOT_FOUND");
      }

      if (Number(current.walletBalance || 0) + numericAmount < 0) {
        throw new Error("INSUFFICIENT_BALANCE");
      }
    }

    const result = await query(
      `
      UPDATE users
      SET
        wallet_balance = wallet_balance + $2,
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id, numericAmount]
    );

    const user = mapUser(result.rows[0]);

    if (user) {
      const Wallet = require("./Wallet");

      await Wallet.recordTransaction({
        userId: id,
        type: "manual_adjustment",
        amount: numericAmount,
        description:
          description ||
          (numericAmount > 0
            ? "Начисление администратором"
            : "Списание администратором"),
        createdBy,
      });
    }

    return user;
  }

  static async chargeWallet(id, amount, { description = "" } = {}) {
    const numericAmount = Math.abs(Number(amount));

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      throw new Error("INVALID_AMOUNT");
    }

    const current = await this.findById(id);

    if (!current) {
      throw new Error("NOT_FOUND");
    }

    if (Number(current.walletBalance || 0) < numericAmount) {
      throw new Error("INSUFFICIENT_BALANCE");
    }

    const result = await query(
      `
      UPDATE users
      SET
        wallet_balance = wallet_balance - $2,
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id, numericAmount]
    );

    const user = mapUser(result.rows[0]);

    if (user) {
      const Wallet = require("./Wallet");

      await Wallet.recordTransaction({
        userId: id,
        type: "payment",
        amount: -numericAmount,
        description,
        createdBy: id,
      });
    }

    return user;
  }

  static async topUpWallet(id, amount, description = "Пополнение баланса") {
    const result = await query(
      `
      UPDATE users
      SET
        wallet_balance = wallet_balance + $2,
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id, amount]
    );

    const user = mapUser(result.rows[0]);

    if (user) {
      const Wallet = require("./Wallet");

      await Wallet.recordTransaction({
        userId: id,
        type: "top_up",
        amount,
        description,
        createdBy: id,
      });
    }

    return user;
  }

  static async setRole(id, role) {
    const result = await query(
      `
      UPDATE users
      SET
        role = $2,
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id, role]
    );

    return mapUser(result.rows[0]);
  }

  static async blockUser(id) {
    const result = await query(
      `
      UPDATE users
      SET
        is_blocked = true,
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    return mapUser(result.rows[0]);
  }

  static async unblockUser(id) {
    const result = await query(
      `
      UPDATE users
      SET
        is_blocked = false,
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    return mapUser(result.rows[0]);
  }


static async touchLastSeen(id) {
  const result = await query(
    `
    UPDATE users
    SET last_seen = now()
    WHERE id = $1
    RETURNING *
    `,
    [id]
  );

  return mapUser(result.rows[0]);
}

  static async recordApprovedListing(userId) {
    const {
      TRUSTED_APPROVAL_THRESHOLD,
    } = require("../lib/moderationEngine");

    const result = await query(
      `
      UPDATE users
      SET
        approved_listings_count = approved_listings_count + 1,
        trust_level = CASE
          WHEN approved_listings_count + 1 >= $2 AND trust_level = 'new' THEN 'trusted'
          ELSE trust_level
        END,
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [userId, TRUSTED_APPROVAL_THRESHOLD]
    );

    return mapUser(result.rows[0]);
  }

  static async setTrustLevel(userId, trustLevel) {
    const allowed = new Set(["new", "trusted", "blocked"]);

    if (!allowed.has(trustLevel)) {
      throw new Error("INVALID_TRUST_LEVEL");
    }

    const result = await query(
      `
      UPDATE users
      SET trust_level = $2, updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [userId, trustLevel]
    );

    return mapUser(result.rows[0]);
  }
}
module.exports = UserModel;