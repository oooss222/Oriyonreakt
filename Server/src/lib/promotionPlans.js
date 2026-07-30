const VIP_PLANS = [
  { days: 1, price: 3 },
  { days: 3, price: 7 },
  { days: 5, price: 10 },
  { days: 7, price: 15 },
];

const TOP_PLANS = [
  { days: 1, price: 2 },
  { days: 3, price: 4 },
  { days: 5, price: 7 },
  { days: 7, price: 11 },
  { days: 10, price: 16 },
  { days: 20, price: 25 },
  { days: 30, price: 40 },
];

function getPromotionPlans(type) {
  const normalizedType = String(type || "").trim().toLowerCase();

  if (normalizedType === "vip") return VIP_PLANS;
  if (normalizedType === "top") return TOP_PLANS;

  return [];
}

function getPromotionPlan(type, days) {
  const normalizedDays = Number(days);
  return getPromotionPlans(type).find((plan) => plan.days === normalizedDays) || null;
}

module.exports = {
  VIP_PLANS,
  TOP_PLANS,
  getPromotionPlans,
  getPromotionPlan,
};
