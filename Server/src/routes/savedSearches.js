const router = require("express").Router();
const auth = require("../middleware/auth");
const SavedSearch = require("../models/SavedSearch");

router.get("/", auth, async (req, res) => {
  try {
    const items = await SavedSearch.listForUser(req.user.id);

    return res.json(items);
  } catch (e) {
    console.error("SAVED_SEARCHES_LIST_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load saved searches",
    });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const item = await SavedSearch.upsert(req.user.id, {
      id: req.body?.id || null,
      label: req.body?.label,
      cat: req.body?.cat,
      filters: req.body?.filters || req.body?.params || {},
      alertsEnabled: req.body?.alertsEnabled !== false,
    });

    return res.status(req.body?.id ? 200 : 201).json(item);
  } catch (e) {
    console.error("SAVED_SEARCHES_UPSERT_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to save search",
    });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const removed = await SavedSearch.remove(req.user.id, req.params.id);

    if (!removed) {
      return res.status(404).json({
        error: "Saved search not found",
      });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("SAVED_SEARCHES_DELETE_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to delete saved search",
    });
  }
});

module.exports = router;
