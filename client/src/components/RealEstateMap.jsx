import React from "react";
import { useNavigate } from "react-router-dom";
import { Lasso, List, RotateCcw, MapPin, RefreshCw, ExternalLink } from "lucide-react";
import { loadYandexMaps, buildExternalMapUrl, getYandexMapsApiKey } from "../lib/useYandexMaps";
import { enrichRealEstateListing } from "../lib/realEstate";
import { getCityCoordinates } from "../data/realEstate";
import { formatPrice } from "../lib/format";
import {
  filterListingsByPolygon,
  latLngsToPolygon,
  normalizePolygon,
  polygonToLatLngs,
  simplifyRing,
} from "../lib/geo";

function eventToCoords(map, container, event) {
  const rect = container.getBoundingClientRect();
  const pageX = event.clientX - rect.left;
  const pageY = event.clientY - rect.top;
  const globalPixels = map.converter.pageToGlobal([pageX, pageY]);
  return map.options.get("projection").fromGlobalPixels(globalPixels, map.getZoom());
}

export default function RealEstateMap({
  listings = [],
  city = "Душанбе",
  district = "",
  address = "",
  height = 420,
  className = "",
  enableAreaDraw = false,
  polygon = [],
  onPolygonChange,
  onShowList,
}) {
  const nav = useNavigate();
  const containerRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const markersRef = React.useRef(null);
  const areaLayerRef = React.useRef(null);
  const previewLayerRef = React.useRef(null);
  const drawCoordsRef = React.useRef([]);
  const drawingRef = React.useRef(false);

  const [mapReady, setMapReady] = React.useState(false);
  const [loadError, setLoadError] = React.useState(false);
  const [retryKey, setRetryKey] = React.useState(0);
  const [drawing, setDrawing] = React.useState(false);

  const ring = React.useMemo(() => normalizePolygon(polygon), [polygon]);

  const visibleListings = React.useMemo(() => {
    if (!ring.length) return listings;
    return filterListingsByPolygon(listings, ring, (item) => {
      const enriched = enrichRealEstateListing(item);
      return enriched.realEstateSummary?.mapPosition || null;
    });
  }, [listings, ring]);

  const points = React.useMemo(
    () =>
      visibleListings
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
    [visibleListings]
  );

  const renderMarkers = React.useCallback(
    (ymaps, map) => {
      if (markersRef.current) {
        map.geoObjects.remove(markersRef.current);
        markersRef.current = null;
      }

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

      markersRef.current = collection;
      map.geoObjects.add(collection);

      if (ring.length) {
        const bounds = ymaps.util.bounds.fromPoints(polygonToLatLngs(ring));
        map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 40 });
      } else if (points.length > 1) {
        map.setBounds(collection.getBounds(), { checkZoomRange: true, zoomMargin: 40 });
      } else if (points.length === 1) {
        map.setCenter([points[0].position.lat, points[0].position.lng], 15);
      }
    },
    [points, ring, nav]
  );

  const renderAreaLayer = React.useCallback((ymaps, map) => {
    if (areaLayerRef.current) {
      map.geoObjects.remove(areaLayerRef.current);
      areaLayerRef.current = null;
    }

    if (!ring.length) return;

    areaLayerRef.current = new ymaps.Polygon(
      [polygonToLatLngs(ring)],
      {},
      {
        fillColor: "#ff6a0088",
        strokeColor: "#ff6a00",
        strokeWidth: 2,
        interactivityModel: "default#transparent",
      }
    );

    map.geoObjects.add(areaLayerRef.current);
  }, [ring]);

  const stopDrawing = React.useCallback(() => {
    drawingRef.current = false;
    setDrawing(false);

    const map = mapRef.current;
    if (map) {
      map.behaviors.enable("drag");
      map.behaviors.enable("scrollZoom");
      map.behaviors.enable("multiTouch");
    }

    if (previewLayerRef.current && map) {
      map.geoObjects.remove(previewLayerRef.current);
      previewLayerRef.current = null;
    }

    drawCoordsRef.current = [];
  }, []);

  const finishDrawing = React.useCallback(() => {
    const map = mapRef.current;
    const coords = simplifyRing(drawCoordsRef.current);

    stopDrawing();

    if (!map || coords.length < 3) {
      onPolygonChange?.([]);
      return;
    }

    onPolygonChange?.(latLngsToPolygon(coords));
  }, [onPolygonChange, stopDrawing]);

  const updatePreview = React.useCallback((ymaps, map, coords) => {
    if (previewLayerRef.current) {
      map.geoObjects.remove(previewLayerRef.current);
      previewLayerRef.current = null;
    }

    if (coords.length < 2) return;

    previewLayerRef.current = new ymaps.Polyline(
      coords,
      {},
      {
        strokeColor: "#ff6a00",
        strokeWidth: 3,
        strokeOpacity: 0.9,
      }
    );

    map.geoObjects.add(previewLayerRef.current);
  }, []);

  const startDrawing = React.useCallback(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container || !enableAreaDraw) return;

    if (areaLayerRef.current) {
      map.geoObjects.remove(areaLayerRef.current);
      areaLayerRef.current = null;
    }

    onPolygonChange?.([]);
    drawCoordsRef.current = [];
    drawingRef.current = true;
    setDrawing(true);

    map.behaviors.disable("drag");
    map.behaviors.disable("scrollZoom");
    map.behaviors.disable("multiTouch");
  }, [enableAreaDraw, onPolygonChange]);

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
          markersRef.current = null;
          areaLayerRef.current = null;
          previewLayerRef.current = null;
        }

        const center = getCityCoordinates(city);
        const map = new ymaps.Map(containerRef.current, {
          center: [center.lat, center.lng],
          zoom: center.zoom || 12,
          controls: ["zoomControl", "fullscreenControl"],
        });

        mapRef.current = map;
        renderAreaLayer(ymaps, map);
        renderMarkers(ymaps, map);
        setMapReady(true);
      } catch (error) {
        console.error("RealEstateMap init failed:", error);
        if (active) setLoadError(true);
      }
    }

    initMap();

    return () => {
      active = false;
      stopDrawing();
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      markersRef.current = null;
      areaLayerRef.current = null;
      previewLayerRef.current = null;
      setMapReady(false);
    };
  }, [city, retryKey, renderAreaLayer, renderMarkers, stopDrawing]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !window.ymaps) return;

    renderAreaLayer(window.ymaps, map);
    renderMarkers(window.ymaps, map);
  }, [points, ring, mapReady, renderAreaLayer, renderMarkers]);

  React.useEffect(() => {
    const container = containerRef.current;
    const map = mapRef.current;
    if (!container || !map || !enableAreaDraw) return undefined;

    const handlePointerDown = async (event) => {
      if (!drawingRef.current) return;
      event.preventDefault();

      try {
        const ymaps = await loadYandexMaps();
        const coords = eventToCoords(map, container, event);
        drawCoordsRef.current = [coords];
        updatePreview(ymaps, map, drawCoordsRef.current);
      } catch {
        // ignore
      }
    };

    const handlePointerMove = async (event) => {
      if (!drawingRef.current || drawCoordsRef.current.length === 0) return;
      event.preventDefault();

      try {
        const ymaps = await loadYandexMaps();
        const coords = eventToCoords(map, container, event);
        drawCoordsRef.current.push(coords);
        updatePreview(ymaps, map, drawCoordsRef.current);
      } catch {
        // ignore
      }
    };

    const handlePointerUp = (event) => {
      if (!drawingRef.current) return;
      event.preventDefault();
      finishDrawing();
    };

    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", handlePointerUp);
    container.addEventListener("pointercancel", handlePointerUp);

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", handlePointerUp);
      container.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [enableAreaDraw, finishDrawing, updatePreview]);

  const clearArea = () => {
    stopDrawing();
    onPolygonChange?.([]);
  };

  const externalUrl = buildExternalMapUrl({ city, district, address });
  const hasApiKey = Boolean(getYandexMapsApiKey());

  return (
    <div className={`relative ${className}`}>
      {enableAreaDraw && (
        <div className="absolute top-3 left-3 right-16 z-[500] flex flex-wrap items-center gap-2 pointer-events-none">
          <button
            type="button"
            onClick={startDrawing}
            disabled={!mapReady}
            className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white shadow-md border text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
          >
            <Lasso size={16} className="text-sun" />
            {drawing ? "Обводите область…" : "Обвести область"}
          </button>

          {ring.length > 0 && (
            <>
              <button
                type="button"
                onClick={clearArea}
                className="pointer-events-auto inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/95 shadow-md border text-sm font-medium hover:bg-slate-50"
              >
                <RotateCcw size={15} />
                Сбросить
              </button>

              {onShowList && (
                <button
                  type="button"
                  onClick={() => onShowList(visibleListings)}
                  className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white shadow-md text-sm font-semibold hover:bg-slate-800"
                >
                  <List size={16} />
                  Список ({visibleListings.length})
                </button>
              )}
            </>
          )}
        </div>
      )}

      <div className="absolute top-3 right-3 z-[500]">
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

      {enableAreaDraw && !ring.length && mapReady && (
        <div className="absolute bottom-3 left-3 right-3 z-[500] pointer-events-none">
          <div className="pointer-events-auto mx-auto max-w-md rounded-xl bg-white/95 border shadow-md px-4 py-3 text-sm text-slate-600 flex items-start gap-2">
            <MapPin size={16} className="text-sun shrink-0 mt-0.5" />
            <span>
              Нажмите «Обвести область», затем зажмите и проведите пальцем или мышью.
              Покажем только объявления внутри области.
            </span>
          </div>
        </div>
      )}

      <div
        className={`relative overflow-hidden rounded-2xl border bg-slate-100 ${drawing ? "ring-2 ring-sun/40" : ""}`}
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

        <div
          ref={containerRef}
          className={`h-full w-full ${drawing ? "cursor-crosshair touch-none" : ""}`}
        />
      </div>
    </div>
  );
}
