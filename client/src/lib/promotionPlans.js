import data from "@shared/promotionPlans.json";

export const VIP_PLANS = data.VIP_PLANS;
export const TOP_PLANS = data.TOP_PLANS;
export const PREMIUM_CATS = data.PREMIUM_CATS || [];

const premiumCats = new Set(PREMIUM_CATS);

function planTier(cat) {
  return premiumCats.has(String(cat || "")) ? "premium" : "standard";
}

export function getPromotionPlans(type, cat) {
  const table = type === "vip" ? VIP_PLANS : type === "top" ? TOP_PLANS : null;
  if (!table) return [];
  if (Array.isArray(table)) return table;
  return table[planTier(cat)] || table.standard || [];
}

export function getPromotionPlan(type, days, cat) {
  const normalizedDays = Number(days);
  return getPromotionPlans(type, cat).find((plan) => plan.days === normalizedDays) || null;
}

export function getMinPromotionPrice(type, cat) {
  const plans = getPromotionPlans(type, cat);
  if (!plans.length) return 0;
  return Math.min(...plans.map((plan) => plan.price));
}

export function formatPromotionDays(days) {
  const value = Number(days);

  if (value === 1) return "1 день";
  if (value >= 2 && value <= 4) return `${value} дня`;
  return `${value} дней`;
}

export function formatPromotionPlanLabel(plan) {
  if (!plan) return "";
  return `${formatPromotionDays(plan.days)} · ${plan.price} TJS`;
}
