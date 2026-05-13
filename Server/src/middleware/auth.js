const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

    const user = await User.findById(id);

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

    next();
  } catch (e) {
    console.error("AUTH_ERROR:", e?.message);

    return res.status(401).json({
      error: "Invalid token",
    });
  }
};