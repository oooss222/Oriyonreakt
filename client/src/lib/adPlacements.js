export const AD_PLACEMENTS = [
  { id: "home_top", label: "Главная — верхний баннер" },
  { id: "home_mid", label: "Главная — между секциями" },
  { id: "listing_top", label: "Каталог — над сеткой" },
  { id: "listing_feed", label: "Каталог — в ленте объявлений" },
  { id: "category_feed", label: "Категория — в ленте" },
  { id: "ad_details_mid", label: "Объявление — под описанием" },
  { id: "ad_sidebar", label: "Объявление — sidebar (desktop)" },
  { id: "footer", label: "Над футером" },
];

export const AD_FORMATS = [
  { id: "banner", label: "Баннер (картинка + ссылка)" },
  { id: "native", label: "Native (карточка)" },
  { id: "html", label: "HTML / код сети (AdSense)" },
];

export const PLACEMENT_LABELS = Object.fromEntries(
  AD_PLACEMENTS.map((item) => [item.id, item.label])
);

export const FORMAT_LABELS = Object.fromEntries(
  AD_FORMATS.map((item) => [item.id, item.label])
);

export const FEED_AD_INTERVAL = 10;
