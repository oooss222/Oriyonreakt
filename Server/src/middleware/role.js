function requireRole(...allowedRoles) {
  return function roleMiddleware(req, res, next) {
    const role = req.user?.role || "user";

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        error: "Forbidden: insufficient role",
      });
    }

    next();
  };
}

module.exports = {
  requireRole,
};