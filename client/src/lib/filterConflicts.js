import { isDailyDeal } from "../data/realEstate";

export function sanitizeRealEstateDraft(
  draft = {},
  { dealType = "", subcategory = "" } = {}
) {
  const next = {
    ...draft,
    specs: { ...(draft.specs || {}) },
  };

  const sub = subcategory || draft.subcategory || "";
  const deal = dealType || next.specs["Тип сделки"] || "";

  if (isDailyDeal(deal)) {
    next.sellerType = "";
  }

  if (sub === "Новостройки") {
    next.sellerType = "";
  }

  return next;
}

export function getSellerFilterOptions(dealType = "", subcategory = "") {
  if (isDailyDeal(dealType)) return [];
  if (subcategory === "Новостройки") return [];

  return [
    { value: "private", label: "Частный продавец" },
    { value: "company", label: "Агент / компания" },
  ];
}

export function sellerTypeToLabel(value = "") {
  if (value === "private") return "Частный продавец";
  if (value === "company") return "Агент / компания";
  return "";
}
