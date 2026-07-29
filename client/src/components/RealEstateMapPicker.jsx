import React from "react";
import { MapPin, ExternalLink } from "lucide-react";
import { loadYandexMaps, buildExternalMapUrl, getYandexMapsApiKey } from "../lib/useYandexMaps";
import { getCityCoordinates } from "../data/realEstate";

export default function RealEstateMapPicker({
  city = "Душанбе",
  district = "",
  address = "",
  lat,
  lng,
  onChange,
  height = 280,
}) {
  const containerRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const markerRef = React.useRef(null);

  React.useEffect(() => {
    let active = true;

    async function initMap() {
      if (!getYandexMapsApiKey()) return;

      try {
        const ymaps = await loadYandexMaps();
        if (!active || !containerRef.current) return;

        if (mapRef.current) {
          mapRef.current.destroy();
          mapRef.current = null;
        }

        const center = getCityCoordinates(city);
        const startLat = lat ?? center.lat;
        const startLng = lng ?? center.lng;

        const map = new ymaps.Map(containerRef.current, {
          center: [startLat, startLng],
          zoom: center.zoom || 12,
          controls: ["zoomControl"],
        });

        const placemark = new ymaps.Placemark(
          [startLat, startLng],
          {},
          { draggable: true, preset: "islands#orangeDotIcon" }
        );

        placemark.events.add("dragend", () => {
          const coords = placemark.geometry.getCoordinates();
          onChange?.({ lat: coords[0], lng: coords[1] });
        });

        map.events.add("click", (event) => {
          const coords = event.get("coords");
          placemark.geometry.setCoordinates(coords);
          onChange?.({ lat: coords[0], lng: coords[1] });
        });

        markerRef.current = placemark;
        map.geoObjects.add(placemark);
        mapRef.current = map;
      } catch {
        // ignore
      }
    }

    initMap();

    return () => {
      active = false;
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
  }, [city]);

  React.useEffect(() => {
    if (!markerRef.current || lat == null || lng == null || !mapRef.current) return;
    markerRef.current.geometry.setCoordinates([lat, lng]);
    mapRef.current.setCenter([lat, lng], mapRef.current.getZoom(), { duration: 200 });
  }, [lat, lng]);

  const externalUrl = buildExternalMapUrl({ city, district, address });

  if (!getYandexMapsApiKey()) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin size={16} className="text-sun" />
          Укажите адрес текстом или откройте карту в 2GIS
        </div>
        <a
          href={externalUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-white text-sm font-medium hover:bg-slate-50"
        >
          <ExternalLink size={15} />
          Открыть район в 2GIS
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <MapPin size={16} className="text-sun" />
        Нажмите на карту или перетащите метку
      </div>
      <div className="overflow-hidden rounded-2xl border bg-slate-100" style={{ height }}>
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
