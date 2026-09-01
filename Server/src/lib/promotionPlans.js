const { VIP_PLANS, TOP_PLANS } = require("../../../shared/promotionPlans.json");

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
