const { query } = require("../db");
const AdCampaign = require("../models/AdCampaign");
const { PLACEMENTS } = require("./adPlacements");

const DEMOS = [
  ["home_top", "web", "Баннер под шапкой главной", "https://diyor.tj/advertise"],
  ["feed_native", "web", "Нативная карточка в ленте", "https://diyor.tj/advertise"],
  ["category_top", "web", "Баннер категории «Транспорт»", "https://diyor.tj/c/transport"],
  ["search_top", "web", "Спонсорский блок поиска", "https://diyor.tj/listing?search=toyota"],
  ["sidebar", "web", "Боковой баннер", "https://diyor.tj/advertise"],
  ["listing_detail", "web", "Блок на странице объявления", "https://diyor.tj/advertise"],
  ["mobile_sticky_bottom", "web", "Липкий баннер внизу", "https://diyor.tj/advertise"],
  ["post_success", "web", "Блок после публикации", "https://diyor.tj/advertise"],
  ["app_home_top", "app", "Баннер главной в приложении", "https://diyor.tj/advertise"],
  ["app_feed_native", "app", "Карточка в ленте приложения", "https://diyor.tj/advertise"],
  ["app_category_top", "app", "Баннер категории в приложении", "https://diyor.tj/c/transport"],
  ["app_search_top", "app", "Поиск в приложении", "https://diyor.tj/listing?search=toyota"],
  ["app_listing_detail", "app", "Экран объявления в приложении", "https://diyor.tj/advertise"],
  ["app_sticky_bottom", "app", "Баннер над таб-баром", "https://diyor.tj/advertise"],
  ["app_post_success", "app", "После публикации в приложении", "https://diyor.tj/advertise"],
  ["app_interstitial", "app", "Полноэкранная, выключена", "https://diyor.tj/advertise"],
];

async function upsertPlacements() {
  for (const item of PLACEMENTS) {
    await query(
      `
      INSERT INTO ad_placements (
        code, title, platform, width, height, mobile_width, mobile_height, enabled, config, sort_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
      ON CONFLICT (code) DO UPDATE
      SET
        title = EXCLUDED.title,
        platform = EXCLUDED.platform,
        width = EXCLUDED.width,
        height = EXCLUDED.height,
        mobile_width = EXCLUDED.mobile_width,
        mobile_height = EXCLUDED.mobile_height,
        config = CASE
          WHEN ad_placements.config = '{}'::jsonb THEN EXCLUDED.config
          ELSE ad_placements.config
        END,
        sort_order = EXCLUDED.sort_order
      `,
      [
        item.code,
        item.title,
        item.platform,
        item.width || 0,
        item.height || 0,
        item.mobileWidth || 0,
        item.mobileHeight || 0,
        item.enabled !== false,
        JSON.stringify(item.config || {}),
        item.sort || 0,
      ]
    );
  }
}

async function seedDemoAds() {
  await upsertPlacements();

  const existing = await query(
    `
    SELECT id
    FROM ad_campaigns
    WHERE title LIKE 'Демо:%'
    LIMIT 1
    `
  );

  if (existing.rows[0]) return;

  let advertiserId = null;
  const advertiser = await query(
    `
    INSERT INTO advertisers (name, contacts, notes)
    VALUES ('Diyor.tj', 'info@diyor.tj', 'Демонстрационный рекламодатель')
    RETURNING id
    `
  );

  advertiserId = advertiser.rows[0]?.id || null;

  for (const [placement, platform, headline, link] of DEMOS) {
    const isNative = placement.includes("feed");
    const isApp = platform === "app";

    await AdCampaign.create(
      {
        title: `Демо: ${headline}`,
        advertiser: "Diyor.tj",
        advertiserId,
        placement,
        placements: [placement],
        format: isNative ? "native" : "banner",
        headline,
        description: "Демонстрационный креатив. Его можно поставить на паузу или заменить в разделе «Реклама».",
        linkUrl: link,
        imageUrl: "/ads/demo-banner.svg",
        imageMobile: "/ads/demo-banner.svg",
        imageApp: "/ads/demo-banner.svg",
        cat: "",
        categories: [],
        keywords: [],
        priority: 1,
        weight: 1,
        active: placement !== "app_interstitial",
        status: placement === "app_interstitial" ? "paused" : "active",
        platforms: isApp ? ["ios", "android"] : ["web"],
        frequencyCap: 30,
        contractAmount: 0,
      },
      null
    );
  }
}

module.exports = {
  seedDemoAds,
};
