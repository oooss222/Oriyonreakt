import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, RefreshCw, ExternalLink } from "lucide-react";
import { loadYandexMaps, buildExternalMapUrl, getYandexMapsApiKey } from "../lib/useYandexMaps";
import { enrichRealEstateListing } from "../lib/realEstate";
import { getCityCoordinates } from "../data/realEstate";
import { formatPrice } from "../lib/format";

export default function RealEstateMap({
  listings = [],
  city = "Душанбе",
  district = "",
  address = "",
  height = 420,
  className = "",
}) {
  const nav = useNavigate();
  const containerRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const [mapReady, setMapReady] = React.useState(false);
  const [loadError, setLoadError] = React.useState(false);
  const [retryKey, setRetryKey] = React.useState(0);

  const points = React.useMemo(
    () =>
      listings
        .map((item) => {
          const enriched = enrichRealEstateListing(item);
          const position = enriched.realEstateSummary?.mapPosition;
          if (!position) return null;

          return {
            id: item.id || item._id,
            title: item.title,
            price: formatPrice(item.price),
            position,
            item: enriched,
          };
        })
        .filter(Boolean),
    [listings]
  );

  React.useEffect(() => {
    let active = true;

    async function initMap() {
      setLoadError(false);
      setMapReady(false);

      try {
        const ymaps = await loadYandexMaps();
        if (!active || !containerRef.current) return;

        if (mapRef.current) {
          mapRef.current.destroy();
          mapRef.current = null;
        }

        const center = getCityCoordinates(city);
        const map = new ymaps.Map(containerRef.current, {
          center: [center.lat, center.lng],
          zoom: center.zoom || 12,
          controls: ["zoomControl", "fullscreenControl"],
        });

        mapRef.current = map;

        const collection = new ymaps.GeoObjectCollection();

        points.forEach((point) => {
          const placemark = new ymaps.Placemark(
            [point.position.lat, point.position.lng],
            {
              balloonContentHeader: point.price,
              balloonContentBody: point.title || "Объявление",
            },
            { preset: "islands#orangeIcon" }
          );

          placemark.events.add("click", () => {
            sessionStorage.setItem("ad_preview", JSON.stringify(point.item));
            nav(`/ad/${point.id}`);
          });

          collection.add(placemark);
        });

        map.geoObjects.add(collection);

        if (points.length > 1) {
          map.setBounds(collection.getBounds(), { checkZoomRange: true, zoomMargin: 40 });
        } else if (points.length === 1) {
          map.setCenter([points[0].position.lat, points[0].position.lng], 15);
        }

        setMapReady(true);
      } catch (error) {
        console.error("RealEstateMap init failed:", error);
        if (active) setLoadError(true);
      }
    }

    initMap();

    return () => {
      active = false;
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      setMapReady(false);
    };
  }, [city, points, nav, retryKey]);

  const externalUrl = buildExternalMapUrl({ city, district, address });
  const hasApiKey = Boolean(getYandexMapsApiKey());

  return (
    <div className={`relative ${className}`}>
      <div className="absolute top-3 right-3 z-10">
        <a
          href={externalUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/95 border shadow-sm text-sm font-medium hover:bg-white"
        >
          <ExternalLink size={15} />
          2GIS
        </a>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border bg-slate-100"
        style={{ height, minHeight: 280 }}
      >
        {!hasApiKey && (
          <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-3 bg-slate-100 p-4 text-center">
            <MapPin size={28} className="text-sun" />
            <p className="text-sm text-slate-600 max-w-sm">
              Для интерактивной карты добавьте ключ Яндекс.Карт в{" "}
              <code className="text-xs bg-white px-1 py-0.5 rounded">VITE_YANDEX_MAPS_API_KEY</code>
            </p>
            <a
              href={externalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border shadow-sm text-sm font-semibold"
            >
              <ExternalLink size={15} />
              Открыть в 2GIS
            </a>
          </div>
        )}

        {hasApiKey && loadError && (
          <div className="absolute inset-0 z-[6] flex flex-col items-center justify-center gap-3 bg-slate-100 p-4 text-center">
            <p className="text-sm text-slate-600">Не удалось загрузить карту</p>
            <button
              type="button"
              onClick={() => setRetryKey((key) => key + 1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border shadow-sm text-sm font-semibold"
            >
              <RefreshCw size={15} />
              Повторить
            </button>
          </div>
        )}

        <div ref={containerRef} className="h-full w-full" />
      </div>

      {mapReady && points.length === 0 && hasApiKey && (
        <p className="text-xs text-slate-500 mt-2">
          На карте показаны объявления с указанным расположением. Пока меток нет — откройте 2GIS для ориентира.
        </p>
      )}
    </div>
  );
}
