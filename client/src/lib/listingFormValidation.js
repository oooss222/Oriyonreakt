import { DESC_MAX, TITLE_MAX } from "../data/listingCategories";
import { getPriceDigits, PRICE_MAX_DIGITS } from "../data/specOptions";
import {
  getDistrictsForCity,
  REAL_ESTATE_CAT,
} from "../data/realEstate";
import { getSpecValue } from "./realEstate";
import {
  getListingMinPhotos,
  getListingPhotoLimit,
} from "./listingPhotoLimits";
import { areListingSpecsComplete } from "../components/listing/ListingFormSpecFields";

const RE_DETAIL_FIELD_NAMES = [
  "Гостей",
  "Комнат",
  "Площадь общая",
  "Площадь дома",
  "Площадь",
  "Площадь участка",
  "Этаж",
  "Этажей в доме",
  "Тип дома",
  "Год постройки",
  "Ремонт",
  "Мебель",
  "Удобства",
  "Техника",
  "Коммунальные",
  "Интернет",
  "Балкон",
  "Животные",
  "Курение",
  "Дети",
  "Срок аренды",
  "Залог",
  "Состояние",
];

export function getRealEstateDetailFields(specs, { isDaily, isRent }) {
  return specs.filter((row) => {
    if (row.dailyOnly && !isDaily) return false;
    if (row.rentOnly && !isRent) return false;

    if (["Животные", "Курение"].includes(row.name) && !isDaily && !isRent) {
      return false;
    }

    return RE_DETAIL_FIELD_NAMES.includes(row.name);
  });
}

export function getRealEstateAreaValue(specs) {
  return (
    getSpecValue(specs, "Площадь общая") ||
    getSpecValue(specs, "Площадь дома") ||
    getSpecValue(specs, "Площадь") ||
    getSpecValue(specs, "Площадь участка")
  );
}

export function areRealEstateCoreSpecsComplete(form, specs) {
  if (!form.subcategory?.trim()) return false;
  if (!getSpecValue(specs, "Тип сделки")) return false;
  if (!form.location?.trim()) return false;

  const districts = getDistrictsForCity(form.location);
  if (districts.length && !getSpecValue(specs, "Район")) return false;

  const dealType = getSpecValue(specs, "Тип сделки");
  const isDaily = dealType === "Посуточно";
  const needsRooms = ["Квартиры", "Новостройки", "Дома и коттеджи"].includes(
    form.subcategory
  );
  const needsArea = !["Гаражи и парковки"].includes(form.subcategory);

  if (needsRooms && !getSpecValue(specs, "Комнат")) return false;
  if (isDaily && needsRooms && !getSpecValue(specs, "Гостей")) return false;
  if (needsArea && !getRealEstateAreaValue(specs)) return false;

  return true;
}

export function validateListingForm({
  form,
  specs,
  existingImages = [],
  files = [],
  isRealEstate = false,
  t,
}) {
  const tr = (key, vars) => (t ? t(key, vars) : key);

  const fail = (message, field) => ({ message, field });

  if (!form.title?.trim() || !form.cat?.trim() || !form.subcategory?.trim()) {
    return fail(tr("form.validationTitle"), form.title?.trim() ? "category" : "title");
  }

  if (form.title.trim().length > TITLE_MAX) {
    return fail(tr("form.validationTitleMax", { max: TITLE_MAX }), "title");
  }

  if (getPriceDigits(form.price).length > PRICE_MAX_DIGITS) {
    return fail(tr("form.validationPriceMax", { max: PRICE_MAX_DIGITS }), "price");
  }

  if ((form.description || "").length > DESC_MAX) {
    return fail(tr("form.validationDescMax", { max: DESC_MAX }), "description");
  }

  if (!form.location?.trim()) {
    return fail(tr("form.validationLocation"), "location");
  }

  if (!getPriceDigits(form.price)) {
    return fail(tr("form.validationPrice"), "price");
  }

  const photoLimit = getListingPhotoLimit(form.cat);
  const minPhotos = getListingMinPhotos(form.cat);
  const totalPhotos = existingImages.length + files.length;

  if (totalPhotos > photoLimit) {
    return fail(tr("form.validationPhotoMax", { max: photoLimit }), "photos");
  }

  if (totalPhotos < minPhotos) {
    return fail(
      minPhotos === 1
        ? tr("form.validationPhotoMin1")
        : tr("form.validationPhotoMin", { min: minPhotos }),
      "photos"
    );
  }

  if (isRealEstate || form.cat === REAL_ESTATE_CAT) {
    if (!areRealEstateCoreSpecsComplete(form, specs)) {
      return fail(tr("form.validationReCore"), "specs");
    }
  } else if (!areListingSpecsComplete(specs)) {
    return fail(tr("form.validationSpecs"), "specs");
  }

  return { message: "", field: "" };
}

export function buildPublishHintParts({
  form,
  specs,
  photosCount,
  minPhotos,
  isRealEstate,
  t,
}) {
  const tr = (key, vars) => (t ? t(key, vars) : key);
  const parts = [];

  if (!form.title?.trim()) parts.push(tr("form.hintTitle"));
  if (!getPriceDigits(form.price)) parts.push(tr("form.hintPrice"));

  if (photosCount < minPhotos) {
    parts.push(
      minPhotos === 1
        ? tr("form.hintPhotoMin1")
        : tr("form.hintPhotoMin", { min: minPhotos })
    );
  }

  if (isRealEstate) {
    if (!areRealEstateCoreSpecsComplete(form, specs)) {
      parts.push(tr("form.hintReParams"));
    }
  } else if (!areListingSpecsComplete(specs)) {
    parts.push(tr("form.hintSpecs"));
  }

  return parts;
}
