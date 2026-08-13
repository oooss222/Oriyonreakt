import { REAL_ESTATE_CAT } from "../data/realEstate";
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
  const guests = getSpecValue(specs, "Гостей");
  const area =
    getSpecValue(specs, "Площадь общая") ||
    getSpecValue(specs, "Площадь дома") ||
    getSpecValue(specs, "Площадь") ||
    getSpecValue(specs, "Площадь участка");
  const floor = getSpecValue(specs, "Этаж");
  const floorsTotal = getSpecValue(specs, "Этажей в доме");
  const district = getSpecValue(specs, "Район");

  const parts = [];

  if (deal === "Посуточно") {
    if (guests) parts.push(`${guests} гост.`);
    if (rooms) parts.push(`${rooms} комн.`);
    if (area) parts.push(area.includes("м") || area.includes("сот") ? area : `${area} м²`);
  } else {
    if (rooms) parts.push(`${rooms} комн.`);
    if (area) parts.push(area.includes("м") || area.includes("сот") ? area : `${area} м²`);
    if (floor) {
      parts.push(
        floorsTotal ? `${floor}/${floorsTotal} эт.` : `${floor} эт.`
      );
    }
    if (deal) parts.unshift(deal);
  }

  if (!parts.length && subcategory) {
    parts.push(subcategory);
  }

  return {
    line: parts.join(" · "),
    deal,
    rooms,
    guests,
    area,
    floor,
    floorsTotal,
    district,
    pricePerSqm: formatPricePerSqm(null, area),
  };
}

export function buildRealEstateCardDisplay(listing = {}) {
  const summary = listing.realEstateSummary || {};
  const repair = getSpecValue(listing.specs, "Ремонт");
  const houseType = getSpecValue(listing.specs, "Тип дома");

  const titleParts = [];

  if (summary.rooms) {
    titleParts.push(`${summary.rooms}-комн.`);
  }

  if (summary.area) {
    const areaText = summary.area.includes("м")
      ? summary.area.replace(/\s*м²?/i, " м²")
      : `${summary.area} м²`;
    titleParts.push(areaText);
  }

  if (repair) {
    titleParts.push(`ремонт ${repair.toLowerCase()}`);
  }

  const specParts = [];

  if (summary.rooms) {
    specParts.push(`${summary.rooms} комн`);
  }

  if (summary.area) {
    const areaText = summary.area.includes("м")
      ? summary.area.replace(/\s*м²?/i, " м²")
      : `${summary.area} м²`;
    specParts.push(areaText);
  }

  if (summary.floor) {
    specParts.push(
      summary.floorsTotal
        ? `${summary.floor}/${summary.floorsTotal} эт`
        : `${summary.floor} эт`
    );
  }

  if (houseType) {
    specParts.push(houseType.toLowerCase());
  }

  return {
    title:
      titleParts.join(", ") ||
      listing.title ||
      summary.line ||
      "Без названия",
    specsLine: specParts.join(" · "),
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
      guests: getSpecValue(item.specs, "Гостей") || summary.guests,
      deal: item.reDealType || summary.deal,
      pricePerSqm,
    },
  };
}

export function formatStoredPricePerSqm(value) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  return `${Number(value).toLocaleString("ru-RU")} с./м²`;
}

export function calculatePricePerSqm(totalPrice, areaSqm) {
  const amount = Number(String(totalPrice || "").replace(/[^\d]/g, ""));
  const area = Number(String(areaSqm || "").replace(",", "."));

  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (!Number.isFinite(area) || area <= 0) return null;

  return Math.round(amount / area);
}

export function calculateTotalPriceFromPerSqm(pricePerSqm, areaSqm) {
  const perSqm = Number(String(pricePerSqm || "").replace(/[^\d]/g, ""));
  const area = Number(String(areaSqm || "").replace(",", "."));

  if (!Number.isFinite(perSqm) || perSqm <= 0) return null;
  if (!Number.isFinite(area) || area <= 0) return null;

  return Math.round(perSqm * area);
}

export function formatPricePerSqmValue(value) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  return `${Number(value).toLocaleString("ru-RU")} с./м²`;
}

export function buildRealEstateListingUrl(options = {}) {
  return buildSeoListingUrl(options);
}

export { buildRealEstateSeoPath, parseRealEstateSeoParams, isRealEstateSeoPath, buildRealEstatePageTitle, buildRealEstateMetaDescription, buildRealEstateCategoryUrl } from "./realestateSeo";
