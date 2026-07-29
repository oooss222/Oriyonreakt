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

router.get("/business-support", async (req, res) => {
  try {
    const { getBusinessSupportContact } = require("../lib/businessSupport");
    const contact = await getBusinessSupportContact();

    return res.json(contact);
  } catch (e) {
    if (e?.message === "NO_SUPPORT_ADMIN") {
      return res.status(503).json({
        error: "Support is temporarily unavailable",
      });
    }

    console.error("SETTINGS_BUSINESS_SUPPORT_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load business support contact",
    });
  }
});

module.exports = router;
