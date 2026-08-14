const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  runWithRlsContext,
  updateRlsContext,
  SYSTEM_CONTEXT,
} = require("../lib/rlsContext");

module.exports = async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const id = String(payload.id || payload._id || payload.userId || "");

    if (!id) {
      return next();
    }

    const user = await runWithRlsContext(SYSTEM_CONTEXT, () =>
      User.findById(id)
    );

    if (!user || user.isBlocked) {
      return next();
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
  } catch {
    // ignore invalid token for optional auth
  }

  return next();
};
