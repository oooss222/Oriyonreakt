const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { query } = require("../../db");
const { assertPublicUrl, isBlockedHostname } = require("../safePublicUrl");
const { ALLOWED_CATS } = require("../listingValidation");

const MAX_PAGES = 12;
const MAX_ITEMS = 400;
const MAX_HTML_BYTES = 2_000_000;
const FETCH_TIMEOUT_MS = 15000;

const RAM_OPTIONS = new Set([2, 3, 4, 6, 8, 12, 16]);
const STORAGE_LABEL = {
  32: "32 GB",
  64: "64 GB",
  128: "128 GB",
  256: "256 GB",
  512: "512 GB",
  1024: "1 TB",
  1: "1 TB",
};

function stripTags(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function metaContent(html, key) {
  const pattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
    "i"
  );
  return stripTags((html.match(pattern) || html.match(alt) || [])[1] || "");
}

function pricesFromText(text) {
  return (String(text || "").match(/\d[\d\s]*/g) || [])
    .map((part) => Number(part.replace(/\s/g, "")))
    .filter((value) => value > 0);
}

function brandOf(title) {
  if (/^samsung/i.test(title)) return "Samsung";
  if (/^xiaomi/i.test(title)) return "Xiaomi";
  if (/^(honor|huawei honor)/i.test(title)) return "Honor";
  if (/^huawei/i.test(title)) return "Huawei";
  if (/^tecno/i.test(title)) return "Tecno";
  if (/^realme/i.test(title)) return "Realme";
  if (/^infinix/i.test(title)) return "Infinix";
  if (/^itel/i.test(title)) return "Itel";
  return "";
}

function storageOf(item) {
  const match = `${item.storage || ""} ${item.title || ""}`.match(/(\d+)\s*gb/i);
  if (!match) return "";
  return STORAGE_LABEL[Number(match[1])] || "";
}

function ramOf(title) {
  const compact = String(title || "").replace(/\s/g, "");
  const expanded = compact.match(/(\d+)\+\d+\/(\d+)\/\d+/);
  if (expanded) {
    const ram = Number(expanded[2]);
    const physical = Number(expanded[1]);
    const chosen = RAM_OPTIONS.has(ram) ? ram : physical;
    if (RAM_OPTIONS.has(chosen)) return `${chosen} GB`;
  }
  const pair = compact.match(/(\d+)\/(\d+)gb/i);
  if (pair && RAM_OPTIONS.has(Number(pair[1])) && Number(pair[2]) >= 32) {
    return `${Number(pair[1])} GB`;
  }
  return "";
}

function specsOf(item, cat) {
  if (cat !== "phones") {
    const specs = [];
    if (item.condition) specs.push({ name: "Состояние", value: item.condition });
    return specs;
  }

  const specs = [];
  const brand = brandOf(item.title);
  const storage = storageOf(item);
  const ram = ramOf(item.title);
  if (brand) specs.push({ name: "Производитель", value: brand });
  if (storage) specs.push({ name: "Память", value: storage });
  if (ram) specs.push({ name: "Оперативная память", value: ram });
  specs.push({
    name: "Состояние",
    value: /б\/?у/i.test(item.condition || "") ? "Б/у" : "Новый",
  });
  return specs;
}

function parseSomonCards(html, pageUrl) {
  const cards = [];
  const chunks = String(html).split('class="advert-grid js-advert-click');

  for (const chunk of chunks.slice(1)) {
    const href = (chunk.match(/href="(\/adv\/[^"]+)"/) || [])[1];
    if (!href) continue;
    const title = stripTags(
      (chunk.match(/advert-grid__content-title"[^>]*>([\s\S]*?)<\/a>/) || [])[1]
    );
    if (!title) continue;
    const priceText = stripTags(
      (chunk.match(/advert-grid__content-price[^>]*>([\s\S]*?)<\/a>/) || [])[1]
    );
    const prices = pricesFromText(priceText);
    const images = [
      ...chunk.matchAll(/data-src="(https:\/\/cdntj\.somon\.tj\/[^"]+)"/g),
    ].map((match) => match[1]);
    const features = [
      ...chunk.matchAll(/advert-grid__content-feature"[^>]*>([\s\S]*?)<\//g),
    ]
      .map((match) => stripTags(match[1]))
      .filter(Boolean);

    cards.push({
      externalId: (href.match(/\/adv\/(\d+)/) || [])[1] || "",
      url: new URL(href, pageUrl).href.split("?")[0],
      title,
      price: prices[0] || null,
      oldPrice: prices[1] || null,
      images: [...new Set(images)].slice(0, 8),
      city: stripTags(
        (chunk.match(/advert-grid__content-place"[^>]*>([\s\S]*?)<\//) || [])[1]
      ),
      condition: features.find((feature) => !/gb/i.test(feature)) || "",
      storage: features.find((feature) => /gb/i.test(feature)) || "",
    });
  }

  return cards;
}

function parseGenericCards(html, pageUrl) {
  const page = new URL(pageUrl);
  const items = [];
  const seen = new Set();
  const re = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = re.exec(html))) {
    let abs;
    try {
      abs = new URL(match[1], pageUrl);
    } catch {
      continue;
    }
    if (abs.origin !== page.origin) continue;
    if (abs.pathname === page.pathname) continue;
    const title = stripTags(match[2]);
    if (title.length < 8 || title.length > 140) continue;
    const window = html.slice(
      Math.max(0, match.index - 500),
      match.index + match[0].length + 500
    );
    const priceMatch = window.match(
      /(\d[\d\s]{1,12})\s*(?:с\.|сом|сомони|tjs|смн|руб)/i
    );
    if (!priceMatch) continue;
    const price = Number(priceMatch[1].replace(/\s/g, ""));
    if (!price) continue;
    const key = abs.href.split("#")[0];
    if (seen.has(key)) continue;
    seen.add(key);
    const image =
      (window.match(/<img[^>]+src="(https?:\/\/[^"]+)"/i) || [])[1] ||
      (window.match(/data-src="(https?:\/\/[^"]+)"/i) || [])[1] ||
      "";
    items.push({
      externalId: "",
      url: key,
      title,
      price,
      oldPrice: null,
      images: image ? [image] : [],
      city: "",
      condition: "",
      storage: "",
    });
    if (items.length >= 80) break;
  }

  return items;
}

function parseSingleListing(html, pageUrl) {
  const title = metaContent(html, "og:title") || stripTags((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]);
  if (!title) return [];
  const image = metaContent(html, "og:image");
  const prices = pricesFromText(
    metaContent(html, "product:price:amount") ||
      (html.match(/itemprop="price"\s+content="([^"]+)"/i) || [])[1] ||
      ""
  );
  return [
    {
      externalId: "",
      url: pageUrl.split("#")[0],
      title: title.slice(0, 180),
      price: prices[0] || null,
      oldPrice: null,
      images: image ? [image] : [],
      city: "",
      condition: "",
      storage: "",
    },
  ];
}

function sellerFromHtml(html, pageUrl) {
  const page = new URL(pageUrl);
  const h1 = stripTags((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]);
  const og = metaContent(html, "og:site_name") || metaContent(html, "og:title");
  const authorId = (page.pathname.match(/\/author\/(\d+)/) || [])[1] || "";
  const name = (h1 || og || page.hostname).slice(0, 120);
  const logo =
    (html.match(/author_business__logo[\s\S]{0,400}<img[^>]+src="([^"]+)"/i) || [])[1] ||
    "";
  return {
    name,
    logo,
    website: page.href,
    key: authorId || crypto.createHash("sha1").update(page.origin + page.pathname).digest("hex").slice(0, 12),
    platform: page.hostname.replace(/^www\./, "").split(".")[0] || "site",
  };
}

function nextPageUrl(html, pageUrl) {
  const marked =
    html.match(/<a[^>]+href="([^"]+)"[^>]*>\s*Следующая/i) ||
    html.match(/<a[^>]+rel=["']next["'][^>]+href="([^"]+)"/i) ||
    html.match(/<a[^>]+href="([^"]+)"[^>]+rel=["']next["'][^>]*>/i);
  if (!marked) return "";
  try {
    return new URL(marked[1], pageUrl).href;
  } catch {
    return "";
  }
}

async function fetchHtml(rawUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    let current = await assertPublicUrl(rawUrl);
    let response;

    for (let hop = 0; hop < 4; hop += 1) {
      response = await fetch(current.href, {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "ru-RU,ru;q=0.9",
        },
      });

      if (response.status < 300 || response.status >= 400) break;
      const location = response.headers.get("location");
      if (!location) break;
      current = await assertPublicUrl(new URL(location, current).href);
    }

    if (!response || !response.ok) {
      throw new Error(`Сайт вернул ошибку ${response ? response.status : ""}`.trim());
    }

    const html = await response.text();
    if (!html || html.length < 200) {
      throw new Error("Пустой ответ от сайта");
    }
    if (html.length > MAX_HTML_BYTES) {
      throw new Error("Страница слишком большая для импорта");
    }
    if (/cf-browser-verification|Just a moment|challenge-platform/i.test(html) && !/advert-grid/.test(html)) {
      throw new Error("Сайт не отдал страницу. Откройте её в браузере и попробуйте ещё раз");
    }
    return { html, url: current.href };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Сайт не ответил вовремя");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function collectCatalog(rawUrl) {
  const first = await fetchHtml(rawUrl);
  const seller = sellerFromHtml(first.html, first.url);
  const isSomonAuthor = /somon\.tj$/i.test(new URL(first.url).hostname) &&
    /\/items\/author\/\d+/.test(new URL(first.url).pathname);

  const items = [];
  const seen = new Set();
  let pageUrl = first.url;
  let html = first.html;
  let kind = "catalog";

  for (let page = 0; page < MAX_PAGES && items.length < MAX_ITEMS; page += 1) {
    const batch = isSomonAuthor
      ? parseSomonCards(html, pageUrl)
      : parseGenericCards(html, pageUrl);
    for (const item of batch) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      items.push(item);
    }
    const next = nextPageUrl(html, pageUrl);
    if (!next || next === pageUrl || !batch.length) break;
    const fetched = await fetchHtml(next);
    pageUrl = fetched.url;
    html = fetched.html;
  }

  if (items.length < 2) {
    const single = parseSingleListing(first.html, first.url);
    if (single.length) {
      kind = "listing";
      return { seller, items: single, kind, sourceUrl: first.url };
    }
  }

  if (!items.length) {
    throw new Error("На странице не нашлось объявлений");
  }

  return { seller, items: items.slice(0, MAX_ITEMS), kind, sourceUrl: first.url };
}

function previewPayload(catalog) {
  return {
    kind: catalog.kind,
    sourceUrl: catalog.sourceUrl,
    seller: {
      name: catalog.seller.name,
      website: catalog.seller.website,
    },
    total: catalog.items.length,
    items: catalog.items.slice(0, 12).map((item) => ({
      title: item.title,
      price: item.price,
      city: item.city,
      url: item.url,
      image: item.images[0] || "",
    })),
  };
}

async function previewCatalog(rawUrl) {
  const catalog = await collectCatalog(rawUrl);
  return previewPayload(catalog);
}

function proxyImagePath(imageUrl) {
  return `/api/media/proxy?url=${encodeURIComponent(imageUrl)}`;
}

async function rememberImageHosts(items) {
  const hosts = new Set();
  for (const item of items) {
    for (const image of item.images || []) {
      try {
        const parsed = new URL(image);
        if (parsed.protocol !== "https:" || isBlockedHostname(parsed.hostname)) continue;
        hosts.add(parsed.hostname.toLowerCase());
      } catch {
        // skip broken image urls
      }
    }
  }
  for (const host of hosts) {
    await query(
      `INSERT INTO import_image_hosts (host) VALUES ($1) ON CONFLICT (host) DO NOTHING`,
      [host]
    );
  }
}

async function upsertSeller(seller) {
  const platform = String(seller.platform || "site").replace(/[^a-z0-9]/gi, "").slice(0, 24) || "site";
  const key = String(seller.key || "shop").replace(/[^a-z0-9]/gi, "").slice(0, 24) || "shop";
  const email = `import.${platform}.${key}@diyor.local`.toLowerCase();
  const existing = await query(`SELECT id FROM users WHERE email = $1`, [email]);
  if (existing.rows[0]) {
    return { id: existing.rows[0].id, email, created: false, password: null };
  }

  const password = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 10);
  const inserted = await query(
    `
    INSERT INTO users (
      email, password, name, phone, seller_type, company_name,
      company_description, company_logo, company_address, company_website,
      role, email_verified, trust_level
    )
    VALUES (
      $1, $2, $3, '', 'company', $3,
      $4, $5, $6, $7,
      'user', true, 'trusted'
    )
    RETURNING id
    `,
    [
      email,
      passwordHash,
      seller.name || "Магазин",
      "Каталог импортирован администратором.",
      seller.logo || "",
      seller.name ? "Душанбе" : "",
      seller.website || "",
    ]
  );
  return { id: inserted.rows[0].id, email, created: true, password };
}

async function importCatalog({ url, cat = "phones" }) {
  const category = String(cat || "phones").trim();
  if (!ALLOWED_CATS.has(category)) {
    throw new Error("Неизвестная категория");
  }

  const catalog = await collectCatalog(url);
  await rememberImageHosts(catalog.items);
  const seller = await upsertSeller(catalog.seller);
  const subcategory = category === "phones" ? "Мобильные телефоны" : "";
  let inserted = 0;
  let updated = 0;

  for (const item of catalog.items) {
    const images = (item.images || [])
      .filter((image) => /^https:\/\//i.test(image))
      .slice(0, 8)
      .map(proxyImagePath);
    const title = String(item.title || "").trim().slice(0, 80);
    const description = [title, item.city || "Душанбе"].filter(Boolean).join(". ").slice(0, 1000);
    const price = item.price ? String(item.price) : "";
    const specs = specsOf(item, category);
    const existing = await query(`SELECT id FROM listings WHERE source_url = $1`, [item.url]);

    if (existing.rows[0]) {
      await query(
        `
        UPDATE listings
        SET title = $2,
            price = $3,
            description = $4,
            location = $5,
            images = $6::jsonb,
            specs = $7::jsonb,
            price_num = $8,
            updated_at = now()
        WHERE id = $1
        `,
        [
          existing.rows[0].id,
          title,
          price,
          description,
          item.city || "Душанбе",
          JSON.stringify(images),
          JSON.stringify(specs),
          item.price,
        ]
      );
      updated += 1;
      continue;
    }

    await query(
      `
      INSERT INTO listings (
        public_id, title, price, description, location, cat, subcategory,
        images, specs, owner, status, moderated_at, bumped_at, price_num, source_url
      )
      VALUES (
        FLOOR(10000000 + RANDOM() * 90000000),
        $1, $2, $3, $4, $5, $6,
        $7::jsonb, $8::jsonb, $9, 'approved', now(), now(), $10, $11
      )
      `,
      [
        title,
        price,
        description,
        item.city || "Душанбе",
        category,
        subcategory,
        JSON.stringify(images),
        JSON.stringify(specs),
        seller.id,
        item.price,
        item.url,
      ]
    );
    inserted += 1;
  }

  await query(
    `
    UPDATE users
    SET approved_listings_count = (
      SELECT COUNT(*)::int FROM listings WHERE owner = $1 AND status = 'approved'
    ),
    updated_at = now()
    WHERE id = $1
    `,
    [seller.id]
  );

  return {
    ...previewPayload(catalog),
    inserted,
    updated,
    sellerEmail: seller.email,
    sellerPassword: seller.password,
    sellerCreated: seller.created,
  };
}

module.exports = {
  previewCatalog,
  importCatalog,
  parseSomonCards,
  parseGenericCards,
};
