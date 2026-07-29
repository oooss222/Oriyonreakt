const SCRIPT_ID = "yandex-maps-api-script";

let loadPromise = null;

export function getYandexMapsApiKey() {
  return import.meta.env.VITE_YANDEX_MAPS_API_KEY || "";
}

export function loadYandexMaps() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Yandex Maps доступны только в браузере"));
  }

  if (window.ymaps?.Map) {
    return new Promise((resolve) => {
      window.ymaps.ready(() => resolve(window.ymaps));
    });
  }

  const apiKey = getYandexMapsApiKey();
  if (!apiKey) {
    return Promise.reject(new Error("Не задан VITE_YANDEX_MAPS_API_KEY"));
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => {
        window.ymaps.ready(() => resolve(window.ymaps));
      });
      existing.addEventListener("error", () =>
        reject(new Error("Не удалось загрузить Яндекс.Карты"))
      );
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
    script.async = true;
    script.onload = () => {
      window.ymaps.ready(() => resolve(window.ymaps));
    };
    script.onerror = () => reject(new Error("Не удалось загрузить Яндекс.Карты"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function buildExternalMapUrl({ city = "", district = "", address = "" } = {}) {
  const query = [city, district, address].filter(Boolean).join(", ");
  return `https://2gis.tj/dushanbe/search/${encodeURIComponent(query)}`;
}
