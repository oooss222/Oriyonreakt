const crypto = require("crypto");
const { query } = require("../db");
const { runWithRlsContext, SYSTEM_CONTEXT } = require("./rlsContext");
const { sanitizeAdHtml } = require("./adContent");
const { isAllowedLinkUrl } = require("./mediaUrl");
const {
  codesFor,
  findPlacement,
  placementMatchesPlatform,
  PLACEMENTS,
} = require("./adPlacements");

const BOT_UA =
  /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|wget|curl|python-requests|scrapy/i;

function isBotUserAgent(userAgent) {
  return BOT_UA.test(String(userAgent || ""));
}

function versionAtLeast(current, minimum) {
  const min = String(minimum || "").trim();

  if (!min) return true;

  const parse = (value) =>
    String(value || "0")
      .split(".")
      .map((part) => Number.parseInt(part, 10) || 0);

  const left = parse(current);
  const right = parse(min);

  for (let index = 0; index < 3; index += 1) {
    const a = left[index] || 0;
    const b = right[index] || 0;

    if (a > b) return true;
    if (a < b) return false;
  }

  return true;
}

function weightedPick(items) {
  if (!items.length) return null;

  const maxPriority = Math.max(...items.map((item) => Number(item.priority) || 0));
  const pool = items.filter((item) => (Number(item.priority) || 0) === maxPriority);
  const total = pool.reduce((sum, item) => sum + Math.max(1, Number(item.weight) || 1), 0);
  let cursor = Math.random() * total;

  for (const item of pool) {
    cursor -= Math.max(1, Number(item.weight) || 1);

    if (cursor <= 0) return item;
  }

  return pool[pool.length - 1];
}

function pickMany(items, limit) {
  const selected = [];
  let pool = [...items];
  const size = Math.max(1, Number(limit) || 1);

  while (pool.length && selected.length < size) {
    const next = weightedPick(pool);

    if (!next) break;

    selected.push(next);
    pool = pool.filter((item) => item.key !== next.key);
  }

  return selected;
}

function hashValue(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex").slice(0, 32);
}

function isRenderableAdImage(url) {
  const value = String(url || "").trim();

  if (!value || value.includes("..")) return false;
  if (value.startsWith("/ads/") || value.startsWith("/uploads/")) return true;

  return isAllowedLinkUrl(value);
}

function isSafeAdDestination(url) {
  const value = String(url || "").trim();

  if (!value || value.includes("..") || value.includes("\\")) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (/^diyor:\/\//i.test(value)) return true;

  return isAllowedLinkUrl(value);
}

function textList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return [];
}

function includesOrEmpty(list, value) {
  const items = textList(list);

  if (!items.length) return true;

  const needle = String(value || "").trim().toLowerCase();

  if (!needle) return false;

  return items.some((item) => item.toLowerCase() === needle);
}

function platformAllowed(platforms, platform) {
  const items = textList(platforms);
  const normalized = String(platform || "web").toLowerCase();

  if (!items.length) return true;
  if (items.includes(normalized)) return true;
  if ((normalized === "ios" || normalized === "android") && items.includes("app")) return true;
  if (normalized === "web" && items.includes("site")) return true;

  return false;
}

function categoryAllowed(row, category) {
  const targeted = textList(row.categories);
  const legacy = String(row.cat || "").trim();
  const rules = targeted.length ? targeted : legacy ? [legacy] : [];

  if (!rules.length) return true;
  if (!category) return false;

  const needle = category.toLowerCase();

  return rules.some((item) => item.toLowerCase() === needle);
}

function keywordAllowed(keywords, query, placement) {
  const items = textList(keywords).map((item) => item.toLowerCase());
  const isSearch = String(placement || "").includes("search");

  if (!items.length || !isSearch) return true;

  const haystack = String(query || "").trim().toLowerCase();

  if (!haystack) return false;

  return items.some((item) => haystack.includes(item));
}

function pickImage(row, platform, device) {
  const desktop = isRenderableAdImage(row.image_desktop) ? row.image_desktop : "";
  const mobile = isRenderableAdImage(row.image_mobile) ? row.image_mobile : "";
  const app = isRenderableAdImage(row.image_app) ? row.image_app : "";
  const legacy = isRenderableAdImage(row.image_url) ? row.image_url : "";
  const normalized = String(platform || "web").toLowerCase();

  if (normalized === "ios" || normalized === "android") {
    return app || mobile || desktop || legacy;
  }

  if (device === "mobile") {
    return mobile || desktop || legacy || app;
  }

  return desktop || legacy || mobile || app;
}

function mapCreative(row, { platform, device, placement }) {
  const creativeId = row.creative_id || null;
  const campaignId = row.id;
  const link = isSafeAdDestination(row.click_url) ? row.click_url : "";
  const legacyLink = isSafeAdDestination(row.link_url) ? row.link_url : "";
  const deeplink = isSafeAdDestination(row.deeplink) ? row.deeplink : "";
  const destination = link || legacyLink || deeplink;
  const params = new URLSearchParams();

  if (creativeId) params.set("creative", creativeId);
  if (placement) params.set("placement", placement);

  return {
    id: creativeId || campaignId,
    campaignId,
    creativeId,
    format: row.creative_type || row.format || "banner",
    title: row.title || "",
    headline: row.creative_headline || row.headline || "",
    description: row.creative_body || row.description || "",
    imageUrl: pickImage(row, platform, device),
    imageDesktop: isRenderableAdImage(row.image_desktop) ? row.image_desktop : "",
    imageMobile: isRenderableAdImage(row.image_mobile) ? row.image_mobile : "",
    imageApp: isRenderableAdImage(row.image_app) ? row.image_app : "",
    linkUrl: destination,
    deeplink,
    htmlCode: sanitizeAdHtml(row.creative_html || row.html_code),
    networkCode: String(row.network_code || "").slice(0, 500),
    advertiser: row.advertiser || "",
    placement: row.placement,
    priority: Number(row.priority || 0),
    weight: Number(row.creative_weight || row.weight || 1),
    clickPath: `/api/ads/click/${campaignId}${params.toString() ? `?${params.toString()}` : ""}`,
  };
}

function rowKey(row) {
  return `${row.id}:${row.creative_id || "campaign"}`;
}

async function loadPlacement(code) {
  const result = await query(
    `
    SELECT code, enabled, config
    FROM ad_placements
    WHERE code = $1
    LIMIT 1
    `,
    [code]
  );

  return result.rows[0] || null;
}

async function loadFrequency(viewerKey, creativeIds) {
  if (!viewerKey || !creativeIds.length) return new Map();

  const result = await runWithRlsContext(SYSTEM_CONTEXT, () =>
    query(
      `
      SELECT creative_id, count
      FROM ad_frequency
      WHERE viewer_key = $1
        AND day = CURRENT_DATE
        AND creative_id = ANY($2::uuid[])
      `,
      [viewerKey, creativeIds]
    )
  );

  return new Map(result.rows.map((row) => [String(row.creative_id), Number(row.count || 0)]));
}

async function selectAds(input = {}) {
  const placement = String(input.placement || "").trim();
  const platform = String(input.platform || "web").toLowerCase();
  const category = String(input.category || input.cat || "").trim();
  const city = String(input.city || "").trim();
  const device = String(input.device || "").trim().toLowerCase();
  const appVersion = String(input.appVersion || input.app_version || "").trim();
  const search = String(input.q || input.search || "").trim();
  const language = String(input.lang || "").trim().toLowerCase();
  const viewer = String(input.viewer || "").trim().slice(0, 80);
  const definition = findPlacement(placement);
  const slot = await loadPlacement(placement).catch(() => null);

  if (slot && slot.enabled === false) {
    return { items: [], interval: Number(slot.config?.interval || definition?.config?.interval || 8) };
  }

  if (definition && !placementMatchesPlatform(definition, platform)) {
    return { items: [], interval: 8 };
  }

  const codes = codesFor(placement);
  const result = await query(
    `
    SELECT
      c.*,
      cr.id AS creative_id,
      cr.type AS creative_type,
      cr.image_desktop,
      COALESCE(NULLIF(cr.image_mobile, ''), c.image_mobile) AS image_mobile,
      COALESCE(NULLIF(cr.image_app, ''), c.image_app) AS image_app,
      cr.headline AS creative_headline,
      cr.body AS creative_body,
      cr.click_url,
      COALESCE(NULLIF(cr.deeplink, ''), c.deeplink) AS deeplink,
      cr.html_code AS creative_html,
      COALESCE(NULLIF(cr.network_code, ''), c.network_code) AS network_code,
      cr.weight AS creative_weight
    FROM ad_campaigns c
    LEFT JOIN ad_creatives cr
      ON cr.campaign_id = c.id
     AND cr.active = true
    WHERE c.active = true
      AND COALESCE(NULLIF(c.status, ''), 'active') = 'active'
      AND (c.starts_at IS NULL OR c.starts_at <= now())
      AND (c.ends_at IS NULL OR c.ends_at >= now())
      AND (
        c.placement = ANY($1::text[])
        OR c.placements && $1::text[]
      )
    ORDER BY c.priority DESC, c.created_at DESC
    LIMIT 80
    `,
    [codes]
  );

  const creativeIds = result.rows.map((row) => row.creative_id).filter(Boolean);
  const frequency = await loadFrequency(viewer, creativeIds);
  const eligible = [];

  for (const row of result.rows) {
    if (row.impression_limit && Number(row.impressions) >= Number(row.impression_limit)) continue;
    if (row.click_limit && Number(row.clicks) >= Number(row.click_limit)) continue;
    if (!platformAllowed(row.platforms, platform)) continue;
    if (!versionAtLeast(appVersion, row.min_app_version)) continue;
    if (!categoryAllowed(row, category)) continue;
    if (!includesOrEmpty(row.cities, city)) continue;
    if (!includesOrEmpty(row.devices, device)) continue;
    if (!includesOrEmpty(row.languages, language)) continue;
    if (!keywordAllowed(row.keywords, search, placement)) continue;

    const format = row.creative_type || row.format || "banner";

    if (format === "html" && platform !== "web") continue;

    const cap = Number(row.frequency_cap || 0);
    const seen = frequency.get(String(row.creative_id)) || 0;

    if (cap > 0 && row.creative_id && seen >= cap) continue;

    eligible.push({ ...row, key: rowKey(row) });
  }

  const interval = Number(slot?.config?.interval || definition?.config?.interval || 8);
  const carousel = Boolean(slot?.config?.carousel || definition?.config?.carousel);
  const chosen = pickMany(eligible, carousel ? 6 : 1);

  return {
    items: chosen.map((row) => mapCreative(row, { platform, device, placement })),
    interval,
  };
}

async function recordEvent({
  campaignId,
  creativeId = null,
  placement = "",
  platform = "web",
  eventType,
  viewer = "",
  ip = "",
  userAgent = "",
}) {
  if (!campaignId || !["impression", "click"].includes(eventType)) {
    return { counted: false };
  }

  if (isBotUserAgent(userAgent)) {
    return { counted: false, reason: "bot" };
  }

  const viewerKey = String(viewer || "").trim().slice(0, 80);
  const ipHash = hashValue(ip || "unknown");
  const windowSeconds = eventType === "click" ? 30 : 2;

  return runWithRlsContext(SYSTEM_CONTEXT, async () => {
    const duplicate = await query(
      `
      SELECT id
      FROM ad_events
      WHERE campaign_id = $1
        AND event_type = $2
        AND created_at > now() - ($3 || ' seconds')::interval
        AND (
          ($4 <> '' AND viewer_key = $4)
          OR ip_hash = $5
        )
        AND ($6::uuid IS NULL OR creative_id IS NOT DISTINCT FROM $6::uuid)
      LIMIT 1
      `,
      [campaignId, eventType, String(windowSeconds), viewerKey, ipHash, creativeId || null]
    );

    if (duplicate.rows[0]) {
      return { counted: false, reason: "duplicate" };
    }

    await query(
      `
      INSERT INTO ad_events (
        campaign_id, creative_id, placement, platform, event_type, viewer_key, ip_hash
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        campaignId,
        creativeId || null,
        String(placement || "").slice(0, 80),
        String(platform || "web").slice(0, 20),
        eventType,
        viewerKey,
        ipHash,
      ]
    );

    const column = eventType === "click" ? "clicks" : "impressions";

    await query(
      `
      UPDATE ad_campaigns
      SET ${column} = ${column} + 1, updated_at = now()
      WHERE id = $1
      `,
      [campaignId]
    );

    if (eventType === "impression" && creativeId && viewerKey) {
      await query(
        `
        INSERT INTO ad_frequency (viewer_key, creative_id, day, count)
        VALUES ($1, $2, CURRENT_DATE, 1)
        ON CONFLICT (viewer_key, creative_id, day)
        DO UPDATE SET count = ad_frequency.count + 1
        `,
        [viewerKey, creativeId]
      );
    }

    return { counted: true };
  });
}

async function resolveClick(campaignId, creativeId) {
  const result = await query(
    `
    SELECT
      c.id,
      c.link_url,
      c.deeplink AS campaign_deeplink,
      c.active,
      cr.click_url,
      cr.deeplink
    FROM ad_campaigns c
    LEFT JOIN ad_creatives cr
      ON cr.campaign_id = c.id
     AND ($2::uuid IS NULL OR cr.id = $2::uuid)
    WHERE c.id = $1
    ORDER BY cr.created_at NULLS LAST
    LIMIT 1
    `,
    [campaignId, creativeId || null]
  );

  const row = result.rows[0];

  if (!row) return null;

  const link = [row.click_url, row.link_url, row.deeplink, row.campaign_deeplink].find((value) =>
    isSafeAdDestination(value)
  );

  return {
    url: link || "",
    deeplink: isSafeAdDestination(row.deeplink || row.campaign_deeplink)
      ? row.deeplink || row.campaign_deeplink
      : "",
  };
}

async function placementConfig(platform) {
  const normalized = String(platform || "web").toLowerCase();
  const wanted = normalized === "ios" || normalized === "android" || normalized === "app" ? "app" : "web";
  let rows = [];

  try {
    const result = await query(
      `
      SELECT code, title, platform, width, height, mobile_width, mobile_height, enabled, config
      FROM ad_placements
      WHERE platform = $1
      ORDER BY sort_order ASC, code ASC
      `,
      [wanted]
    );

    rows = result.rows;
  } catch {
    rows = [];
  }

  const fromDb = new Map(rows.map((row) => [row.code, row]));

  return PLACEMENTS.filter((item) => item.platform === wanted).map((item) => {
    const stored = fromDb.get(item.code);

    return {
      code: item.code,
      title: stored?.title || item.title,
      platform: item.platform,
      width: item.width,
      height: item.height,
      mobileWidth: item.mobileWidth,
      mobileHeight: item.mobileHeight,
      enabled: stored ? Boolean(stored.enabled) : item.enabled,
      config: stored?.config || item.config || {},
    };
  });
}

async function dailyStats({ from, to } = {}) {
  const result = await runWithRlsContext(SYSTEM_CONTEXT, () =>
    query(
      `
      SELECT
        date_trunc('day', created_at)::date AS day,
        platform,
        placement,
        campaign_id,
        COUNT(*) FILTER (WHERE event_type = 'impression')::int AS impressions,
        COUNT(*) FILTER (WHERE event_type = 'click')::int AS clicks
      FROM ad_events
      WHERE created_at >= COALESCE($1::timestamptz, now() - interval '30 days')
        AND created_at < COALESCE($2::timestamptz, now() + interval '1 day')
      GROUP BY 1, 2, 3, 4
      ORDER BY 1 DESC, impressions DESC
      LIMIT 500
      `,
      [from || null, to || null]
    )
  );

  return result.rows.map((row) => ({
    day: row.day,
    platform: row.platform,
    placement: row.placement,
    campaignId: row.campaign_id,
    impressions: Number(row.impressions || 0),
    clicks: Number(row.clicks || 0),
    ctr: row.impressions
      ? Number(((Number(row.clicks) / Number(row.impressions)) * 100).toFixed(2))
      : 0,
  }));
}

module.exports = {
  isBotUserAgent,
  versionAtLeast,
  weightedPick,
  pickMany,
  categoryAllowed,
  keywordAllowed,
  platformAllowed,
  isRenderableAdImage,
  isSafeAdDestination,
  selectAds,
  recordEvent,
  resolveClick,
  placementConfig,
  dailyStats,
};
