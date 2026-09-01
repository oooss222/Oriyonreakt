const fs = require("fs");
const path = require("path");
const { getCategoryMeta, getCategorySlugs } = require("./categoryMeta");

function getSiteBaseUrl() {
  return String(
    process.env.CLIENT_URL || process.env.APP_URL || "https://oriyon.store"
  ).replace(/\/$/, "");
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pickListingImage(listing) {
  const images = Array.isArray(listing?.images) ? listing.images : [];
  const first = images[0];

  if (!first) {
    return "";
  }

  if (typeof first === "string") {
    return first.startsWith("http") ? first : `${getSiteBaseUrl()}${first.startsWith("/") ? "" : "/"}${first}`;
  }

  if (first?.url) {
    return first.url.startsWith("http")
      ? first.url
      : `${getSiteBaseUrl()}${first.url.startsWith("/") ? "" : "/"}${first.url}`;
  }

  return "";
}

function buildListingMetaTags(listing, requestUrl = "") {
  const title = escapeHtml(listing?.title || "Объявление");
  const description = escapeHtml(
    `${listing?.price || ""} · ${listing?.location || "Таджикистан"} · ${String(listing?.description || "").slice(0, 160)}`
  );
  const image = escapeHtml(pickListingImage(listing));
  const url = escapeHtml(requestUrl || `${getSiteBaseUrl()}/ad/${listing?.id || listing?._id}`);

  return `
    <title>${title} — Oriyon.store</title>
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${title} — Oriyon.store" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="product" />
    <meta property="og:site_name" content="Oriyon.store" />
    <meta property="og:url" content="${url}" />
    ${image ? `<meta property="og:image" content="${image}" />` : ""}
    <link rel="canonical" href="${url}" />
  `;
}

function injectMetaIntoHtml(html, metaTags) {
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/i, metaTags.trim());
  }

  return html.replace("</head>", `${metaTags}\n</head>`);
}

function buildListingJsonLd(listing, requestUrl = "") {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing?.title || "Объявление",
    description: listing?.description || "",
    image: pickListingImage(listing) || undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "TJS",
      price: String(listing?.price || "").replace(/[^\d.,]/g, "") || undefined,
      availability: "https://schema.org/InStock",
      url: requestUrl || `${getSiteBaseUrl()}/ad/${listing?.id || listing?._id}`,
    },
  };
}

function buildBreadcrumbJsonLd(trail = []) {
  const baseUrl = getSiteBaseUrl();

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.path ? `${baseUrl}${crumb.path}` : undefined,
    })),
  };
}

/** JSON-LD must be embedded in the served HTML; adding it after hydration is
 * too late for the crawler's first pass. */
function renderJsonLd(...documents) {
  return documents
    .filter(Boolean)
    .map(
      (doc) =>
        `<script type="application/ld+json">${JSON.stringify(doc).replace(
          /</g,
          "\\u003c"
        )}</script>`
    )
    .join("\n    ");
}

function pluralizeListings(count) {
  const mod100 = count % 100;
  const mod10 = count % 10;

  if (mod100 >= 11 && mod100 <= 14) return "объявлений";
  if (mod10 === 1) return "объявление";
  if (mod10 >= 2 && mod10 <= 4) return "объявления";

  return "объявлений";
}

function buildCategoryMetaTags({ meta, slug, total, requestUrl }) {
  const title = escapeHtml(
    `${meta.title} — купить и продать в Таджикистане`
  );
  const description = escapeHtml(
    total
      ? `${meta.description}. ${total} ${pluralizeListings(total)} в категории «${meta.title}» на Oriyon.store.`
      : `${meta.description}. Объявления в категории «${meta.title}» на Oriyon.store.`
  );
  const url = escapeHtml(requestUrl || `${getSiteBaseUrl()}/c/${slug}`);

  return `
    <title>${title} | Oriyon.store</title>
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Oriyon.store" />
    <meta property="og:url" content="${url}" />
    <link rel="canonical" href="${url}" />
  `;
}

function buildSitemapXml(listings = []) {
  const baseUrl = getSiteBaseUrl();
  const staticUrls = ["", "/listing", "/realestate", "/policy"].map((pathSuffix) => {
    const loc = `${baseUrl}${pathSuffix}`;
    return `<url><loc>${escapeHtml(loc)}</loc><changefreq>daily</changefreq></url>`;
  });

  // Category hubs were missing entirely, so crawlers had no path into the
  // catalogue other than individual listings.
  const categoryUrls = getCategorySlugs().map((slug) => {
    const loc = `${baseUrl}/c/${slug}`;
    return `<url><loc>${escapeHtml(loc)}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`;
  });

  const realEstatePaths = [
    "/realestate/dushanbe",
    "/realestate/dushanbe/kvartiry",
    "/realestate/dushanbe/kvartiry/kupit",
    "/realestate/dushanbe/kvartiry/snyat",
    "/realestate/dushanbe/novostroyki",
    "/realestate/dushanbe/doma",
    "/realestate/dushanbe/uchastki",
    "/realestate/khujand/kvartiry",
    "/realestate/khujand/kvartiry/kupit",
  ].map((pathSuffix) => {
    const loc = `${baseUrl}${pathSuffix}`;
    return `<url><loc>${escapeHtml(loc)}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`;
  });

  const listingUrls = listings.map((listing) => {
    const loc = `${baseUrl}/ad/${listing.id}`;
    const lastmod = listing.updated_at || listing.created_at;

    return `<url><loc>${escapeHtml(loc)}</loc>${
      lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ""
    }<changefreq>daily</changefreq><priority>0.8</priority></url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...categoryUrls, ...realEstatePaths, ...listingUrls].join("\n")}
</urlset>`;
}

function buildRobotsTxt() {
  const baseUrl = getSiteBaseUrl();

  const privatePaths = [
    "/api/",
    "/admin",
    "/profile",
    "/messages",
    "/auth",
    "/add",
    "/edit/",
    "/uploads/",
  ];

  const blockedScrapers = [
    "GPTBot",
    "ChatGPT-User",
    "CCBot",
    "Google-Extended",
    "anthropic-ai",
    "ClaudeBot",
    "Bytespider",
    "PetalBot",
  ];

  const lines = [
    "# https://oriyon.store",
    "# Public marketplace pages are allowed; private app areas are blocked.",
    "",
    "User-agent: *",
    "Allow: /",
    ...privatePaths.map((pathSuffix) => `Disallow: ${pathSuffix}`),
    "",
  ];

  for (const bot of blockedScrapers) {
    lines.push(`User-agent: ${bot}`, "Disallow: /", "");
  }

  lines.push(`Sitemap: ${baseUrl}/sitemap.xml`);

  return `${lines.join("\n")}\n`;
}

function registerCrawlerRoutes(app, { Listing, query } = {}) {
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain; charset=utf-8").send(buildRobotsTxt());
  });

  if (!Listing || !query) {
    return;
  }

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const result = await query(
        `
        SELECT id, updated_at, created_at
        FROM listings
        WHERE status = 'approved'
        ORDER BY COALESCE(updated_at, created_at) DESC
        LIMIT 5000
        `
      );

      res.type("application/xml; charset=utf-8").send(buildSitemapXml(result.rows));
    } catch (error) {
      console.error("SITEMAP_ERROR:", error?.message);
      res.status(500).type("text/plain").send("Sitemap unavailable");
    }
  });
}

function registerSeoRoutes(app, { clientDist, Listing }) {
  if (!clientDist) {
    return;
  }

  const indexPath = path.join(clientDist, "index.html");
  const indexTemplate = fs.existsSync(indexPath)
    ? fs.readFileSync(indexPath, "utf8")
    : "";

  app.get(/^\/ad\/([^/?#]+)$/, async (req, res, next) => {
    if (!indexTemplate || !Listing) {
      return next();
    }

    try {
      const listing = await Listing.findById(
        String(req.params[0] || req.path.split("/ad/")[1] || "").split(/[?#]/)[0]
      );

      if (!listing || listing.status !== "approved") {
        return next();
      }

      const requestUrl = `${getSiteBaseUrl()}${req.originalUrl}`;
      const categoryMeta = getCategoryMeta(listing.cat);

      const structuredData = renderJsonLd(
        buildListingJsonLd(listing, requestUrl),
        buildBreadcrumbJsonLd([
          { name: "Главная", path: "/" },
          categoryMeta
            ? { name: categoryMeta.title, path: `/c/${listing.cat}` }
            : null,
          { name: listing.title || "Объявление" },
        ].filter(Boolean))
      );

      const metaTags = `${buildListingMetaTags(listing, requestUrl)}
    ${structuredData}`;
      const html = injectMetaIntoHtml(indexTemplate, metaTags);

      return res.type("html").send(html);
    } catch (error) {
      console.error("SEO_PRERENDER_ERROR:", error?.message);
      return next();
    }
  });

  // Category hubs previously served the same generic shell title for every
  // slug, so they had nothing to rank on.
  app.get(/^\/c\/([^/?#]+)$/, async (req, res, next) => {
    if (!indexTemplate) {
      return next();
    }

    const slug = String(req.params[0] || "").split(/[?#]/)[0];
    const meta = getCategoryMeta(slug);

    if (!meta) {
      return next();
    }

    try {
      let total = 0;

      if (Listing?.count) {
        const counted = await Listing.count({ cat: slug, status: "approved" });
        total = Number(counted?.total ?? counted ?? 0);
      }

      const requestUrl = `${getSiteBaseUrl()}${req.originalUrl}`;

      const structuredData = renderJsonLd(
        buildBreadcrumbJsonLd([
          { name: "Главная", path: "/" },
          { name: meta.title, path: `/c/${slug}` },
        ])
      );

      const metaTags = `${buildCategoryMetaTags({
        meta,
        slug,
        total,
        requestUrl,
      })}
    ${structuredData}`;

      return res.type("html").send(injectMetaIntoHtml(indexTemplate, metaTags));
    } catch (error) {
      console.error("SEO_CATEGORY_PRERENDER_ERROR:", error?.message);
      return next();
    }
  });
}

module.exports = {
  getSiteBaseUrl,
  buildListingMetaTags,
  buildListingJsonLd,
  buildBreadcrumbJsonLd,
  buildCategoryMetaTags,
  renderJsonLd,
  buildSitemapXml,
  buildRobotsTxt,
  registerCrawlerRoutes,
  registerSeoRoutes,
};
