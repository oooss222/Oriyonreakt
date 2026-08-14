const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  runWithRlsContext,
  updateRlsContext,
  SYSTEM_CONTEXT,
} = require("../lib/rlsContext");

const lastSeenUpdates = new Map();
const SEEN_INTERVAL_MS = 30_000;

module.exports = async function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return res.status(401).json({
      error: "No token",
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const id = String(payload.id || payload._id || payload.userId || "");

    if (!id) {
      return res.status(401).json({
        error: "Invalid token payload",
      });
    }

    const user = await runWithRlsContext(SYSTEM_CONTEXT, () =>
      User.findById(id)
    );

    if (!user) {
      return res.status(401).json({
        error: "User not found",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        error: "User is blocked",
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role || "user",
      isBlocked: Boolean(user.isBlocked),
    };

    updateRlsContext({
      userId: user.id,
      role: user.role || "user",
    });

    const now = Date.now();
    const last = lastSeenUpdates.get(id) || 0;

    if (now - last >= SEEN_INTERVAL_MS) {
      lastSeenUpdates.set(id, now);
      User.touchLastSeen(id).catch(() => {});
    }

    next();
  } catch (e) {
    console.error("AUTH_ERROR:", e?.message);

    return res.status(401).json({
      error: "Invalid token",
    });
  }
};