import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  MapPin,
  Navigation,
  RefreshCw,
  Ruler,
  ExternalLink,
  List,
  X,
} from "lucide-react";
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

const MAP_TYPES = [
  { id: "yandex#map", label: "Схема" },
  { id: "yandex#satellite", label: "Спутник" },
  { id: "yandex#hybrid", label: "Гибрид" },
];

function eventToCoords(map, container, event) {
  const rect = container.getBoundingClientRect();
  const pageX = event.clientX - rect.left;
  const pageY = event.clientY - rect.top;
  const globalPixels = map.converter.pageToGlobal([pageX, pageY]);
  return map.options.get("projection").fromGlobalPixels(globalPixels, map.getZoom());
}

function haversineKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} м`;
  if (km < 10) return `${km.toFixed(1)} км`;
  return `${Math.round(km)} км`;
}

function AreaDrawIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8.5 4.5c.8-1.2 2.7-1.2 3.5 0l.8 1.2c.3.5.8.8 1.4.9l1.4.2c1.4.2 2 1.9 1 3l-1 1.4c-.4.5-.5 1.2-.3 1.8l.5 1.3c.5 1.3-.9 2.5-2.1 1.9l-1.3-.6c-.6-.3-1.3-.3-1.9 0l-1.3.6c-1.2.6-2.6-.6-2.1-1.9l.5-1.3c.2-.6.1-1.3-.3-1.8l-1-1.4c-1-1.1-.4-2.8 1-3l1.4-.2c.6-.1 1.1-.4 1.4-.9l.8-1.2z"
        stroke={active ? "#059669" : "#334155"}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M14 8c2 1.5 4.5 4.5 5.5 8.5"
        stroke={active ? "#059669" : "#334155"}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ToolbarButton({ active, onClick, disabled, title, children, className = "" }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.12)] border border-black/5 hover:bg-slate-50 disabled:opacity-50 transition-colors ${active ? "ring-2 ring-emerald-500/30" : ""} ${className}`}
    >
      {children}
    </button>
  );
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
  const rulerLayerRef = React.useRef(null);
  const rulerClickRef = React.useRef(null);
  const drawCoordsRef = React.useRef([]);
  const drawingRef = React.useRef(false);
  const rulerPointsRef = React.useRef([]);

  const [mapReady, setMapReady] = React.useState(false);
  const [loadError, setLoadError] = React.useState(false);
  const [retryKey, setRetryKey] = React.useState(0);
  const [drawing, setDrawing] = React.useState(false);
  const [activeTool, setActiveTool] = React.useState(null);
  const [mapType, setMapType] = React.useState("yandex#map");
  const [layersOpen, setLayersOpen] = React.useState(false);
  const [rulerDistance, setRulerDistance] = React.useState("");

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

  const clearRuler = React.useCallback(() => {
    const map = mapRef.current;
    rulerPointsRef.current = [];
    setRulerDistance("");

    if (rulerLayerRef.current && map) {
      map.geoObjects.remove(rulerLayerRef.current);
      rulerLayerRef.current = null;
    }
  }, []);

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

  const deactivateTools = React.useCallback(() => {
    stopDrawing();
    clearRuler();
    setActiveTool(null);
  }, [clearRuler, stopDrawing]);

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

  const finishDrawing = React.useCallback(() => {
    const map = mapRef.current;
    const coords = simplifyRing(drawCoordsRef.current);

    stopDrawing();
    setActiveTool(null);

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

    clearRuler();
    setActiveTool("lasso");

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
  }, [clearRuler, enableAreaDraw, onPolygonChange]);

  const toggleLasso = () => {
    if (drawing) {
      stopDrawing();
      setActiveTool(null);
      return;
    }

    startDrawing();
  };

  const toggleRuler = () => {
    if (activeTool === "ruler") {
      clearRuler();
      setActiveTool(null);
      return;
    }

    stopDrawing();
    clearRuler();
    setActiveTool("ruler");
  };

  const handleZoomIn = () => {
    const map = mapRef.current;
    if (!map) return;
    map.setZoom(map.getZoom() + 1, { duration: 200 });
  };

  const handleZoomOut = () => {
    const map = mapRef.current;
    if (!map) return;
    map.setZoom(map.getZoom() - 1, { duration: 200 });
  };

  const handleLocate = async () => {
    const map = mapRef.current;
    if (!map) return;

    try {
      const ymaps = await loadYandexMaps();
      const result = await ymaps.geolocation.get({
        provider: "browser",
        mapStateAutoApply: false,
      });

      const coords = result.geoObjects.get(0)?.geometry?.getCoordinates();
      if (coords) {
        map.setCenter(coords, 15, { duration: 300 });
      }
    } catch {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.setCenter([pos.coords.latitude, pos.coords.longitude], 15, { duration: 300 });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const handleMapTypeChange = (typeId) => {
    const map = mapRef.current;
    if (map) map.setType(typeId);
    setMapType(typeId);
    setLayersOpen(false);
  };

  const clearArea = () => {
    deactivateTools();
    onPolygonChange?.([]);
  };

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
          rulerLayerRef.current = null;
        }

        const center = getCityCoordinates(city);
        const map = new ymaps.Map(containerRef.current, {
          center: [center.lat, center.lng],
          zoom: center.zoom || 12,
          controls: [],
          type: mapType,
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
      deactivateTools();
      if (rulerClickRef.current && mapRef.current) {
        mapRef.current.events.remove("click", rulerClickRef.current);
        rulerClickRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      markersRef.current = null;
      areaLayerRef.current = null;
      previewLayerRef.current = null;
      rulerLayerRef.current = null;
      setMapReady(false);
    };
  }, [city, retryKey, renderAreaLayer, renderMarkers, deactivateTools]);

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

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !window.ymaps) return undefined;

    if (rulerClickRef.current) {
      map.events.remove("click", rulerClickRef.current);
      rulerClickRef.current = null;
    }

    if (activeTool !== "ruler") return undefined;

    const handleRulerClick = async (event) => {
      const coords = event.get("coords");
      const ymaps = window.ymaps;
      const points = rulerPointsRef.current;

      if (points.length >= 2) {
        clearRuler();
        setActiveTool("ruler");
      }

      rulerPointsRef.current = [...rulerPointsRef.current, coords];

      if (rulerPointsRef.current.length === 2) {
        const [a, b] = rulerPointsRef.current;
        const km = haversineKm(a, b);
        setRulerDistance(formatDistance(km));

        rulerLayerRef.current = new ymaps.Polyline(
          [a, b],
          {},
          {
            strokeColor: "#2563eb",
            strokeWidth: 3,
            strokeOpacity: 0.9,
          }
        );

        map.geoObjects.add(rulerLayerRef.current);
      }
    };

    rulerClickRef.current = handleRulerClick;
    map.events.add("click", handleRulerClick);

    return () => {
      map.events.remove("click", handleRulerClick);
      if (rulerClickRef.current === handleRulerClick) {
        rulerClickRef.current = null;
      }
    };
  }, [activeTool, clearRuler, mapReady]);

  const externalUrl = buildExternalMapUrl({ city, district, address });
  const hasApiKey = Boolean(getYandexMapsApiKey());
  const lassoActive = drawing || activeTool === "lasso";
  const rulerActive = activeTool === "ruler";

  return (
    <div className={`relative ${className}`}>
      <div
        className={`relative overflow-hidden rounded-2xl border bg-slate-100 ${drawing ? "ring-2 ring-emerald-500/30" : ""}`}
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
          className={`h-full w-full ${drawing ? "cursor-crosshair touch-none" : rulerActive ? "cursor-crosshair" : ""}`}
        />

        {hasApiKey && mapReady && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-[500] flex flex-col items-center gap-2">
            <div className="relative">
              <ToolbarButton
                active={layersOpen}
                onClick={() => setLayersOpen((open) => !open)}
                title="Слои карты"
              >
                <Layers size={18} className="text-slate-700" />
              </ToolbarButton>

              {layersOpen && (
                <div className="absolute right-12 top-0 min-w-[120px] rounded-xl bg-white shadow-lg border border-black/5 py-1">
                  {MAP_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleMapTypeChange(type.id)}
                      className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                        mapType === type.id ? "text-emerald-600 font-semibold" : "text-slate-700"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.12)] border border-black/5 overflow-hidden">
              <button
                type="button"
                onClick={handleZoomIn}
                title="Приблизить"
                className="w-10 h-10 flex items-center justify-center text-emerald-600 text-2xl font-light leading-none hover:bg-slate-50"
              >
                +
              </button>
              <div className="border-t border-slate-200" />
              <button
                type="button"
                onClick={handleZoomOut}
                title="Отдалить"
                className="w-10 h-10 flex items-center justify-center text-slate-800 text-2xl font-light leading-none hover:bg-slate-50"
              >
                −
              </button>
            </div>

            {enableAreaDraw && (
              <ToolbarButton
                active={lassoActive || ring.length > 0}
                onClick={toggleLasso}
                disabled={!mapReady}
                title="Обвести область"
              >
                <AreaDrawIcon active={lassoActive || ring.length > 0} />
              </ToolbarButton>
            )}

            <ToolbarButton
              active={rulerActive}
              onClick={toggleRuler}
              disabled={!mapReady}
              title="Линейка"
            >
              <Ruler size={18} className={rulerActive ? "text-emerald-600" : "text-slate-700"} />
            </ToolbarButton>

            <ToolbarButton onClick={handleLocate} disabled={!mapReady} title="Моё местоположение">
              <Navigation size={18} className="text-slate-700 -rotate-45" />
            </ToolbarButton>
          </div>
        )}

        {enableAreaDraw && drawing && (
          <div className="absolute top-3 left-3 right-16 z-[500] pointer-events-none">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/95 border shadow-md px-3 py-2 text-sm text-slate-700">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Обводите область пальцем или мышью
            </div>
          </div>
        )}

        {enableAreaDraw && ring.length > 0 && !drawing && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-2">
            {onShowList && (
              <button
                type="button"
                onClick={() => onShowList(visibleListings)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white shadow-lg text-sm font-semibold hover:bg-slate-800"
              >
                <List size={16} />
                Список ({visibleListings.length})
              </button>
            )}
            <button
              type="button"
              onClick={clearArea}
              title="Сбросить область"
              className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white shadow-lg border border-black/5 hover:bg-slate-50"
            >
              <X size={18} className="text-slate-600" />
            </button>
          </div>
        )}

        {rulerActive && rulerDistance && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] rounded-xl bg-white shadow-lg border px-4 py-2 text-sm font-semibold text-slate-800">
            {rulerDistance}
          </div>
        )}

        {hasApiKey && mapReady && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noreferrer"
            className="absolute left-3 bottom-3 z-[500] inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/90 border shadow-sm text-xs font-medium text-slate-600 hover:bg-white"
          >
            <ExternalLink size={12} />
            2GIS
          </a>
        )}
      </div>
    </div>
  );
}
