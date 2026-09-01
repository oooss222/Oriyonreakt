const crypto = require("crypto");
const { Pool } = require("pg");
const { validateQueryArgs } = require("./lib/sqlSafety");
const {
  getRlsContext,
  isRlsEnabled,
  runWithRlsContext,
} = require("./lib/rlsContext");
const { setupRowLevelSecurity } = require("./lib/rowLevelSecurity");

const DATABASE_URL =
  process.env.DATABASE_URL || process.env.POSTGRES_URL;

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const USER_ROLES = [
  "user",
  "moderator",
  "accountant",
  "admin",
  "super_admin",
];

const LISTING_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "sold",
  "archived",
];

const TRANSACTION_TYPES = [
  "top_up",
  "payment",
  "refund",
  "manual_adjustment",
];

const TRANSACTION_STATUSES = [
  "pending",
  "completed",
  "failed",
  "cancelled",
];

const PAYMENT_ORDER_STATUSES = [
  "pending",
  "paid",
  "failed",
  "cancelled",
];

function getPoolConfig() {
  const poolDefaults = {
    // Render runs a single small instance, so a large pool only queues work
    // inside Postgres instead of the app.
    max: Number(process.env.PGPOOL_MAX || 8),
    connectionTimeoutMillis: Number(
      process.env.PGCONNECT_TIMEOUT_MS || 10000
    ),
    idleTimeoutMillis: 60000,
    query_timeout: 15000,
    statement_timeout: 15000,
  };

  if (!DATABASE_URL) {
    if (IS_PRODUCTION) {
      throw new Error("DATABASE_URL is required in production");
    }

    return {
      ...poolDefaults,
      host: process.env.PGHOST || "localhost",
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE || "oriyon",
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "postgres",
    };
  }

  const ca =
    process.env.DATABASE_CA ||
    process.env.CA_CERT ||
    process.env.PGSSLROOTCERT;

  // Newer pg treats sslmode=require in the URL as strict cert verification.
  // Strip it and configure SSL explicitly for managed Postgres (DigitalOcean).
  const connectionString = DATABASE_URL.replace(
    /([?&])sslmode=[^&]*&?/g,
    "$1"
  )
    .replace(/[?&]$/, "");

  return {
    ...poolDefaults,
    connectionString,
    ssl: ca
      ? { rejectUnauthorized: true, ca }
      : { rejectUnauthorized: false },
  };
}

const pool = new Pool(getPoolConfig());
pool.on("error", (err) => {
  console.error("POSTGRES_POOL_ERROR:", err);
});

function rlsContextKey(ctx) {
  return `${ctx.role || "anon"}\u0000${ctx.userId || ""}`;
}

/**
 * Applies the RLS context at session scope and remembers it on the pooled
 * client. A connection is held exclusively between connect() and release(),
 * so a cached context can never be observed by another request, and repeat
 * queries under the same identity skip the round trip entirely.
 */
async function applyRlsContext(client, ctx) {
  const key = rlsContextKey(ctx);

  if (client._rlsContextKey === key) {
    return;
  }

  await client.query(
    `SELECT set_config('app.user_id', $1, false), set_config('app.role', $2, false)`,
    [ctx.userId ? String(ctx.userId) : "", ctx.role || "anon"]
  );

  client._rlsContextKey = key;
}

async function query(text, params = []) {
  validateQueryArgs(text, params);

  if (!isRlsEnabled()) {
    return pool.query(text, params);
  }

  const ctx = getRlsContext();
  const client = await pool.connect();

  try {
    await applyRlsContext(client, ctx);
    return await client.query(text, params);
  } catch (error) {
    // Never trust the cached identity after a failure on this connection.
    client._rlsContextKey = null;
    throw error;
  } finally {
    client.release();
  }
}

async function initDb() {
  const schemaSql = `
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      seller_type TEXT NOT NULL DEFAULT 'private'
        CHECK (seller_type IN ('private', 'company')),
      role TEXT NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'moderator', 'accountant', 'admin', 'super_admin')),
      is_blocked BOOLEAN NOT NULL DEFAULT false,
      email_verified BOOLEAN NOT NULL DEFAULT false,
      wallet_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(12,2) NOT NULL DEFAULT 0;

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS whatsapp TEXT NOT NULL DEFAULT '';

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS telegram TEXT NOT NULL DEFAULT '';

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS company_name TEXT NOT NULL DEFAULT '';

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS company_description TEXT NOT NULL DEFAULT '';

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS company_logo TEXT NOT NULL DEFAULT '';

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS company_address TEXT NOT NULL DEFAULT '';

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS company_website TEXT NOT NULL DEFAULT '';

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS company_instagram TEXT NOT NULL DEFAULT '';

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS business_verified BOOLEAN NOT NULL DEFAULT false;

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS business_verified_at TIMESTAMPTZ;

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS listing_auto_bump_enabled BOOLEAN NOT NULL DEFAULT false;

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS listing_auto_bump_interval_hours INTEGER NOT NULL DEFAULT 24;

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS listing_auto_bump_last_at TIMESTAMPTZ;

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS trust_level TEXT NOT NULL DEFAULT 'new';

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS approved_listings_count INTEGER NOT NULL DEFAULT 0;

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS extra_phones JSONB NOT NULL DEFAULT '[]'::jsonb;

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS registration_device_type TEXT NOT NULL DEFAULT '';

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS registration_device_model TEXT NOT NULL DEFAULT '';

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS registration_user_agent TEXT NOT NULL DEFAULT '';

    CREATE TABLE IF NOT EXISTS phone_otps (
      phone TEXT PRIMARY KEY,
      code_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      send_count INTEGER NOT NULL DEFAULT 1,
      last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique
      ON users (phone)
      WHERE phone <> '';

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_trust_level_check'
      ) THEN
        ALTER TABLE users
          ADD CONSTRAINT users_trust_level_check
          CHECK (trust_level IN ('new', 'trusted', 'blocked'));
      END IF;
    END $$;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_role_check'
      ) THEN
        ALTER TABLE users
          ADD CONSTRAINT users_role_check
          CHECK (role IN ('user', 'moderator', 'accountant', 'admin', 'super_admin'));
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS listings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      price TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      cat TEXT NOT NULL,
      subcategory TEXT NOT NULL DEFAULT '',
      images JSONB NOT NULL DEFAULT '[]'::jsonb,
      specs JSONB NOT NULL DEFAULT '[]'::jsonb,
      owner UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
      rejection_reason TEXT NOT NULL DEFAULT '',
      moderated_by UUID REFERENCES users(id) ON DELETE SET NULL,
      moderated_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT NOT NULL DEFAULT '';

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES users(id) ON DELETE SET NULL;

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS public_id BIGINT UNIQUE;

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS vip_until TIMESTAMPTZ;

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS top_until TIMESTAMPTZ;

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS bumped_at TIMESTAMPTZ;

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS expiry_notice_sent_at TIMESTAMPTZ;

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS moderation_flags JSONB NOT NULL DEFAULT '[]'::jsonb;

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS previous_snapshot JSONB;

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS auto_moderation_reason TEXT NOT NULL DEFAULT '';

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS appeal_status TEXT NOT NULL DEFAULT 'none';

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS appeal_text TEXT NOT NULL DEFAULT '';

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS appeal_at TIMESTAMPTZ;

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS re_deal_type TEXT;

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS re_rooms TEXT;

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS re_area_sqm NUMERIC;

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS re_floor INTEGER;

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS re_floors_total INTEGER;

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS re_district TEXT;

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS re_lat NUMERIC;

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS re_lng NUMERIC;

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS re_price_per_sqm NUMERIC;

    -- Numeric mirror of the free-form price column, written by the app so that
    -- range filters and price sorting can use an index.
    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS price_num NUMERIC;

    CREATE INDEX IF NOT EXISTS idx_listings_re_area
      ON listings(re_area_sqm)
      WHERE cat = 'realestate';

    CREATE INDEX IF NOT EXISTS idx_listings_re_price_per_sqm
      ON listings(re_price_per_sqm)
      WHERE cat = 'realestate';

    CREATE INDEX IF NOT EXISTS idx_listings_re_district
      ON listings(re_district)
      WHERE cat = 'realestate';

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'listings_appeal_status_check'
      ) THEN
        ALTER TABLE listings
          ADD CONSTRAINT listings_appeal_status_check
          CHECK (appeal_status IN ('none', 'pending', 'approved', 'rejected'));
      END IF;
    END $$;

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'listings_status_check'
      ) THEN
        ALTER TABLE listings
          DROP CONSTRAINT listings_status_check;
      END IF;
    END $$;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'listings_status_check'
      ) THEN
        ALTER TABLE listings
          ADD CONSTRAINT listings_status_check
          CHECK (status IN ('pending', 'approved', 'rejected', 'sold', 'archived'));
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS favorites (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, listing_id)
    );

        CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;

    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL
        CHECK (type IN ('top_up', 'payment', 'refund', 'manual_adjustment')),
      amount NUMERIC(12,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed'
        CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
      description TEXT NOT NULL DEFAULT '',
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS payment_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      order_id TEXT NOT NULL UNIQUE,
      amount NUMERIC(12,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
      provider TEXT NOT NULL DEFAULT 'alif',
      transaction_id TEXT NOT NULL DEFAULT '',
      provider_status TEXT NOT NULL DEFAULT '',
      callback_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS saved_searches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label TEXT NOT NULL DEFAULT '',
      cat TEXT NOT NULL DEFAULT '',
      filters JSONB NOT NULL DEFAULT '{}'::jsonb,
      alerts_enabled BOOLEAN NOT NULL DEFAULT true,
      last_alert_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS re_developments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      developer TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT 'Душанбе',
      district TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      completion_date TEXT NOT NULL DEFAULT '',
      amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
      lat NUMERIC,
      lng NUMERIC,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_re_developments_city
      ON re_developments(city);

    CREATE TABLE IF NOT EXISTS seller_reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (seller_id, reviewer_id, listing_id)
    );

    CREATE TABLE IF NOT EXISTS ad_campaigns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL DEFAULT '',
      advertiser TEXT NOT NULL DEFAULT '',
      placement TEXT NOT NULL DEFAULT 'listing_top'
        CHECK (placement IN (
          'home_mid',
          'listing_top',
          'listing_feed',
          'category_feed',
          'ad_details_mid',
          'ad_sidebar',
          'footer'
        )),
      format TEXT NOT NULL DEFAULT 'banner'
        CHECK (format IN ('banner', 'native', 'html')),
      image_url TEXT NOT NULL DEFAULT '',
      link_url TEXT NOT NULL DEFAULT '',
      headline TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      html_code TEXT NOT NULL DEFAULT '',
      cat TEXT NOT NULL DEFAULT '',
      priority INTEGER NOT NULL DEFAULT 0,
      impressions BIGINT NOT NULL DEFAULT 0,
      clicks BIGINT NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT true,
      starts_at TIMESTAMPTZ,
      ends_at TIMESTAMPTZ,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_users_email
      ON users(email);

    CREATE INDEX IF NOT EXISTS idx_users_role
      ON users(role);

    CREATE INDEX IF NOT EXISTS idx_users_is_blocked
      ON users(is_blocked);

    CREATE INDEX IF NOT EXISTS idx_listings_cat
      ON listings(cat);

    CREATE INDEX IF NOT EXISTS idx_listings_subcategory
      ON listings(subcategory);

    CREATE INDEX IF NOT EXISTS idx_listings_status
      ON listings(status);

    CREATE INDEX IF NOT EXISTS idx_listings_created_at
      ON listings(created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_listings_owner
      ON listings(owner);

    CREATE INDEX IF NOT EXISTS idx_favorites_user
      ON favorites(user_id);

    CREATE INDEX IF NOT EXISTS idx_favorites_listing
      ON favorites(listing_id);

    CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user
      ON wallet_transactions(user_id);

    CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type
      ON wallet_transactions(type);

    CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status
      ON wallet_transactions(status);

    CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at
      ON wallet_transactions(created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_payment_orders_user
      ON payment_orders(user_id);

    CREATE INDEX IF NOT EXISTS idx_payment_orders_status
      ON payment_orders(status);

    CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at
      ON payment_orders(created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_saved_searches_user
      ON saved_searches(user_id);

    CREATE INDEX IF NOT EXISTS idx_saved_searches_alerts
      ON saved_searches(alerts_enabled);

    CREATE INDEX IF NOT EXISTS idx_seller_reviews_seller
      ON seller_reviews(seller_id);

    CREATE INDEX IF NOT EXISTS idx_seller_reviews_created_at
      ON seller_reviews(created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_ad_campaigns_placement
      ON ad_campaigns(placement);

    CREATE INDEX IF NOT EXISTS idx_ad_campaigns_active
      ON ad_campaigns(active);

    CREATE INDEX IF NOT EXISTS idx_ad_campaigns_cat
      ON ad_campaigns(cat);

    CREATE INDEX IF NOT EXISTS idx_listings_expires_at
      ON listings(expires_at);

    UPDATE listings
    SET expires_at = created_at + interval '60 days'
    WHERE status = 'approved'
      AND expires_at IS NULL;

    CREATE INDEX IF NOT EXISTS idx_messages_listing
      ON messages(listing_id);

    CREATE INDEX IF NOT EXISTS idx_messages_sender
      ON messages(sender_id);

    CREATE INDEX IF NOT EXISTS idx_messages_receiver
        ON messages(receiver_id);

    CREATE INDEX IF NOT EXISTS idx_messages_created_at
      ON messages(created_at DESC);

    ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS attachment_url TEXT;

    CREATE TABLE IF NOT EXISTS chat_thread_settings (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      peer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      is_archived BOOLEAN NOT NULL DEFAULT false,
      is_muted BOOLEAN NOT NULL DEFAULT false,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, listing_id, peer_id)
    );

    CREATE INDEX IF NOT EXISTS idx_chat_thread_settings_user_archived
      ON chat_thread_settings(user_id, is_archived);

    CREATE TABLE IF NOT EXISTS user_chat_blocks (
      blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (blocker_id, blocked_id)
    );

    CREATE INDEX IF NOT EXISTS idx_user_chat_blocks_blocker
      ON user_chat_blocks(blocker_id);

    CREATE TABLE IF NOT EXISTS user_compare_lists (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cat TEXT NOT NULL,
      entries JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, cat)
    );

    CREATE INDEX IF NOT EXISTS idx_user_compare_lists_user
      ON user_compare_lists(user_id, updated_at DESC);

    CREATE TABLE IF NOT EXISTS listing_drafts (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_listing_drafts_updated
      ON listing_drafts(updated_at DESC);

    CREATE TABLE IF NOT EXISTS listing_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'reviewed', 'dismissed')),
      reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
      reviewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (listing_id, reporter_id)
    );

    CREATE INDEX IF NOT EXISTS idx_listing_reports_status
      ON listing_reports(status);

    CREATE INDEX IF NOT EXISTS idx_listing_reports_listing
      ON listing_reports(listing_id);

    CREATE INDEX IF NOT EXISTS idx_listing_reports_created_at
      ON listing_reports(created_at DESC);

    CREATE TABLE IF NOT EXISTS admin_audit_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id UUID,
      details JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at
      ON admin_audit_log(created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action
      ON admin_audit_log(action);

    CREATE TABLE IF NOT EXISTS site_settings (
      id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_by UUID REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS user_events (
      id BIGSERIAL PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      session_id TEXT NOT NULL DEFAULT '',
      event_type TEXT NOT NULL,
      listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
      cat TEXT NOT NULL DEFAULT '',
      subcategory TEXT NOT NULL DEFAULT '',
      price TEXT NOT NULL DEFAULT '',
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      city TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_user_events_session_created
      ON user_events(session_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_user_events_user_created
      ON user_events(user_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_user_events_type_created
      ON user_events(event_type, created_at DESC);

    -- Subcategory is compared directly so the index can be used; older rows may
    -- still carry stray whitespace from earlier imports.
    UPDATE listings
    SET subcategory = TRIM(subcategory)
    WHERE subcategory <> TRIM(subcategory);
  `;

  // Re-applying ~130 DDL statements and recreating every RLS policy on each
  // boot delayed startup and made deploys briefly unreliable. The fingerprint
  // covers the schema text and the source of the functions that shape it, so
  // any change to either re-runs the migration automatically.
  const fingerprint = schemaFingerprint(schemaSql);
  const alreadyApplied = await isSchemaApplied(fingerprint);

  if (!alreadyApplied) {
    await query(schemaSql);
    await createOptionalIndexes();
    await setupRowLevelSecurity(query);
    await markSchemaApplied(fingerprint);
  } else {
    console.log("Schema already current, skipping migrations");
  }

  // Cheap and self-limiting: these read nothing once there is nothing to fix.
  await backfillPriceNum();
  await backfillRealEstateMeta();
  await migrateServiceCategories();
  await seedRealEstateDevelopments();
}

function schemaFingerprint(schemaSql) {
  return crypto
    .createHash("sha256")
    .update(schemaSql)
    .update(String(createOptionalIndexes))
    .update(String(setupRowLevelSecurity))
    .digest("hex");
}

async function isSchemaApplied(fingerprint) {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_state (
      id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      fingerprint TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const result = await query(
    `SELECT fingerprint FROM schema_state WHERE id = 1`
  );

  return result.rows[0]?.fingerprint === fingerprint;
}

async function markSchemaApplied(fingerprint) {
  await query(
    `
    INSERT INTO schema_state (id, fingerprint, applied_at)
    VALUES (1, $1, now())
    ON CONFLICT (id) DO UPDATE
      SET fingerprint = EXCLUDED.fingerprint,
          applied_at = now()
    `,
    [fingerprint]
  );
}

/**
 * Indexes matching the catalogue's real access patterns. They are applied one
 * by one and failures are logged rather than thrown: a missing index only
 * costs speed, while a failed statement here would stop the server booting
 * (trigram search, for instance, needs an extension the DB role may not be
 * allowed to create).
 */
async function createOptionalIndexes() {
  const statements = [
    `CREATE EXTENSION IF NOT EXISTS pg_trgm`,

    // Category pages: approved rows of one category, newest first.
    `CREATE INDEX IF NOT EXISTS idx_listings_approved_cat_created
       ON listings (cat, created_at DESC)
       WHERE status = 'approved'`,

    // Home and city pages sort promoted first, then by bump date.
    `CREATE INDEX IF NOT EXISTS idx_listings_approved_feed
       ON listings (cat, location, bumped_at DESC NULLS LAST, created_at DESC)
       WHERE status = 'approved'`,

    // Location filter had no index at all.
    `CREATE INDEX IF NOT EXISTS idx_listings_approved_location
       ON listings (location, created_at DESC)
       WHERE status = 'approved'`,

    // Seller profile and "my listings".
    `CREATE INDEX IF NOT EXISTS idx_listings_owner_status_created
       ON listings (owner, status, created_at DESC)`,

    // Popularity sort.
    `CREATE INDEX IF NOT EXISTS idx_listings_approved_views
       ON listings (views DESC NULLS LAST, created_at DESC)
       WHERE status = 'approved'`,

    // Search runs ILIKE '%text%', which only a trigram index can serve.
    `CREATE INDEX IF NOT EXISTS idx_listings_title_trgm
       ON listings USING gin (title gin_trgm_ops)`,

    `CREATE INDEX IF NOT EXISTS idx_listings_description_trgm
       ON listings USING gin (description gin_trgm_ops)`,

    // Spec filters read the JSONB column on every row.
    `CREATE INDEX IF NOT EXISTS idx_listings_specs_gin
       ON listings USING gin (specs jsonb_path_ops)`,

    // Seller-type filter resolves through users.
    `CREATE INDEX IF NOT EXISTS idx_users_seller_type_active
       ON users (seller_type)
       WHERE is_blocked = false`,

    // Price range filter and price sorting.
    `CREATE INDEX IF NOT EXISTS idx_listings_approved_price_num
       ON listings (price_num)
       WHERE status = 'approved' AND price_num IS NOT NULL`,
  ];

  for (const statement of statements) {
    try {
      await query(statement);
    } catch (e) {
      console.warn("INDEX_SKIPPED:", e?.message);
    }
  }
}

async function migrateServiceCategories() {
  const migrations = [
    {
      fromCat: "transport",
      fromSub: "Услуги для авто",
      toCat: "services",
      toSub: "Ремонт авто",
    },
    {
      fromCat: "phones",
      fromSub: "Ремонт и сервис телефонов",
      toCat: "services",
      toSub: "Ремонт телефонов и планшетов",
    },
    {
      fromCat: "services",
      fromSub: "Ремонт техники",
      toCat: "services",
      toSub: "Ремонт компьютеров и бытовой техники",
    },
  ];

  for (const item of migrations) {
    await query(
      `
      UPDATE listings
      SET cat = $3, subcategory = $4
      WHERE cat = $1 AND TRIM(subcategory) = $2
      `,
      [item.fromCat, item.fromSub, item.toCat, item.toSub]
    );
  }
}

async function seedRealEstateDevelopments() {
  const seeds = [
    {
      slug: "shohmansur-residence",
      name: "Shohmansur Residence",
      developer: "Oriyon Development",
      city: "Душанбе",
      district: "Шохмансур",
      address: "ул. Айни, 45",
      description:
        "Жилой комплекс бизнес-класса с подземной парковкой, детской площадкой и охраной.",
      image_url:
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
      completion_date: "Q4 2026",
      amenities: ["Парковка", "Охрана", "Лифт", "Детская площадка"],
      lat: 38.576,
      lng: 68.779,
    },
    {
      slug: "sino-park",
      name: "Sino Park",
      developer: "Sino Group",
      city: "Душанбе",
      district: "Сино",
      address: "102-й микрорайон",
      description:
        "Современный комплекс с зелёным двором, коммерческими помещениями на первых этажах.",
      image_url:
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
      completion_date: "Q2 2027",
      amenities: ["Зелёный двор", "Магазины", "Спортзал"],
      lat: 38.545,
      lng: 68.805,
    },
    {
      slug: "somoni-heights",
      name: "Somoni Heights",
      developer: "Capital Build",
      city: "Душанбе",
      district: "Исмоил Сомони",
      address: "пр. И. Сомони, 12",
      description:
        "Высотный дом с панорамными видами, отделкой white box и рассрочкой от застройщика.",
      image_url:
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
      completion_date: "Q1 2026",
      amenities: ["White box", "Панорамные окна", "Рассрочка"],
      lat: 38.561,
      lng: 68.798,
    },
  ];

  for (const item of seeds) {
    await query(
      `
      INSERT INTO re_developments (
        slug, name, developer, city, district, address, description,
        image_url, completion_date, amenities, lat, lng
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12)
      ON CONFLICT (slug) DO NOTHING
      `,
      [
        item.slug,
        item.name,
        item.developer,
        item.city,
        item.district,
        item.address,
        item.description,
        item.image_url,
        item.completion_date,
        JSON.stringify(item.amenities),
        item.lat,
        item.lng,
      ]
    );
  }
}

/**
 * Fills price_num for rows written before the column existed. Parsing happens
 * in JS so a malformed price yields null instead of aborting the statement,
 * and rows are updated in one batched statement per chunk.
 */
async function backfillPriceNum() {
  const { parsePriceValue } = require("./lib/priceValue");
  const BATCH_SIZE = 500;

  for (;;) {
    const result = await query(
      `
      SELECT id, price
      FROM listings
      WHERE price_num IS NULL
        AND price <> ''
      LIMIT $1
      `,
      [BATCH_SIZE]
    );

    if (!result.rows.length) return;

    const ids = [];
    const values = [];

    for (const row of result.rows) {
      const parsed = parsePriceValue(row.price);

      if (parsed === null) continue;

      ids.push(row.id);
      values.push(parsed);
    }

    if (ids.length) {
      await query(
        `
        UPDATE listings AS l
        SET price_num = v.price_num
        FROM (
          SELECT unnest($1::uuid[]) AS id, unnest($2::numeric[]) AS price_num
        ) AS v
        WHERE l.id = v.id
        `,
        [ids, values]
      );
    }

    // Rows whose price cannot be parsed would be re-read forever otherwise.
    if (ids.length < result.rows.length) return;
    if (result.rows.length < BATCH_SIZE) return;
  }
}

async function backfillRealEstateMeta() {
  const { extractRealEstateMeta } = require("./lib/realEstateMeta");

  const result = await query(
    `
    SELECT id, specs, price, location, re_lat, re_lng
    FROM listings
    WHERE cat = 'realestate'
      AND (
        re_area_sqm IS NULL
        OR re_price_per_sqm IS NULL
        OR re_deal_type IS NULL
      )
    LIMIT 1000
    `
  );

  for (const row of result.rows) {
    const meta = extractRealEstateMeta({
      specs: row.specs || [],
      price: row.price || "",
      location: row.location || "",
      lat: row.re_lat,
      lng: row.re_lng,
    });

    await query(
      `
      UPDATE listings
      SET
        re_deal_type = $2,
        re_rooms = $3,
        re_area_sqm = $4,
        re_floor = $5,
        re_floors_total = $6,
        re_district = $7,
        re_lat = COALESCE(re_lat, $8),
        re_lng = COALESCE(re_lng, $9),
        re_price_per_sqm = $10
      WHERE id = $1
      `,
      [
        row.id,
        meta.re_deal_type,
        meta.re_rooms,
        meta.re_area_sqm,
        meta.re_floor,
        meta.re_floors_total,
        meta.re_district,
        meta.re_lat,
        meta.re_lng,
        meta.re_price_per_sqm,
      ]
    );
  }
}

function mapUser(row) {
  if (!row) return null;

  return {
    id: row.id,
    _id: row.id,

    email: row.email,
    password: row.password,

    name: row.name,
    phone: row.phone,
    whatsapp: row.whatsapp || "",
    telegram: row.telegram || "",
    extraPhones: Array.isArray(row.extra_phones)
      ? row.extra_phones.map((p) => String(p || "").trim()).filter(Boolean)
      : [],

    lastSeen: row.last_seen || null,

    sellerType: row.seller_type,

    companyName: row.company_name || "",
    companyDescription: row.company_description || "",
    companyLogo: row.company_logo || "",
    companyAddress: row.company_address || "",
    companyWebsite: row.company_website || "",
    companyInstagram: row.company_instagram || "",
    businessVerified: Boolean(row.business_verified),
    businessVerifiedAt: row.business_verified_at || null,
    listingAutoBumpEnabled: Boolean(row.listing_auto_bump_enabled),
    listingAutoBumpIntervalHours: Number(
      row.listing_auto_bump_interval_hours || 24
    ),
    listingAutoBumpLastAt: row.listing_auto_bump_last_at || null,

    role: row.role || "user",
    isBlocked: Boolean(row.is_blocked),

    trustLevel: row.trust_level || "new",
    approvedListingsCount: Number(row.approved_listings_count || 0),

    emailVerified: row.email_verified,
    phoneVerified: Boolean(row.phone_verified),

    registrationDeviceType: row.registration_device_type || "",
    registrationDeviceModel: row.registration_device_model || "",
    registrationUserAgent: row.registration_user_agent || "",

    walletBalance: Number(row.wallet_balance || 0),

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapListing(row) {
  if (!row) return null;

  const now = Date.now();
  const vipUntil = row.vip_until || null;
  const topUntil = row.top_until || null;
  const vip =
    vipUntil && !Number.isNaN(Date.parse(vipUntil))
      ? Date.parse(vipUntil) > now
      : false;
  const top =
    topUntil && !Number.isNaN(Date.parse(topUntil))
      ? Date.parse(topUntil) > now
      : false;

  return {
  id: row.id,
  _id: row.id,

  publicId: row.public_id,
  public_id: row.public_id,

  title: row.title,

    price: row.price || "",

    description: row.description,

    location: row.location,

    cat: row.cat,
    subcategory: row.subcategory,

    images: row.images || [],
    specs: row.specs || [],

    owner: row.owner,

    ownerSellerType: row.owner_seller_type || null,
    ownerBusinessVerified: Boolean(row.owner_business_verified),
    ownerCompanyName: row.owner_company_name || "",

    status: row.status || "pending",
    rejectionReason: row.rejection_reason || "",
    moderatedBy: row.moderated_by || null,
    moderatedAt: row.moderated_at || null,

    moderationFlags: row.moderation_flags || [],
    previousSnapshot: row.previous_snapshot || null,
    autoModerationReason: row.auto_moderation_reason || "",
    appealStatus: row.appeal_status || "none",
    appealText: row.appeal_text || "",
    appealAt: row.appeal_at || null,

    views: Number(row.views || 0),

    vip,
    top,
    vipUntil,
    topUntil,
    bumpedAt: row.bumped_at || null,
    expiresAt: row.expires_at || null,
    expiryNoticeSentAt: row.expiry_notice_sent_at || null,

    reDealType: row.re_deal_type || null,
    reRooms: row.re_rooms || null,
    reAreaSqm:
      row.re_area_sqm != null ? Number(row.re_area_sqm) : null,
    reFloor: row.re_floor != null ? Number(row.re_floor) : null,
    reFloorsTotal:
      row.re_floors_total != null ? Number(row.re_floors_total) : null,
    reDistrict: row.re_district || null,
    reLat: row.re_lat != null ? Number(row.re_lat) : null,
    reLng: row.re_lng != null ? Number(row.re_lng) : null,
    rePricePerSqm:
      row.re_price_per_sqm != null ? Number(row.re_price_per_sqm) : null,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWalletTransaction(row) {
  if (!row) return null;

  return {
    id: row.id,
    _id: row.id,

    userId: row.user_id,

    type: row.type,
    amount: Number(row.amount || 0),
    status: row.status,

    description: row.description || "",

    createdBy: row.created_by || null,
    createdAt: row.created_at,
  };
}

function mapMessage(row) {
  if (!row) return null;

  return {
    id: row.id,
    _id: row.id,

    listingId: row.listing_id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,

    text: row.text,
    attachmentUrl: row.attachment_url || "",
    isRead: Boolean(row.is_read),
    unreadCount: Number(row.unread_count || 0),

    listingTitle: row.listing_title || "",
    listingImage: row.listing_image || "",
    listingPrice: row.listing_price ?? null,
    listingStatus: row.listing_status || "",
    listingCreatedAt: row.listing_created_at || null,
    listingOwner: row.listing_owner || null,
    sellerId: row.seller_id || null,
    peerBuyerId: row.peer_buyer_id || null,

    senderLastSeen: row.sender_last_seen || null,
    receiverLastSeen: row.receiver_last_seen || null,

    senderName: row.sender_name || "",
    senderEmail: row.sender_email || "",

    receiverName: row.receiver_name || "",
    receiverEmail: row.receiver_email || "",

    createdAt: row.created_at,
  };
}

module.exports = {
  pool,
  query,
  initDb,
  runWithRlsContext,
  mapUser,
  mapListing,
  mapWalletTransaction,
  mapMessage,

  USER_ROLES,
  LISTING_STATUSES,
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES,
  PAYMENT_ORDER_STATUSES,
};