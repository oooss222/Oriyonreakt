const router = require("express").Router();
const Development = require("../models/Development");
const { query } = require("../db");
const { buildListingFilters } = require("../models/Listing");

router.get("/", async (req, res) => {
  try {
    const items = await Development.list({ city: req.query.city || "" });
    return res.json(items);
  } catch (error) {
    console.error("DEVELOPMENTS_LIST_ERROR:", error?.message);
    return res.status(500).json({ error: "Failed to load developments" });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const item = await Development.findBySlug(req.params.slug);

    if (!item) {
      return res.status(404).json({ error: "Development not found" });
    }

    const built = buildListingFilters({
      cat: "realestate",
      subcategory: "",
      status: "approved",
      search: "",
      specs: { ЖК: item.name },
      location: item.city,
    });

    const where = built.conditions.join(" AND ");
    const listingsResult = await query(
      `
      SELECT id, title, price, location, subcategory, images, specs, created_at,
             re_price_per_sqm, re_district, re_rooms, re_area_sqm
      FROM listings
      WHERE ${where}
      ORDER BY vip_until DESC NULLS LAST, top_until DESC NULLS LAST, created_at DESC
      LIMIT 48
      `,
      built.values
    );

    return res.json({
      development: item,
      listings: listingsResult.rows,
    });
  } catch (error) {
    console.error("DEVELOPMENT_DETAIL_ERROR:", error?.message);
    return res.status(500).json({ error: "Failed to load development" });
  }
});

module.exports = router;
