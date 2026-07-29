import React from "react";
import { useNavigate } from "react-router-dom";
import { loadLeaflet, fixLeafletIcons } from "../lib/useLeaflet";
import { enrichRealEstateListing } from "../lib/realEstate";
import { getCityCoordinates } from "../data/realEstate";
import { formatPrice } from "../lib/format";

export default function RealEstateMap({
  listings = [],
  city = "Душанбе",
  height = 420,
  className = "",
}) {
  const nav = useNavigate();
  const containerRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const markersRef = React.useRef([]);

  const points = React.useMemo(
    () =>
      listings.map((item) => {
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
    [listings]
  );

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
        const map = L.map(containerRef.current, {
          scrollWheelZoom: true,
        }).setView([center.lat, center.lng], center.zoom || 12);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
          maxZoom: 19,
        }).addTo(map);

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

        if (bounds.length > 1) {
          map.fitBounds(bounds, { padding: [24, 24] });
        } else if (bounds.length === 1) {
          map.setView(bounds[0], 14);
        }

        mapRef.current = map;
        setTimeout(() => map.invalidateSize(), 100);
      } catch {
        // Map is optional — list view still works.
      }
    }

    initMap();

    return () => {
      active = false;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [points, city, nav]);

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-slate-100 ${className}`}
      style={{ height }}
    >
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
