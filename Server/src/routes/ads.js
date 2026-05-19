const express = require("express");
const Ad = require("../models/Ad");

const router = express.Router();

router.get("/:placement", async (req, res) => {
  try {
    const ad = await Ad.findActiveByPlacement(req.params.placement);

    return res.json(ad || null);
  } catch (e) {
    console.error("PUBLIC_AD_GET_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load ad",
    });
  }
});

module.exports = router;