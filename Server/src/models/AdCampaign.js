const { query } = require("../db");
const { assertEnumValue } = require("../lib/sqlSafety");
const {
  sanitizeAdHtml,
  assertAdUrls,
  isRenderableAdImage,
  isSafeAdDestination,
} = require("../lib/adContent");
const { listPlacements, FORMATS } = require("../lib/adPlacements");

function textArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function nullableNumber(value) {
  if (value === undefined || value === null || value === "") return null;

  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : null;
}

function mapAdCampaign(row) {
  if (!row) return null;

  return {
    id: row.id,
    title: row.title || "",
    advertiser: row.advertiser || "",
    placement: row.placement,
    format: row.format || "banner",
    imageUrl: isRenderableAdImage(row.image_url) ? row.image_url : "",
    imageMobile: isRenderableAdImage(row.image_mobile) ? row.image_mobile : "",
    imageApp: isRenderableAdImage(row.image_app) ? row.image_app : "",
    linkUrl: isSafeAdDestination(row.link_url) ? row.link_url : "",
    deeplink: isSafeAdDestination(row.deeplink) ? row.deeplink : "",
    headline: row.headline || "",
    description: row.description || "",
    // Sanitized on read as well so campaigns stored before validation existed
    // cannot inject script into visitors' pages.
    htmlCode: sanitizeAdHtml(row.html_code),
    networkCode: String(row.network_code || ""),
    cat: row.cat || "",
    categories: row.categories || [],
    cities: row.cities || [],
    devices: row.devices || [],
    languages: row.languages || [],
    keywords: row.keywords || [],
    placements: row.placements || [],
    platforms: row.platforms || ["web"],
    minAppVersion: row.min_app_version || "",
    frequencyCap: Number(row.frequency_cap || 0),
    weight: Number(row.weight || 1),
    impressionLimit: row.impression_limit == null ? null : Number(row.impression_limit),
    clickLimit: row.click_limit == null ? null : Number(row.click_limit),
    contractAmount: row.contract_amount == null ? null : Number(row.contract_amount),
    status: row.status || (row.active ? "active" : "paused"),
    advertiserId: row.advertiser_id || null,
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

function campaignStatus(data) {
  const explicit = String(data.status || "").trim();

  if (["draft", "active", "paused", "ended"].includes(explicit)) {
    return explicit;
  }

  return data.active === false ? "paused" : "active";
}

function campaignValues(data, status, createdBy) {
  const placements = textArray(data.placements);
  const placement = String(data.placement || placements[0] || "listing_top").trim();
  const values = [
    String(data.title || "").trim(),
    String(data.advertiser || "").trim(),
    data.advertiserId || null,
    placement,
    placements.length ? placements : [placement],
    data.format || "banner",
    String(data.imageUrl || "").trim(),
    String(data.imageMobile || "").trim(),
    String(data.imageApp || "").trim(),
    String(data.linkUrl || "").trim(),
    String(data.deeplink || "").trim(),
    String(data.headline || "").trim(),
    String(data.description || "").trim(),
    sanitizeAdHtml(data.htmlCode),
    String(data.networkCode || "").trim(),
    String(data.cat || "").trim(),
    textArray(data.categories),
    textArray(data.cities),
    textArray(data.devices),
    textArray(data.languages),
    textArray(data.keywords),
    textArray(data.platforms).length ? textArray(data.platforms) : ["web"],
    String(data.minAppVersion || "").trim(),
    Math.max(0, Number(data.frequencyCap || 0)),
    Math.max(1, Number(data.weight || 1)),
    nullableNumber(data.impressionLimit),
    nullableNumber(data.clickLimit),
    nullableNumber(data.contractAmount),
    Number(data.priority || 0),
    status === "active",
    status,
    data.startsAt || null,
    data.endsAt || null,
  ];

  if (createdBy !== undefined) {
    values.push(createdBy);
  }

  return values;
}

async function syncCreative(campaignId, data) {
  const existing = await query(
    `
    SELECT id
    FROM ad_creatives
    WHERE campaign_id = $1
    ORDER BY created_at ASC
    LIMIT 1
    `,
    [campaignId]
  );

  const params = [
    data.format || "banner",
    String(data.imageUrl || "").trim(),
    String(data.imageMobile || data.imageUrl || "").trim(),
    String(data.imageApp || data.imageUrl || "").trim(),
    String(data.headline || "").trim(),
    String(data.description || "").trim(),
    String(data.linkUrl || "").trim(),
    String(data.deeplink || "").trim(),
    sanitizeAdHtml(data.htmlCode),
    String(data.networkCode || "").trim(),
    Math.max(1, Number(data.weight || 1)),
  ];

  if (existing.rows[0]) {
    await query(
      `
      UPDATE ad_creatives
      SET
        type = $2,
        image_desktop = $3,
        image_mobile = $4,
        image_app = $5,
        headline = $6,
        body = $7,
        click_url = $8,
        deeplink = $9,
        html_code = $10,
        network_code = $11,
        weight = $12
      WHERE id = $1
      `,
      [existing.rows[0].id, ...params]
    );

    return;
  }

  await query(
    `
    INSERT INTO ad_creatives (
      campaign_id, type, image_desktop, image_mobile, image_app,
      headline, body, click_url, deeplink, html_code, network_code, weight
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `,
    [campaignId, ...params]
  );
}

class AdCampaignModel {
  static getPlacements() {
    return listPlacements();
  }

  static getFormats() {
    return FORMATS;
  }

  static async listActive({ placement, cat = "" } = {}) {
    assertEnumValue(placement, listPlacements(), "PLACEMENT");

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
    assertEnumValue(data.placement, listPlacements(), "PLACEMENT");

    const status = campaignStatus(data);
    const result = await query(
      `
      INSERT INTO ad_campaigns (
        title, advertiser, advertiser_id, placement, placements, format,
        image_url, image_mobile, image_app, link_url, deeplink, headline,
        description, html_code, network_code, cat, categories, cities, devices,
        languages, keywords, platforms, min_app_version, frequency_cap, weight,
        impression_limit, click_limit, contract_amount, priority, active, status,
        starts_at, ends_at, created_by
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25,
        $26, $27, $28, $29, $30, $31,
        $32, $33, $34
      )
      RETURNING *
      `,
      campaignValues(data, status, createdBy)
    );

    const campaign = mapAdCampaign(result.rows[0]);
    await syncCreative(campaign.id, data);

    return campaign;
  }

  static async update(id, data) {
    assertAdUrls(data);

    if (data.placement) {
      assertEnumValue(data.placement, listPlacements(), "PLACEMENT");
    }

    const status = campaignStatus(data);
    const result = await query(
      `
      UPDATE ad_campaigns
      SET
        title = $2,
        advertiser = $3,
        advertiser_id = COALESCE($4, advertiser_id),
        placement = $5,
        placements = $6,
        format = $7,
        image_url = $8,
        image_mobile = $9,
        image_app = $10,
        link_url = $11,
        deeplink = $12,
        headline = $13,
        description = $14,
        html_code = $15,
        network_code = $16,
        cat = $17,
        categories = $18,
        cities = $19,
        devices = $20,
        languages = $21,
        keywords = $22,
        platforms = $23,
        min_app_version = $24,
        frequency_cap = $25,
        weight = $26,
        impression_limit = $27,
        click_limit = $28,
        contract_amount = $29,
        priority = $30,
        active = $31,
        status = $32,
        starts_at = $33,
        ends_at = $34,
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id, ...campaignValues(data, status)]
    );

    if (!result.rows[0]) return null;

    await syncCreative(id, data);

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
