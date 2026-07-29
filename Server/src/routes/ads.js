const router = require("express").Router();
const AdCampaign = require("../models/AdCampaign");

router.get("/", async (req, res) => {
  try {
    const placement = String(req.query.placement || "").trim();
    const cat = String(req.query.cat || "").trim();

    if (!placement) {
      return res.status(400).json({
        error: "placement required",
      });
    }

    const items = await AdCampaign.listActive({ placement, cat });

    return res.json(items);
  } catch (e) {
    console.error("ADS_LIST_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load ads",
    });
  }
});

router.post("/:id/track", async (req, res) => {
  try {
    const type = String(req.body?.type || "impression").trim();

    if (!["impression", "click"].includes(type)) {
      return res.status(400).json({
        error: "Invalid track type",
      });
    }

    const stats = await AdCampaign.track(req.params.id, type);

    if (!stats) {
      return res.status(404).json({
        error: "Ad not found",
      });
    }

    return res.json({
      ok: true,
      impressions: Number(stats.impressions || 0),
      clicks: Number(stats.clicks || 0),
    });
  } catch (e) {
    console.error("ADS_TRACK_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to track ad",
    });
  }
});

module.exports = router;
