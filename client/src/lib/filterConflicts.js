import { isDailyDeal } from "../data/realEstate";

const LANG_STORAGE_KEY = "oriyon_lang";
const SELLER_TYPE_LABELS_BY_LANG = {
  ru: { private: "Частный продавец", company: "Агент / компания" },
  en: { private: "Private seller", company: "Agent / company" },
  tg: { private: "Фурӯшандаи хусусӣ", company: "Агент / ширкат" },
};

function getActiveLang() {
  try {
    const lang = String(localStorage.getItem(LANG_STORAGE_KEY) || "").toLowerCase();
    return ["ru", "en", "tg"].includes(lang) ? lang : "ru";
  } catch {
    return "ru";
  }
}

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

  const labels = SELLER_TYPE_LABELS_BY_LANG[getActiveLang()] || SELLER_TYPE_LABELS_BY_LANG.ru;

  return [
    { value: "private", label: labels.private },
    { value: "company", label: labels.company },
  ];
}

export function sellerTypeToLabel(value = "") {
  const labels = SELLER_TYPE_LABELS_BY_LANG[getActiveLang()] || SELLER_TYPE_LABELS_BY_LANG.ru;

  if (value === "private") return labels.private;
  if (value === "company") return labels.company;
  return "";
}
