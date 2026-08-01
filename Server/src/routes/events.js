const router = require("express").Router();
const optionalAuth = require("../middleware/optionalAuth");
const UserEvent = require("../models/UserEvent");

const rateLimit = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 120;

function isRateLimited(sessionId) {
  const key = String(sessionId || "anon");
  const now = Date.now();
  const entry = rateLimit.get(key);

  if (!entry || now - entry.startedAt > RATE_WINDOW_MS) {
    rateLimit.set(key, { startedAt: now, count: 1 });
    return false;
  }

  entry.count += 1;
  if (entry.count > RATE_MAX) return true;
  return false;
}

router.post("/", optionalAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const sessionId = String(body.sessionId || req.headers["x-oriyon-session"] || "").trim();
    const city = String(body.city || "Душанбе").trim() || "Душанбе";
    const events = Array.isArray(body.events) ? body.events.slice(0, 20) : [];

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId required" });
    }

    if (!events.length) {
      return res.status(204).end();
    }

    if (isRateLimited(sessionId)) {
      return res.status(429).json({ error: "Too many events" });
    }

    await UserEvent.insertBatch(events, {
      userId: req.user?.id || null,
      sessionId,
      city,
    });

    return res.status(204).end();
  } catch (e) {
    console.error("EVENTS_INGEST_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to store events",
    });
  }
});

module.exports = router;
