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

const roles = {
  USER: "user",
  MODERATOR: "moderator",
  ACCOUNTANT: "accountant",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
};

const permissions = {
  canManageUsers: ["admin", "super_admin"],
  canAssignRoles: ["super_admin"],
  canModerateListings: ["moderator", "admin", "super_admin"],
  canViewAccounting: ["accountant", "admin", "super_admin"],
};

module.exports = {
  requireRole,
  roles,
  permissions,
};