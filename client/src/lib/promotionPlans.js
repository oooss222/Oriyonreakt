export const VIP_PLANS = [
  { days: 1, price: 3 },
  { days: 3, price: 7 },
  { days: 5, price: 10 },
  { days: 7, price: 15 },
];

export const TOP_PLANS = [
  { days: 1, price: 2 },
  { days: 3, price: 4 },
  { days: 5, price: 7 },
  { days: 7, price: 11 },
  { days: 10, price: 16 },
  { days: 20, price: 25 },
  { days: 30, price: 40 },
];

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
