// Titles mirror CATS in client/src/data/listingCategories.js. They exist here
// so crawler responses carry a real page title without executing the SPA.
const CATEGORY_META = {
  realestate: {
    title: "Недвижимость",
    description: "Квартиры, дома, участки и коммерция",
  },
  transport: { title: "Авто", description: "Авто и запчасти" },
  furniture: { title: "Мебель", description: "Дом, офис, интерьер" },
  phones: {
    title: "Телефоны",
    description: "Смартфоны, планшеты и аксессуары",
  },
  electronics: { title: "Бытовая техника", description: "Техника для дома" },
  computers: {
    title: "Компьютеры и оргтехника",
    description: "ПК, ноутбуки, оргтехника",
  },
  services: {
    title: "Услуги",
    description: "Специалисты, ремонт, обучение и сервис",
  },
  repair: { title: "Ремонт", description: "Материалы и инструменты" },
};

function getCategoryMeta(slug) {
  return CATEGORY_META[String(slug || "").trim()] || null;
}

function getCategorySlugs() {
  return Object.keys(CATEGORY_META);
}

module.exports = {
  CATEGORY_META,
  getCategoryMeta,
  getCategorySlugs,
};
