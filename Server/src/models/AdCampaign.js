const { query } = require("../db");
const { assertEnumValue } = require("../lib/sqlSafety");
const { sanitizeAdHtml, assertAdUrls } = require("../lib/adContent");
const { isAllowedLinkUrl } = require("../lib/mediaUrl");

const PLACEMENTS = [
  "home_mid",
  "listing_top",
  "listing_feed",
  "category_feed",
  "ad_details_mid",
  "ad_sidebar",
  "footer",
];

const FORMATS = ["banner", "native", "html"];

function mapAdCampaign(row) {
  if (!row) return null;

  return {
    id: row.id,
    title: row.title || "",
    advertiser: row.advertiser || "",
    placement: row.placement,
    format: row.format || "banner",
    imageUrl: isAllowedLinkUrl(row.image_url) ? row.image_url : "",
    linkUrl: isAllowedLinkUrl(row.link_url) ? row.link_url : "",
    headline: row.headline || "",
    description: row.description || "",
    // Sanitized on read as well so campaigns stored before validation existed
    // cannot inject script into visitors' pages.
    htmlCode: sanitizeAdHtml(row.html_code),
    cat: row.cat || "",
    priority: Number(row.priority || 0),
    impressions: Number(row.impressions || 0),
    clicks: Number(row.clicks || 0),
    active: Boolean(row.active),
    startsAt: row.starts_at || null,
    endsAt: row.ends_at || null,
    createdBy: row.created_by || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildActiveWhere({ placement, cat = "" } = {}) {
  const values = [];
  let where = `
    active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  `;

  if (placement) {
    values.push(placement);
    where += ` AND placement = $${values.length}`;
  }

  if (cat) {
    values.push(cat);
    where += ` AND (cat = '' OR cat = $${values.length})`;
  } else {
    where += ` AND cat = ''`;
  }

  return { where, values };
}

class AdCampaignModel {
  static getPlacements() {
    return PLACEMENTS;
  }

  static getFormats() {
    return FORMATS;
  }

  static async listActive({ placement, cat = "" } = {}) {
    assertEnumValue(placement, PLACEMENTS, "PLACEMENT");

    const { where, values } = buildActiveWhere({ placement, cat });

    const result = await query(
      `
      SELECT *
      FROM ad_campaigns
      WHERE ${where}
      ORDER BY priority DESC, created_at DESC
      LIMIT 20
      `,
      values
    );

    return result.rows.map(mapAdCampaign);
  }

  static async listAll() {
    const result = await query(
      `
      SELECT *
      FROM ad_campaigns
      ORDER BY active DESC, priority DESC, created_at DESC
      `
    );

    return result.rows.map(mapAdCampaign);
  }

  static async findById(id) {
    const result = await query(
      `
      SELECT *
      FROM ad_campaigns
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    return mapAdCampaign(result.rows[0]);
  }

  static async create(data, createdBy = null) {
    assertAdUrls(data);

    const result = await query(
      `
      INSERT INTO ad_campaigns (
        title,
        advertiser,
        placement,
        format,
        image_url,
        link_url,
        headline,
        description,
        html_code,
        cat,
        priority,
        active,
        starts_at,
        ends_at,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
      `,
      [
        String(data.title || "").trim(),
        String(data.advertiser || "").trim(),
        data.placement,
        data.format || "banner",
        String(data.imageUrl || "").trim(),
        String(data.linkUrl || "").trim(),
        String(data.headline || "").trim(),
        String(data.description || "").trim(),
        sanitizeAdHtml(data.htmlCode),
        String(data.cat || "").trim(),
        Number(data.priority || 0),
        data.active !== false,
        data.startsAt || null,
        data.endsAt || null,
        createdBy,
      ]
    );

    return mapAdCampaign(result.rows[0]);
  }

  static async update(id, data) {
    assertAdUrls(data);

    const result = await query(
      `
      UPDATE ad_campaigns
      SET
        title = $2,
        advertiser = $3,
        placement = $4,
        format = $5,
        image_url = $6,
        link_url = $7,
        headline = $8,
        description = $9,
        html_code = $10,
        cat = $11,
        priority = $12,
        active = $13,
        starts_at = $14,
        ends_at = $15,
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [
        id,
        String(data.title || "").trim(),
        String(data.advertiser || "").trim(),
        data.placement,
        data.format || "banner",
        String(data.imageUrl || "").trim(),
        String(data.linkUrl || "").trim(),
        String(data.headline || "").trim(),
        String(data.description || "").trim(),
        sanitizeAdHtml(data.htmlCode),
        String(data.cat || "").trim(),
        Number(data.priority || 0),
        data.active !== false,
        data.startsAt || null,
        data.endsAt || null,
      ]
    );

    return mapAdCampaign(result.rows[0]);
  }

  static async remove(id) {
    const result = await query(
      `
      DELETE FROM ad_campaigns
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    return Boolean(result.rows[0]);
  }

  static async track(id, type) {
    const sql =
      type === "click"
        ? `
      UPDATE ad_campaigns
      SET clicks = clicks + 1, updated_at = now()
      WHERE id = $1
      RETURNING impressions, clicks
      `
        : `
      UPDATE ad_campaigns
      SET impressions = impressions + 1, updated_at = now()
      WHERE id = $1
      RETURNING impressions, clicks
      `;

    const result = await query(sql, [id]);

    return result.rows[0] || null;
  }

  static async getStats() {
    const result = await query(
      `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE active = true)::int AS active,
        COALESCE(SUM(impressions), 0)::bigint AS impressions,
        COALESCE(SUM(clicks), 0)::bigint AS clicks
      FROM ad_campaigns
      `
    );

    const row = result.rows[0] || {};

    return {
      total: Number(row.total || 0),
      active: Number(row.active || 0),
      impressions: Number(row.impressions || 0),
      clicks: Number(row.clicks || 0),
    };
  }
}

module.exports = AdCampaignModel;
