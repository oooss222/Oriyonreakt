import { TITLE_MAX } from "../data/listingCategories";
import { getSpecValue } from "./realEstate";

export function buildRealEstateSuggestedTitle(form, specs) {
  const rooms = getSpecValue(specs, "Комнат");
  const district = getSpecValue(specs, "Район");
  const deal = getSpecValue(specs, "Тип сделки");
  const parts = [];

  if (deal) parts.push(deal);
  if (rooms) parts.push(`${rooms}-комн.`);
  if (form.subcategory) parts.push(form.subcategory.toLowerCase());
  if (district) parts.push(district);
  else if (form.location) parts.push(form.location);

  return parts.join(", ").slice(0, TITLE_MAX);
}

export function buildTransportSuggestedTitle(specs) {
  const brand =
    getSpecValue(specs, "Марка") || getSpecValue(specs, "Марка авто");
  const model = getSpecValue(specs, "Модель");
  const year = getSpecValue(specs, "Год");
  const kpp = getSpecValue(specs, "КПП");
  const fuel = getSpecValue(specs, "Топливо");
  const parts = [];

  if (brand && model) parts.push(`${brand} ${model}`);
  else if (brand) parts.push(brand);
  else if (model) parts.push(model);

  if (year) parts.push(year);

  const extras = [kpp, fuel].filter(Boolean);
  if (extras.length) parts.push(extras.join(", ").toLowerCase());

  return parts.join(", ").slice(0, TITLE_MAX);
}
