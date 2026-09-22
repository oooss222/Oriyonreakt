const { VIP_PLANS, TOP_PLANS, PREMIUM_CATS } = require("../../../shared/promotionPlans.json");

const premiumCats = new Set(PREMIUM_CATS || []);

function planTier(cat) {
  return premiumCats.has(String(cat || "")) ? "premium" : "standard";
}

function getPromotionPlans(type, cat) {
  const normalizedType = String(type || "").trim().toLowerCase();
  const table = normalizedType === "vip" ? VIP_PLANS : normalizedType === "top" ? TOP_PLANS : null;

  if (!table) return [];
  if (Array.isArray(table)) return table;

  return table[planTier(cat)] || table.standard || [];
}

function getPromotionPlan(type, days, cat) {
  const normalizedDays = Number(days);
  return getPromotionPlans(type, cat).find((plan) => plan.days === normalizedDays) || null;
}

module.exports = {
  VIP_PLANS,
  TOP_PLANS,
  PREMIUM_CATS,
  getPromotionPlans,
  getPromotionPlan,
};
