import data from "@shared/promotionPlans.json";

export const VIP_PLANS = data.VIP_PLANS;
export const TOP_PLANS = data.TOP_PLANS;

export function getPromotionPlans(type) {
  return type === "vip" ? VIP_PLANS : type === "top" ? TOP_PLANS : [];
}

export function getPromotionPlan(type, days) {
  const normalizedDays = Number(days);
  return getPromotionPlans(type).find((plan) => plan.days === normalizedDays) || null;
}

export function getMinPromotionPrice(type) {
  const plans = getPromotionPlans(type);
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
