const fs = require("fs");
const path = require("path");

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

function buildSitemapXml(listings = []) {
  const baseUrl = getSiteBaseUrl();
  const staticUrls = ["", "/listing", "/auth"].map((pathSuffix) => {
    const loc = `${baseUrl}${pathSuffix}`;
    return `<url><loc>${escapeHtml(loc)}</loc><changefreq>daily</changefreq></url>`;
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
${[...staticUrls, ...listingUrls].join("\n")}
</urlset>`;
}

function buildRobotsTxt() {
  const baseUrl = getSiteBaseUrl();

  return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
}

function registerSeoRoutes(app, { clientDist, Listing, query }) {
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain").send(buildRobotsTxt());
  });

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

      res.type("application/xml").send(buildSitemapXml(result.rows));
    } catch (error) {
      console.error("SITEMAP_ERROR:", error?.message);
      res.status(500).type("text/plain").send("Sitemap unavailable");
    }
  });

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
      const metaTags = buildListingMetaTags(listing, requestUrl);
      const html = injectMetaIntoHtml(indexTemplate, metaTags);

      return res.type("html").send(html);
    } catch (error) {
      console.error("SEO_PRERENDER_ERROR:", error?.message);
      return next();
    }
  });
}

module.exports = {
  getSiteBaseUrl,
  buildListingMetaTags,
  buildListingJsonLd,
  buildSitemapXml,
  buildRobotsTxt,
  registerSeoRoutes,
};
