import { REAL_ESTATE_CAT, getCityCoordinates } from "../data/realEstate";
import { buildRealEstateListingUrl as buildSeoListingUrl } from "./realestateSeo";

export function isRealEstateListing(item) {
  return String(item?.cat || "") === REAL_ESTATE_CAT;
}

export function getSpecValue(specs, name) {
  if (!Array.isArray(specs)) return "";

  const row = specs.find(
    (item) => String(item?.name || "").trim() === String(name).trim()
  );

  return String(row?.value || "").trim();
}

export function parseAreaValue(raw = "") {
  const match = String(raw).replace(/\s/g, "").match(/[\d.,]+/);
  if (!match) return null;

  const value = Number(String(match[0]).replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function formatPricePerSqm(price, areaRaw) {
  const area = parseAreaValue(areaRaw);
  const amount = Number(String(price || "").replace(/[^\d]/g, ""));

  if (!area || !amount) return null;

  const perSqm = Math.round(amount / area);
  return `${perSqm.toLocaleString("ru-RU")} с./м²`;
}

export function buildRealEstateSummary(specs = [], subcategory = "") {
  const deal = getSpecValue(specs, "Тип сделки");
  const rooms = getSpecValue(specs, "Комнат");
  const area =
    getSpecValue(specs, "Площадь общая") ||
    getSpecValue(specs, "Площадь дома") ||
    getSpecValue(specs, "Площадь") ||
    getSpecValue(specs, "Площадь участка");
  const floor = getSpecValue(specs, "Этаж");
  const floorsTotal = getSpecValue(specs, "Этажей в доме");
  const district = getSpecValue(specs, "Район");

  const parts = [];

  if (rooms) parts.push(`${rooms} комн.`);
  if (area) parts.push(area.includes("м") || area.includes("сот") ? area : `${area} м²`);
  if (floor) {
    parts.push(
      floorsTotal ? `${floor}/${floorsTotal} эт.` : `${floor} эт.`
    );
  }

  if (!parts.length && subcategory) {
    parts.push(subcategory);
  }

  if (deal) parts.unshift(deal);

  return {
    line: parts.join(" · "),
    deal,
    rooms,
    area,
    floor,
    floorsTotal,
    district,
    pricePerSqm: formatPricePerSqm(null, area),
  };
}

export function enrichRealEstateListing(item) {
  if (!isRealEstateListing(item)) return item;

  const summary = buildRealEstateSummary(item.specs, item.subcategory);
  const areaFromDb = item.reAreaSqm ? `${item.reAreaSqm} м²` : summary.area;
  const pricePerSqm =
    formatStoredPricePerSqm(item.rePricePerSqm) ||
    formatPricePerSqm(item.price, areaFromDb || summary.area);

  return {
    ...item,
    realEstateSummary: {
      ...summary,
      area: areaFromDb || summary.area,
      district: item.reDistrict || summary.district,
      floor: item.reFloor != null ? String(item.reFloor) : summary.floor,
      floorsTotal:
        item.reFloorsTotal != null
          ? String(item.reFloorsTotal)
          : summary.floorsTotal,
      rooms: item.reRooms || summary.rooms,
      deal: item.reDealType || summary.deal,
      pricePerSqm,
      mapPosition: getListingMapPosition(item),
    },
  };
}

export function getListingMapPosition(item) {
  if (item?.reLat != null && item?.reLng != null) {
    return { lat: item.reLat, lng: item.reLng };
  }

  const city = item?.location || "Душанбе";
  return getCityCoordinates(city);
}

export function formatStoredPricePerSqm(value) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  return `${Number(value).toLocaleString("ru-RU")} с./м²`;
}

export function buildRealEstateListingUrl(options = {}) {
  return buildSeoListingUrl(options);
}

export { buildRealEstateSeoPath, parseRealEstateSeoParams, isRealEstateSeoPath, buildRealEstatePageTitle, buildRealEstateMetaDescription } from "./realestateSeo";
