const router = require("express").Router();
const AdCampaign = require("../models/AdCampaign");
const { query } = require("../db");
const {
  selectAds,
  recordEvent,
  resolveClick,
  placementConfig,
  isSafeAdDestination,
} = require("../lib/adDelivery");

function viewerFrom(req) {
  return String(req.query.viewer || req.body?.viewer || "").trim().slice(0, 80);
}

function clientIp(req) {
  return String(req.ip || req.socket?.remoteAddress || "");
}

router.get("/config", async (req, res) => {
  try {
    const slots = await placementConfig(req.query.platform);

    return res.json({ slots });
  } catch (error) {
    console.error("ADS_CONFIG_ERROR:", error?.message);

    return res.status(500).json({ error: "Failed to load ad config" });
  }
});

router.get("/click/:id", async (req, res) => {
  try {
    const creativeId = String(req.query.creative || "").trim() || null;
    const target = await resolveClick(req.params.id, creativeId);

    if (!target) {
      return res.status(404).json({ error: "Ad not found" });
    }

    await recordEvent({
      campaignId: req.params.id,
      creativeId,
      placement: req.query.placement,
      platform: req.query.platform || "web",
      eventType: "click",
      viewer: viewerFrom(req),
      ip: clientIp(req),
      userAgent: req.get("user-agent"),
    });

    const destination = target.deeplink && String(req.query.format || "") === "json"
      ? target.deeplink
      : target.url;

    if (String(req.query.format || "") === "json") {
      return res.json({
        url: isSafeAdDestination(target.url) ? target.url : "",
        deeplink: isSafeAdDestination(target.deeplink) ? target.deeplink : "",
      });
    }

    if (!isSafeAdDestination(destination)) {
      return res.status(404).json({ error: "Ad link is missing" });
    }

    return res.redirect(302, destination);
  } catch (error) {
    console.error("ADS_CLICK_ERROR:", error?.message);

    return res.status(500).json({ error: "Failed to open ad" });
  }
});

router.get("/", async (req, res) => {
  try {
    const placement = String(req.query.placement || "").trim();

    if (!placement) {
      return res.status(400).json({ error: "placement required" });
    }

    const payload = await selectAds({
      placement,
      platform: req.query.platform || "web",
      category: req.query.category || req.query.cat,
      city: req.query.city,
      device: req.query.device,
      appVersion: req.query.app_version,
      q: req.query.q,
      lang: req.query.lang,
      viewer: viewerFrom(req),
    });

    return res.json(payload);
  } catch (error) {
    console.error("ADS_LIST_ERROR:", error?.message);

    return res.status(500).json({ error: "Failed to load ads" });
  }
});

router.post("/impression", async (req, res) => {
  try {
    const campaignId = String(req.body?.campaignId || req.body?.id || "").trim();
    const creativeId = String(req.body?.creativeId || "").trim() || null;

    if (!campaignId) {
      return res.status(400).json({ error: "campaignId required" });
    }

    const result = await recordEvent({
      campaignId,
      creativeId,
      placement: req.body?.placement,
      platform: req.body?.platform || "web",
      eventType: "impression",
      viewer: viewerFrom(req),
      ip: clientIp(req),
      userAgent: req.get("user-agent"),
    });

    return res.json({ ok: true, counted: Boolean(result.counted) });
  } catch (error) {
    console.error("ADS_IMPRESSION_ERROR:", error?.message);

    return res.status(500).json({ error: "Failed to track ad" });
  }
});

router.post("/inquiries", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim().slice(0, 120);
    const contact = String(req.body?.contact || "").trim().slice(0, 160);
    const company = String(req.body?.company || "").trim().slice(0, 160);
    const message = String(req.body?.message || "").trim().slice(0, 2000);
    const placement = String(req.body?.placement || "").trim().slice(0, 80);

    if (name.length < 2 || contact.length < 3 || message.length < 5) {
      return res.status(400).json({ error: "Name, contact and message are required" });
    }

    await query(
      `
      INSERT INTO ad_inquiries (name, contact, company, message, placement)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [name, contact, company, message, placement]
    );

    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error("ADS_INQUIRY_ERROR:", error?.message);

    return res.status(500).json({ error: "Failed to send inquiry" });
  }
});

router.post("/:id/track", async (req, res) => {
  try {
    const type = String(req.body?.type || "impression").trim();

    if (!["impression", "click"].includes(type)) {
      return res.status(400).json({ error: "Invalid track type" });
    }

    const existing = await AdCampaign.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: "Ad not found" });
    }

    await recordEvent({
      campaignId: req.params.id,
      placement: req.body?.placement,
      platform: req.body?.platform || (req.body?.source === "app" ? "android" : "web"),
      eventType: type,
      viewer: viewerFrom(req),
      ip: clientIp(req),
      userAgent: req.get("user-agent"),
    });

    const fresh = await AdCampaign.findById(req.params.id);

    return res.json({
      ok: true,
      impressions: Number(fresh?.impressions || 0),
      clicks: Number(fresh?.clicks || 0),
    });
  } catch (error) {
    console.error("ADS_TRACK_ERROR:", error?.message);

    return res.status(500).json({ error: "Failed to track ad" });
  }
});

module.exports = router;
