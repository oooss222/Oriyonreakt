export function normalizePolygon(polygon = []) {
  if (!Array.isArray(polygon)) return [];

  return polygon
    .map((point) => {
      if (Array.isArray(point)) {
        return { lat: Number(point[0]), lng: Number(point[1]) };
      }

      return {
        lat: Number(point?.lat),
        lng: Number(point?.lng),
      };
    })
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
}

export function polygonToLatLngs(ring = []) {
  return normalizePolygon(ring).map((point) => [point.lat, point.lng]);
}

export function latLngsToPolygon(latlngs = []) {
  return latlngs
    .map((point) => {
      if (Array.isArray(point)) {
        return { lat: Number(point[0]), lng: Number(point[1]) };
      }

      return { lat: Number(point?.lat), lng: Number(point?.lng) };
    })
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
}

export function pointInPolygon(point, polygon = []) {
  const ring = normalizePolygon(polygon);
  if (ring.length < 3 || !point) return false;

  const x = Number(point.lng);
  const y = Number(point.lat);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;

  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].lng;
    const yi = ring[i].lat;
    const xj = ring[j].lng;
    const yj = ring[j].lat;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

export function filterListingsByPolygon(listings = [], polygon = [], getPosition) {
  const ring = normalizePolygon(polygon);
  if (!ring.length) return listings;

  return listings.filter((item) => {
    const position = getPosition?.(item);
    if (!position) return false;
    return pointInPolygon(position, ring);
  });
}

export function simplifyRing(coords = [], minStep = 0.00008) {
  if (coords.length <= 3) return coords;

  const simplified = [coords[0]];

  for (let i = 1; i < coords.length; i += 1) {
    const prev = simplified[simplified.length - 1];
    const curr = coords[i];
    const dx = curr[0] - prev[0];
    const dy = curr[1] - prev[1];

    if (dx * dx + dy * dy >= minStep * minStep) {
      simplified.push(curr);
    }
  }

  return simplified.length >= 3 ? simplified : coords.slice(0, 3);
}
