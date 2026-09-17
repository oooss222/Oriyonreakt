/**
 * Tajikistan geography for listings filters.
 * Regions follow viloyats / capital; cities are the location values stored on listings.
 */

export const LOCATIONS = ["Душанбе", "Худжанд"];

/** Viloyat / capital → cities (must stay in sync with Server REGION_CITIES). */
export const REGIONS = ["Душанбе", "Согд"];

export const REGION_CITIES = {
  Душанбе: ["Душанбе"],
  Согд: ["Худжанд"],
};

export const CITY_COORDINATES = {
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
