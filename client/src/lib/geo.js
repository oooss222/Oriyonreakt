export function pointInPolygon(point, polygon = []) {
  if (!polygon.length) return true;

  const x = point.lng;
  const y = point.lat;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

export function normalizePolygon(raw = []) {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((point) => ({
      lat: Number(point?.lat),
      lng: Number(point?.lng),
    }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
}

export function filterListingsByPolygon(listings = [], polygon = [], getPosition) {
  const ring = normalizePolygon(polygon);
  if (!ring.length) return listings;

  return listings.filter((item) => {
    const position = getPosition(item);
    if (!position) return false;
    return pointInPolygon(position, ring);
  });
}

export function polygonToLatLngs(polygon = []) {
  return normalizePolygon(polygon).map((point) => [point.lat, point.lng]);
}

export function latLngsToPolygon(latlngs = []) {
  if (!Array.isArray(latlngs)) return [];

  const ring = Array.isArray(latlngs[0]) ? latlngs[0] : latlngs;

  return ring.map((point) => {
    if (Array.isArray(point)) {
      return { lat: point[0], lng: point[1] };
    }

    return { lat: point.lat, lng: point.lng };
  });
}
