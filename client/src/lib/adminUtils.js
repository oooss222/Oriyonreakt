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

export const canAccessAccountant = (role) => role === "accountant";

export const canAccessFinance = (role) =>
  role === "super_admin" || role === "accountant";

export const canAccessExport = (role) =>
  ["admin", "super_admin", "accountant"].includes(role);

export const canAccessAdminPanel = (role) =>
  canAccessModeration(role) || canAccessAccountant(role);

export const sectionRoles = {
  dashboard: ["admin", "super_admin"],
  analytics: ["admin", "super_admin"],
  users: ["admin", "super_admin"],
  listings: ["admin", "super_admin"],
  moderation: ["moderator", "admin", "super_admin"],
  reports: ["moderator", "admin", "super_admin"],
  finance: ["super_admin", "accountant"],
  export: ["admin", "super_admin", "accountant"],
  settings: ["super_admin"],
  audit: ["admin", "super_admin"],
};

export const defaultAdminSection = (role) => {
  if (role === "accountant") return "finance";
  if (canAccessAdmin(role)) return "dashboard";
  if (canAccessModeration(role)) return "moderation";
  return "finance";
};

export const canAccessAdminSection = (role, sectionId) =>
  (sectionRoles[sectionId] || []).includes(role);

export const AUDIT_ACTION_LABELS = {
  "user.block": "Блокировка пользователя",
  "user.unblock": "Разблокировка пользователя",
  "user.role_change": "Смена роли",
  "wallet.adjust": "Корректировка баланса",
  "listing.delete": "Удаление объявления",
  "listing.status_change": "Смена статуса объявления",
  "listing.approve": "Одобрение объявления",
  "listing.reject": "Отклонение объявления",
  "report.review": "Жалоба рассмотрена",
  "report.dismiss": "Жалоба отклонена",
  "report.delete_listing": "Удаление объявления по жалобе",
  "report.block_owner": "Блокировка продавца по жалобе",
  "settings.update": "Изменение настроек сайта",
};
