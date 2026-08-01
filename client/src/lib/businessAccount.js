export const PRIVATE_LISTING_LIMIT = 10;
export const COMPANY_LISTING_LIMIT = 100;

export const BUSINESS_BENEFITS = [
  "До 100 активных объявлений",
  "Бренд-страница с логотипом и описанием",
  "Бейдж «Премиум» на объявлениях",
  "Верификация премиум-аккаунта модератором",
  "Приоритетное доверие покупателей",
];

export function getListingLimit(user) {
  return user?.sellerType === "company" ? COMPANY_LISTING_LIMIT : PRIVATE_LISTING_LIMIT;
}

export function isCompanyAccount(user) {
  return user?.sellerType === "company";
}

export function sellerTypeLabel(type) {
  return type === "company" ? "Премиум" : "Частное лицо";
}

export function getDisplayName(user) {
  if (!user) return "Продавец";
  if (user.sellerType === "company" && user.companyName) {
    return user.companyName;
  }
  return user.name || "Продавец";
}
