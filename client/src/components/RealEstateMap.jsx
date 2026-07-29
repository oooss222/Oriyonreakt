import React from "react";
import { useNavigate } from "react-router-dom";
import { Lasso, List, RotateCcw, MapPin } from "lucide-react";
import { loadLeafletGeoman, fixLeafletIcons } from "../lib/useLeaflet";
import { enrichRealEstateListing } from "../lib/realEstate";
import { getCityCoordinates } from "../data/realEstate";
import { formatPrice } from "../lib/format";
import {
  filterListingsByPolygon,
  latLngsToPolygon,
  normalizePolygon,
  polygonToLatLngs,
} from "../lib/geo";

function getListingPosition(item) {
  const enriched = enrichRealEstateListing(item);
  return enriched.realEstateSummary?.mapPosition || null;
}

export default function RealEstateMap({
  listings = [],
  city = "Душанбе",
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
  const markersRef = React.useRef([]);
  const areaLayerRef = React.useRef(null);
  const drawCleanupRef = React.useRef(null);
  const [drawing, setDrawing] = React.useState(false);
  const [mapReady, setMapReady] = React.useState(false);

  const ring = React.useMemo(() => normalizePolygon(polygon), [polygon]);

  const visibleListings = React.useMemo(() => {
    if (!ring.length) return listings;
    return filterListingsByPolygon(listings, ring, getListingPosition);
  }, [listings, ring]);

  const points = React.useMemo(
    () =>
      visibleListings.map((item) => {
        const enriched = enrichRealEstateListing(item);
        const position = enriched.realEstateSummary?.mapPosition;
        return {
          id: item.id || item._id,
          title: item.title,
          price: formatPrice(item.price),
          position,
          item: enriched,
        };
      }),
    [visibleListings]
  );

  const renderMarkers = React.useCallback(
    (L, map) => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      const bounds = [];

      points.forEach((point) => {
        if (!point.id || !point.position) return;

        const marker = L.marker([point.position.lat, point.position.lng])
          .addTo(map)
          .bindPopup(
            `<strong>${point.price}</strong><br/>${point.title || "Объявление"}`
          );

        marker.on("click", () => {
          sessionStorage.setItem("ad_preview", JSON.stringify(point.item));
          nav(`/ad/${point.id}`);
        });

        markersRef.current.push(marker);
        bounds.push([point.position.lat, point.position.lng]);
      });

      if (ring.length) {
        const polyBounds = L.latLngBounds(polygonToLatLngs(ring));
        map.fitBounds(polyBounds, { padding: [32, 32] });
      } else if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [24, 24] });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 14);
      }
    },
    [points, ring, nav]
  );

  const renderAreaLayer = React.useCallback((L, map) => {
    if (areaLayerRef.current) {
      areaLayerRef.current.remove();
      areaLayerRef.current = null;
    }

    if (!ring.length) return;

    areaLayerRef.current = L.polygon(polygonToLatLngs(ring), {
      color: "#ff6a00",
      weight: 2,
      fillColor: "#ff6a00",
      fillOpacity: 0.12,
    }).addTo(map);
  }, [ring]);

  React.useEffect(() => {
    let active = true;

    async function initMap() {
      try {
        const L = await loadLeafletGeoman();
        if (!active || !containerRef.current) return;

        fixLeafletIcons(L);

        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        const center = getCityCoordinates(city);
        const map = L.map(containerRef.current, {
          scrollWheelZoom: true,
        }).setView([center.lat, center.lng], center.zoom || 12);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
          maxZoom: 19,
        }).addTo(map);

        mapRef.current = map;

        if (enableAreaDraw) {
          const onCreate = (event) => {
            map.pm.disableDraw();
            setDrawing(false);

            if (areaLayerRef.current) {
              areaLayerRef.current.remove();
            }

            areaLayerRef.current = event.layer;
            const latlngs = event.layer.getLatLngs()?.[0] || [];
            onPolygonChange?.(latLngsToPolygon(latlngs));
          };

          map.on("pm:create", onCreate);
          drawCleanupRef.current = () => map.off("pm:create", onCreate);
        }

        setMapReady(true);
        setTimeout(() => map.invalidateSize(), 100);
      } catch {
        setMapReady(false);
      }
    }

    initMap();

    return () => {
      active = false;
      drawCleanupRef.current?.();
      drawCleanupRef.current = null;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      if (areaLayerRef.current) {
        areaLayerRef.current.remove();
        areaLayerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapReady(false);
    };
  }, [city, enableAreaDraw]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.L) return;

    renderAreaLayer(window.L, map);
    renderMarkers(window.L, map);
  }, [points, ring, renderAreaLayer, renderMarkers]);

  const startDraw = async () => {
    const map = mapRef.current;
    if (!map?.pm) return;

    if (areaLayerRef.current) {
      areaLayerRef.current.remove();
      areaLayerRef.current = null;
    }

    onPolygonChange?.([]);
    map.pm.disableDraw();
    map.pm.enableDraw("Polygon", {
      freehand: true,
      allowSelfIntersection: false,
      pathOptions: {
        color: "#ff6a00",
        fillColor: "#ff6a00",
        fillOpacity: 0.15,
        weight: 2,
      },
    });
    setDrawing(true);
  };

  const clearArea = () => {
    const map = mapRef.current;
    map?.pm?.disableDraw();
    setDrawing(false);

    if (areaLayerRef.current) {
      areaLayerRef.current.remove();
      areaLayerRef.current = null;
    }

    onPolygonChange?.([]);
  };

  return (
    <div className={`relative ${className}`}>
      {enableAreaDraw && (
        <div className="absolute top-3 left-3 right-3 z-[500] flex flex-wrap items-center gap-2 pointer-events-none">
          <button
            type="button"
            onClick={startDraw}
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

      {enableAreaDraw && !ring.length && mapReady && (
        <div className="absolute bottom-3 left-3 right-3 z-[500] pointer-events-none">
          <div className="pointer-events-auto mx-auto max-w-md rounded-xl bg-white/95 border shadow-md px-4 py-3 text-sm text-slate-600 flex items-start gap-2">
            <MapPin size={16} className="text-sun shrink-0 mt-0.5" />
            <span>
              Зажмите и проведите пальцем (или мышью), чтобы обвести район поиска.
              Покажем только объявления внутри области.
            </span>
          </div>
        </div>
      )}

      <div
        className={`overflow-hidden rounded-2xl border bg-slate-100 ${drawing ? "ring-2 ring-sun/40" : ""}`}
        style={{ height }}
      >
        <div ref={containerRef} className="h-full w-full touch-none" />
      </div>
    </div>
  );
}
