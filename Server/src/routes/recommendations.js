const router = require("express").Router();
const optionalAuth = require("../middleware/optionalAuth");
const RecommendationService = require("../services/RecommendationService");

router.get("/home", optionalAuth, async (req, res) => {
  try {
    const city = String(req.query.city || "Душанбе").trim() || "Душанбе";
    const limit = Number(req.query.limit || 20);
    const sessionId = String(
      req.query.sessionId || req.headers["x-oriyon-session"] || ""
    ).trim();
    const profileHeader = String(req.headers["x-oriyon-profile"] || "").trim();

    const result = await RecommendationService.getHomeFeed({
      profileHeader,
      userId: req.user?.id || null,
      sessionId,
      city,
      limit,
    });

    return res.json(result);
  } catch (e) {
    console.error("RECOMMENDATIONS_HOME_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load recommendations",
    });
  }
});

module.exports = router;
