const { query } = require("../db");

const SUPPORT_TITLE = "Oriyon Premium — консультация";
const SUPPORT_CAT = "support";

async function findSupportAdmin() {
  const result = await query(
    `
    SELECT id, name
    FROM users
    WHERE role IN ('super_admin', 'admin')
      AND is_blocked = false
    ORDER BY
      CASE WHEN role = 'super_admin' THEN 0 ELSE 1 END,
      created_at ASC
    LIMIT 1
    `
  );

  return result.rows[0] || null;
}

async function findExistingSupportListing() {
  const result = await query(
    `
    SELECT
      l.id,
      l.owner,
      u.name AS admin_name
    FROM listings l
    JOIN users u ON u.id = l.owner
    WHERE l.title = $1
      AND l.cat = $2
    LIMIT 1
    `,
    [SUPPORT_TITLE, SUPPORT_CAT]
  );

  return result.rows[0] || null;
}

async function createSupportListing(adminId) {
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
      '',
      'Служебный диалог для консультаций по премиум-аккаунту Oriyon',
      '',
      $2,
      '',
      '[]'::jsonb,
      '[]'::jsonb,
      $3,
      'archived',
      ''
    )
    RETURNING id, owner
    `,
    [SUPPORT_TITLE, SUPPORT_CAT, adminId]
  );

  return result.rows[0];
}

async function getBusinessSupportContact() {
  let listing = await findExistingSupportListing();

  if (!listing) {
    const admin = await findSupportAdmin();

    if (!admin) {
      throw new Error("NO_SUPPORT_ADMIN");
    }

    const created = await createSupportListing(admin.id);

    listing = {
      id: created.id,
      owner: created.owner,
      admin_name: admin.name,
    };
  }

  return {
    listingId: listing.id,
    adminId: listing.owner,
    adminName: listing.admin_name || "Администратор Oriyon",
    title: SUPPORT_TITLE,
  };
}

module.exports = {
  SUPPORT_TITLE,
  SUPPORT_CAT,
  getBusinessSupportContact,
};
