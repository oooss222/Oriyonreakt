const { Pool } = require("pg");

const DATABASE_URL =
  process.env.DATABASE_URL || process.env.POSTGRES_URL;

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

const pool = new Pool(
  DATABASE_URL
    ? {
        connectionString: DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        query_timeout: 10000,
        statement_timeout: 10000,
      }
    : {
        host: process.env.PGHOST || "localhost",
        port: Number(process.env.PGPORT || 5432),
        database: process.env.PGDATABASE || "oriyon",
        user: process.env.PGUSER || "postgres",
        password: process.env.PGPASSWORD || "password",
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        query_timeout: 10000,
        statement_timeout: 10000,
      }
);
pool.on("error", (err) => {
  console.error("POSTGRES_POOL_ERROR:", err);
});

async function query(text, params = []) {
  return pool.query(text, params);
}

async function initDb() {
  await query(`
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

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'listings_status_check'
      ) THEN
        ALTER TABLE listings
          ADD CONSTRAINT listings_status_check
          CHECK (status IN ('pending', 'approved', 'rejected'));
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS favorites (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, listing_id)
    );

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

        CREATE TABLE IF NOT EXISTS ads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      title TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL,
      target_url TEXT NOT NULL DEFAULT '',

      placement TEXT NOT NULL DEFAULT 'home_top'
        CHECK (
          placement IN (
            'home_top',
            'home_middle',
            'listing_top',
            'listing_sidebar',
            'details_sidebar'
          )
        ),

      is_active BOOLEAN NOT NULL DEFAULT true,

      created_by UUID REFERENCES users(id) ON DELETE SET NULL,

      starts_at TIMESTAMPTZ,
      ends_at TIMESTAMPTZ,

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

    CREATE INDEX IF NOT EXISTS idx_ads_placement
      ON ads(placement);

    CREATE INDEX IF NOT EXISTS idx_ads_is_active
      ON ads(is_active);
  `);
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

    sellerType: row.seller_type,

    role: row.role || "user",
    isBlocked: Boolean(row.is_blocked),

    emailVerified: row.email_verified,

    walletBalance: Number(row.wallet_balance || 0),

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapListing(row) {
  if (!row) return null;

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

    status: row.status || "pending",
    rejectionReason: row.rejection_reason || "",
    moderatedBy: row.moderated_by || null,
    moderatedAt: row.moderated_at || null,

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

function mapAd(row) {
  if (!row) return null;

  return {
    id: row.id,
    _id: row.id,

    title: row.title,

    imageUrl: row.image_url,
    targetUrl: row.target_url,

    placement: row.placement,

    isActive: Boolean(row.is_active),

    createdBy: row.created_by || null,

    startsAt: row.starts_at || null,
    endsAt: row.ends_at || null,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  pool,
  query,
  initDb,
  mapUser,
  mapListing,
  mapWalletTransaction,
  mapAd,

  USER_ROLES,
  LISTING_STATUSES,
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES,
};