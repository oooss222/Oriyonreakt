export const ROLES = ["user", "moderator", "accountant", "admin", "super_admin"];

export const WALLET_TYPE_LABELS = {
  top_up: "Пополнение",
  payment: "Списание",
  refund: "Возврат",
  manual_adjustment: "Корректировка",
};

export const getId = (item) => item?.id || item?._id;

export const roleLabel = (role) => {
  const labels = {
    user: "Пользователь",
    moderator: "Модератор",
    accountant: "Бухгалтер",
    admin: "Администратор",
    super_admin: "Супер-админ",
  };

  return labels[role] || role;
};

export const roleBadgeClass = (role) => {
  if (role === "super_admin") return "bg-purple-50 text-purple-700 border-purple-200";
  if (role === "admin") return "bg-sun-50 text-sun-700 border-sun-200";
  if (role === "moderator") return "bg-indigo-50 text-indigo-700 border-indigo-200";
  if (role === "accountant") return "bg-amber-50 text-amber-700 border-amber-200";

  return "bg-slate-50 text-slate-700 border-slate-200";
};

export const canManageUser = (actor, target) => {
  if (!target || !actor) return false;

  const actorRole = actor.role || "user";
  const targetRole = target.role || "user";
  const isSuperAdmin = actorRole === "super_admin";

  if (String(getId(target)) === String(getId(actor))) {
    return false;
  }

  if (isSuperAdmin) {
    return true;
  }

  if (actorRole === "admin") {
    return ["user", "moderator"].includes(targetRole);
  }

  return false;
};

export const canAccessAdmin = (role) => role === "admin" || role === "super_admin";

export const canAccessModeration = (role) =>
  ["moderator", "admin", "super_admin"].includes(role);
