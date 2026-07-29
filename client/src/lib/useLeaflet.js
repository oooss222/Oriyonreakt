let leafletPromise = null;
let geomanPromise = null;

export function loadLeaflet() {
  if (typeof window !== "undefined" && window.L) {
    return Promise.resolve(window.L);
  }

  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet="1"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.dataset.leaflet = "1";
      document.head.appendChild(link);
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("Не удалось загрузить карту"));
    document.body.appendChild(script);
  });

  return leafletPromise;
}

export async function loadLeafletGeoman() {
  const L = await loadLeaflet();

  if (L.PM) return L;

  if (!geomanPromise) {
    geomanPromise = new Promise((resolve, reject) => {
      if (!document.querySelector('link[data-leaflet-geoman="1"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
          "https://unpkg.com/@geoman-io/leaflet-geoman-free@2.17.1/dist/leaflet-geoman.css";
        link.dataset.leafletGeoman = "1";
        document.head.appendChild(link);
      }

      const script = document.createElement("script");
      script.src =
        "https://unpkg.com/@geoman-io/leaflet-geoman-free@2.17.1/dist/leaflet-geoman.min.js";
      script.async = true;
      script.onload = () => resolve(window.L);
      script.onerror = () =>
        reject(new Error("Не удалось загрузить инструмент рисования"));
      document.body.appendChild(script);
    });
  }

  await geomanPromise;
  return window.L;
}

export function fixLeafletIcons(L) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}
