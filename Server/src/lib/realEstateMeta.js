const CITY_COORDINATES = {
  Душанбе: { lat: 38.5598, lng: 68.787, zoom: 12 },
  Худжанд: { lat: 40.283, lng: 69.622, zoom: 12 },
  Бохтар: { lat: 37.8383, lng: 68.777, zoom: 12 },
  Куляб: { lat: 37.9097, lng: 69.7817, zoom: 12 },
  Турсунзаде: { lat: 38.5127, lng: 68.2316, zoom: 12 },
  Вахдат: { lat: 38.5506, lng: 69.0207, zoom: 12 },
  Истаравшан: { lat: 39.9142, lng: 69.0063, zoom: 12 },
  Исфара: { lat: 40.1265, lng: 70.6253, zoom: 12 },
  Канибадам: { lat: 40.292, lng: 70.427, zoom: 12 },
  Пенджикент: { lat: 39.495, lng: 67.609, zoom: 12 },
  Бустон: { lat: 40.345, lng: 69.694, zoom: 12 },
  Гулистон: { lat: 40.283, lng: 69.75, zoom: 12 },
  Хорог: { lat: 37.4897, lng: 71.5561, zoom: 12 },
  Норэк: { lat: 38.389, lng: 69.325, zoom: 12 },
  Яван: { lat: 38.314, lng: 69.045, zoom: 12 },
  Дангара: { lat: 38.098, lng: 69.347, zoom: 12 },
  Левакант: { lat: 37.874, lng: 68.926, zoom: 12 },
  Фархор: { lat: 37.497, lng: 69.403, zoom: 12 },
};

function getSpecValue(specs, name) {
  if (!Array.isArray(specs)) return "";

  const row = specs.find(
    (item) => String(item?.name || "").trim() === String(name).trim()
  );

  return String(row?.value || "").trim();
}

function parseAreaValue(raw = "") {
  const match = String(raw).replace(/\s/g, "").match(/[\d.,]+/);
  if (!match) return null;

  const value = Number(String(match[0]).replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function parseInteger(raw = "") {
  const match = String(raw).replace(/\s/g, "").match(/\d+/);
  if (!match) return null;

  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

function parsePriceNumber(price = "") {
  const raw = String(price).replace(/[^\d.,]/g, "").replace(",", ".");
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function extractRealEstateMeta({
  specs = [],
  price = "",
  location = "",
  lat = null,
  lng = null,
} = {}) {
  const dealType = getSpecValue(specs, "Тип сделки");
  const rooms = getSpecValue(specs, "Комнат");
  const areaRaw =
    getSpecValue(specs, "Площадь общая") ||
    getSpecValue(specs, "Площадь дома") ||
    getSpecValue(specs, "Площадь") ||
    getSpecValue(specs, "Площадь участка");
  const areaSqm = parseAreaValue(areaRaw);
  const floor = parseInteger(getSpecValue(specs, "Этаж"));
  const floorsTotal = parseInteger(getSpecValue(specs, "Этажей в доме"));
  const district = getSpecValue(specs, "Район");

  const priceAmount = parsePriceNumber(price);
  const pricePerSqm =
    areaSqm && priceAmount ? Math.round(priceAmount / areaSqm) : null;

  let reLat = toNumberOrNull(lat);
  let reLng = toNumberOrNull(lng);

  if (reLat == null || reLng == null) {
    const cityCoords = CITY_COORDINATES[location];
    if (cityCoords) {
      reLat = cityCoords.lat;
      reLng = cityCoords.lng;
    }
  }

  return {
    re_deal_type: dealType || null,
    re_rooms: rooms || null,
    re_area_sqm: areaSqm,
    re_floor: floor,
    re_floors_total: floorsTotal,
    re_district: district || null,
    re_lat: reLat,
    re_lng: reLng,
    re_price_per_sqm: pricePerSqm,
  };
}

module.exports = {
  CITY_COORDINATES,
  extractRealEstateMeta,
  getSpecValue,
  parseAreaValue,
};
