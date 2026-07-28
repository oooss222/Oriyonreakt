const router = require("express").Router();
const SiteSettings = require("../models/SiteSettings");

router.get("/", async (req, res) => {
  try {
    const settings = await SiteSettings.getPublic();
    return res.json(settings);
  } catch (e) {
    console.error("SETTINGS_PUBLIC_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load settings",
    });
  }
});

router.get("/policy", async (req, res) => {
  try {
    const policy = await SiteSettings.getPolicy();
    return res.json(policy);
  } catch (e) {
    console.error("SETTINGS_POLICY_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load policy",
    });
  }
});

module.exports = router;
