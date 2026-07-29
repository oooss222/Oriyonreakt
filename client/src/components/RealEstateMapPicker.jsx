import React from "react";
import { MapPin } from "lucide-react";
import { loadLeaflet, fixLeafletIcons } from "../lib/useLeaflet";
import { getCityCoordinates } from "../data/realEstate";

export default function RealEstateMapPicker({
  city = "Душанбе",
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
      try {
        const L = await loadLeaflet();
        if (!active || !containerRef.current) return;

        fixLeafletIcons(L);

        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        const center = getCityCoordinates(city);
        const startLat = lat ?? center.lat;
        const startLng = lng ?? center.lng;

        const map = L.map(containerRef.current).setView(
          [startLat, startLng],
          center.zoom || 12
        );

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
          maxZoom: 19,
        }).addTo(map);

        const marker = L.marker([startLat, startLng], { draggable: true }).addTo(
          map
        );

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onChange?.({ lat: pos.lat, lng: pos.lng });
        });

        map.on("click", (event) => {
          marker.setLatLng(event.latlng);
          onChange?.({ lat: event.latlng.lat, lng: event.latlng.lng });
        });

        markerRef.current = marker;
        mapRef.current = map;
        setTimeout(() => map.invalidateSize(), 100);
      } catch {
        // ignore
      }
    }

    initMap();

    return () => {
      active = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
  }, [city]);

  React.useEffect(() => {
    if (!markerRef.current || lat == null || lng == null) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current?.panTo([lat, lng]);
  }, [lat, lng]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <MapPin size={16} className="text-sun" />
        Нажмите на карту или перетащите метку, чтобы указать расположение
      </div>
      <div
        className="overflow-hidden rounded-2xl border bg-slate-100"
        style={{ height }}
      >
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
