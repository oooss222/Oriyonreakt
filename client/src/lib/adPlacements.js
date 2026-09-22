export const AD_PLACEMENTS = [
  { id: "home_top", label: "Главная — под шапкой" },
  { id: "feed_native", label: "Лента — нативная карточка" },
  { id: "category_top", label: "Категория — над списком" },
  { id: "search_top", label: "Поиск — спонсорский блок" },
  { id: "sidebar", label: "Боковая колонка (десктоп)" },
  { id: "listing_detail", label: "Страница объявления" },
  { id: "mobile_sticky_bottom", label: "Мобильный липкий низ" },
  { id: "post_success", label: "После публикации" },
  { id: "home_mid", label: "Главная — между секциями" },
  { id: "listing_top", label: "Каталог — над сеткой" },
  { id: "listing_feed", label: "Каталог — в ленте (прежний)" },
  { id: "category_feed", label: "Категория — в ленте (прежний)" },
  { id: "ad_details_mid", label: "Объявление — прежний слот" },
  { id: "ad_sidebar", label: "Объявление — прежний sidebar" },
  { id: "footer", label: "Над футером" },
  { id: "app_home_top", label: "Приложение — верх главной" },
  { id: "app_feed_native", label: "Приложение — лента" },
  { id: "app_category_top", label: "Приложение — категория" },
  { id: "app_search_top", label: "Приложение — поиск" },
  { id: "app_listing_detail", label: "Приложение — объявление" },
  { id: "app_sticky_bottom", label: "Приложение — над таб-баром" },
  { id: "app_post_success", label: "Приложение — после публикации" },
  { id: "app_interstitial", label: "Приложение — полноэкранная (выкл.)" },
];

export const AD_FORMATS = [
  { id: "banner", label: "Баннер (картинка + ссылка)" },
  { id: "native", label: "Native (карточка)" },
  { id: "html", label: "HTML, только сайт" },
  { id: "network", label: "Код внешней сети" },
];

export const PLACEMENT_LABELS = Object.fromEntries(
  AD_PLACEMENTS.map((item) => [item.id, item.label])
);

export const FORMAT_LABELS = Object.fromEntries(
  AD_FORMATS.map((item) => [item.id, item.label])
);

export const FEED_AD_INTERVAL = 8;
