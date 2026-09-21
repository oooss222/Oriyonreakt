const router = require("express").Router();
const { query } = require("../db");
const { isBlockedHostname } = require("../lib/safePublicUrl");

const SOMON_HOST = "cdntj.somon.tj";
const MAX_BYTES = 8 * 1024 * 1024;

async function allowedImageUrl(raw) {
  let parsed;

  try {
    parsed = new URL(String(raw || ""));
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  if (isBlockedHostname(host)) {
    return null;
  }

  if (host === SOMON_HOST) {
    return parsed.href;
  }

  try {
    const known = await query(
      `SELECT 1 FROM import_image_hosts WHERE host = $1`,
      [host]
    );
    if (!known.rows.length) return null;
  } catch {
    return null;
  }

  return parsed.href;
}

router.get("/proxy", async (req, res) => {
  const target = await allowedImageUrl(req.query.url);

  if (!target) {
    return res.status(400).end();
  }

  try {
    const upstream = await fetch(target, {
      redirect: "error",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });
    const type = String(upstream.headers.get("content-type") || "");

    if (!upstream.ok || !type.startsWith("image/")) {
      return res.status(502).end();
    }

    const bytes = Buffer.from(await upstream.arrayBuffer());

    if (!bytes.length || bytes.length > MAX_BYTES) {
      return res.status(502).end();
    }

    res.setHeader("Content-Type", type.split(";")[0]);
    res.setHeader("Cache-Control", "public, max-age=604800, immutable");
    return res.send(bytes);
  } catch (error) {
    console.error("MEDIA_PROXY_ERROR:", error?.message);
    return res.status(502).end();
  }
});

module.exports = router;
