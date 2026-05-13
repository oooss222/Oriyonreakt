const router = require("express").Router();
const auth = require("../middleware/auth");
const Favorite = require("../models/Favorite");

router.get("/", auth, async (req, res) => {
  try {
    const favorites = await Favorite.getUserFavorites(req.user.id);

    return res.json(favorites);
  } catch (e) {
    console.error("FAVORITES_GET_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load favorites",
    });
  }
});

router.get("/:listingId", auth, async (req, res) => {
  try {
    const isFavorite = await Favorite.isFavorite(
      req.user.id,
      req.params.listingId
    );

    return res.json({
      favorite: isFavorite,
    });
  } catch (e) {
    console.error("FAVORITE_CHECK_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to check favorite",
    });
  }
});

router.post("/:listingId", auth, async (req, res) => {
  try {
    await Favorite.add(req.user.id, req.params.listingId);

    return res.json({
      ok: true,
    });
  } catch (e) {
    console.error("FAVORITE_ADD_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to add favorite",
    });
  }
});

router.delete("/:listingId", auth, async (req, res) => {
  try {
    await Favorite.remove(req.user.id, req.params.listingId);

    return res.json({
      ok: true,
    });
  } catch (e) {
    console.error("FAVORITE_REMOVE_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to remove favorite",
    });
  }
});

module.exports = router;