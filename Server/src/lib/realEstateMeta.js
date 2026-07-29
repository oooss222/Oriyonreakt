const CITY_COORDINATES = {
  Душанбе: { lat: 38.5598, lng: 68.787, zoom: 12 },
  Худжанд: { lat: 40.283, lng: 69.622, zoom: 12 },
  Бохтар: { lat: 37.836, lng: 68.781, zoom: 12 },
  Куляб: { lat: 37.909, lng: 69.782, zoom: 12 },
  Вахдат: { lat: 38.556, lng: 69.015, zoom: 13 },
  Истаравшан: { lat: 39.914, lng: 69.007, zoom: 12 },
  Турсунзаде: { lat: 38.512, lng: 68.231, zoom: 12 },
  Исфара: { lat: 40.126, lng: 70.625, zoom: 12 },
  Пенджикент: { lat: 39.492, lng: 67.608, zoom: 12 },
  Хорог: { lat: 37.491, lng: 71.559, zoom: 12 },
  Рогун: { lat: 38.691, lng: 69.958, zoom: 12 },
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

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

module.exports = {
  CITY_COORDINATES,
  extractRealEstateMeta,
  getSpecValue,
  parseAreaValue,
};
