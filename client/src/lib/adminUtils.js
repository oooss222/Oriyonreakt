const LANG_STORAGE_KEY = "diyor_lang";
const SUPPORTED_LANGS = ["ru", "tg", "en"];

// Plain JS (not a component), so it can't call useI18n() — reads the same
// localStorage key the i18n provider persists to, matching the pattern in
// lib/format.js.
function getActiveLang() {
  try {
    const stored = String(localStorage.getItem(LANG_STORAGE_KEY) || "").toLowerCase();
    return SUPPORTED_LANGS.includes(stored) ? stored : "ru";
  } catch {
    return "ru";
  }
}

export const ROLES = ["user", "moderator", "accountant", "admin", "super_admin"];

const WALLET_TYPE_LABELS_BY_LANG = {
  ru: {
    top_up: "Пополнение",
    payment: "Списание",
    refund: "Возврат",
    manual_adjustment: "Корректировка",
  },
  en: {
    top_up: "Top-up",
    payment: "Payment",
    refund: "Refund",
    manual_adjustment: "Adjustment",
  },
  tg: {
    top_up: "Пуркунӣ",
    payment: "Хароҷот",
    refund: "Баргардонидан",
    manual_adjustment: "Ислоҳ",
  },
};

export function getWalletTypeLabels() {
  return WALLET_TYPE_LABELS_BY_LANG[getActiveLang()] || WALLET_TYPE_LABELS_BY_LANG.ru;
}

export const getId = (item) => item?.id || item?._id;

const ROLE_LABELS_BY_LANG = {
  ru: {
    user: "Пользователь",
    moderator: "Модератор",
    accountant: "Бухгалтер",
    admin: "Администратор",
    super_admin: "Супер-админ",
  },
  en: {
    user: "User",
    moderator: "Moderator",
    accountant: "Accountant",
    admin: "Admin",
    super_admin: "Super admin",
  },
  tg: {
    user: "Корбар",
    moderator: "Модератор",
    accountant: "Бухгалтер",
    admin: "Админ",
    super_admin: "Супер-админ",
  },
};

export const roleLabel = (role) => {
  const labels = ROLE_LABELS_BY_LANG[getActiveLang()] || ROLE_LABELS_BY_LANG.ru;

  return labels[role] || role;
};

export const roleBadgeClass = (role) => {
  if (role === "super_admin") return "bg-purple-50 text-purple-700 border-purple-200";
  if (role === "admin") return "bg-sun-50 text-sun-700 border-sun-200";
  if (role === "moderator") return "bg-indigo-50 text-indigo-700 border-indigo-200";
  if (role === "accountant") return "bg-amber-50 text-amber-700 border-amber-200";

  return "bg-mist-50 text-ink-700 border-mist-200";
};

const DEVICE_TYPE_LABELS_BY_LANG = {
  ru: { mobile: "Мобильный", tablet: "Планшет", desktop: "Компьютер", unknown: "Неизвестно" },
  en: { mobile: "Mobile", tablet: "Tablet", desktop: "Desktop", unknown: "Unknown" },
  tg: { mobile: "Мобилӣ", tablet: "Планшет", desktop: "Компютер", unknown: "Номаълум" },
};

export const registrationDeviceTypeLabel = (type = "") => {
  const labels = DEVICE_TYPE_LABELS_BY_LANG[getActiveLang()] || DEVICE_TYPE_LABELS_BY_LANG.ru;

  return labels[String(type || "").toLowerCase()] || labels.unknown;
};

export const formatRegistrationDevice = (user = {}) => {
  const type = user.registrationDeviceType;
  const model = user.registrationDeviceModel;

  if (!type && !model) return "—";

  const typeLabel = registrationDeviceTypeLabel(type);
  if (model) return `${typeLabel} · ${model}`;

  return typeLabel;
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
  ads: ["admin", "super_admin"],
  moderation: ["moderator", "admin", "super_admin"],
  reports: ["moderator", "admin", "super_admin"],
  finance: ["super_admin", "accountant"],
  export: ["admin", "super_admin", "accountant"],
  settings: ["super_admin"],
  audit: ["admin", "super_admin"],
  roles: ["admin", "super_admin"],
  system: ["admin", "super_admin"],
};

export const ACTION_CAPABILITIES = [
  { id: "users.view", roles: ["admin", "super_admin", "accountant"] },
  { id: "users.block", roles: ["admin", "super_admin"] },
  { id: "users.role", roles: ["super_admin"] },
  { id: "listings.moderate", roles: ["moderator", "admin", "super_admin"] },
  { id: "listings.delete", roles: ["admin", "super_admin"] },
  { id: "reports.review", roles: ["moderator", "admin", "super_admin"] },
  { id: "ads.manage", roles: ["admin", "super_admin"] },
  { id: "wallet.view", roles: ["super_admin", "accountant"] },
  { id: "wallet.adjust", roles: ["super_admin", "accountant"] },
  { id: "settings.edit", roles: ["super_admin"] },
  { id: "audit.view", roles: ["admin", "super_admin"] },
];

export const defaultAdminSection = (role) => {
  if (role === "accountant") return "finance";
  if (canAccessAdmin(role)) return "dashboard";
  if (canAccessModeration(role)) return "moderation";
  return "finance";
};

export const canAccessAdminSection = (role, sectionId) =>
  (sectionRoles[sectionId] || []).includes(role);

export const ACCOUNTANT_EXPORT_TYPES = ["users", "transactions"];

export const getExportTypesForRole = (role) => {
  if (role === "accountant") {
    return ACCOUNTANT_EXPORT_TYPES;
  }

  return ["users", "listings", "transactions"];
};

export const FINANCE_AUDIT_ACTIONS = ["wallet.adjust"];

const AUDIT_ACTION_LABELS_BY_LANG = {
  ru: {
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
    "user.business_verify": "Верификация премиум-аккаунта",
    "user.business_unverify": "Снятие верификации премиум-аккаунта",
    "user.business_connect": "Подключение премиум-аккаунта",
    "user.business_disconnect": "Отключение премиум-аккаунта",
    "settings.update": "Изменение настроек сайта",
    "ad.create": "Создание рекламы",
    "ad.update": "Изменение рекламы",
    "ad.delete": "Удаление рекламы",
  },
  en: {
    "user.block": "User blocked",
    "user.unblock": "User unblocked",
    "user.role_change": "Role changed",
    "wallet.adjust": "Balance adjusted",
    "listing.delete": "Listing deleted",
    "listing.status_change": "Listing status changed",
    "listing.approve": "Listing approved",
    "listing.reject": "Listing rejected",
    "report.review": "Report reviewed",
    "report.dismiss": "Report dismissed",
    "report.delete_listing": "Listing deleted via report",
    "report.block_owner": "Seller blocked via report",
    "user.business_verify": "Premium account verified",
    "user.business_unverify": "Premium verification removed",
    "user.business_connect": "Premium account connected",
    "user.business_disconnect": "Premium account disconnected",
    "settings.update": "Site settings changed",
    "ad.create": "Ad created",
    "ad.update": "Ad updated",
    "ad.delete": "Ad deleted",
  },
  tg: {
    "user.block": "Блок кардани корбар",
    "user.unblock": "Рафъи блоки корбар",
    "user.role_change": "Тағйири нақш",
    "wallet.adjust": "Ислоҳи баланс",
    "listing.delete": "Нест кардани эълон",
    "listing.status_change": "Тағйири вазъи эълон",
    "listing.approve": "Тасдиқи эълон",
    "listing.reject": "Рад кардани эълон",
    "report.review": "Шикоят баррасӣ шуд",
    "report.dismiss": "Шикоят рад шуд",
    "report.delete_listing": "Нест кардани эълон аз рӯи шикоят",
    "report.block_owner": "Блок кардани фурӯшанда аз рӯи шикоят",
    "user.business_verify": "Тасдиқи ҳисоби Premium",
    "user.business_unverify": "Рафъи тасдиқи ҳисоби Premium",
    "user.business_connect": "Пайваст кардани ҳисоби Premium",
    "user.business_disconnect": "Қатъ кардани ҳисоби Premium",
    "settings.update": "Тағйири танзимоти сомона",
    "ad.create": "Эҷоди реклама",
    "ad.update": "Тағйири реклама",
    "ad.delete": "Нест кардани реклама",
  },
};

export function getAuditActionLabels() {
  return AUDIT_ACTION_LABELS_BY_LANG[getActiveLang()] || AUDIT_ACTION_LABELS_BY_LANG.ru;
}
