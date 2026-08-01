import { REAL_ESTATE_CAT, DEAL_TYPES, ROOM_OPTIONS } from "../data/realEstate";

const CITY_SLUGS = {
  dushanbe: "Душанбе",
  khujand: "Худжанд",
};

const SUBCATEGORY_SLUGS = {
  novostroyki: "Новостройки",
  kvartiry: "Квартиры",
  komnaty: "Комнаты",
  doma: "Дома и коттеджи",
  uchastki: "Участки",
  garazhi: "Гаражи и парковки",
  kommercheskaya: "Коммерческая недвижимость",
};

const DEAL_SLUGS = {
  kupit: "Купить",
  snyat: "Снять",
  posutochno: "Посуточно",
};

const ROOM_SLUGS = {
  "1-komnatnaya": "1",
  "2-komnatnye": "2",
  "3-komnatnye": "3",
  "4-komnatnye": "4",
  "5-komnatnye": "5",
  "5-plus-komnat": "5+",
};

function invertMap(map) {
  return Object.fromEntries(
    Object.entries(map).map(([slug, label]) => [label, slug])
  );
}

const CITY_BY_LABEL = invertMap(CITY_SLUGS);
const SUBCATEGORY_BY_LABEL = invertMap(SUBCATEGORY_SLUGS);
const DEAL_BY_LABEL = invertMap(DEAL_SLUGS);
const ROOM_BY_LABEL = invertMap(ROOM_SLUGS);

export function slugifyCity(city = "") {
  return CITY_BY_LABEL[city] || "";
}

export function slugifySubcategory(subcategory = "") {
  return SUBCATEGORY_BY_LABEL[subcategory] || "";
}

export function slugifyDeal(deal = "") {
  return DEAL_BY_LABEL[deal] || "";
}

export function slugifyRooms(rooms = "") {
  return ROOM_BY_LABEL[rooms] || "";
}

export function parseRealEstateSeoParams(params = {}) {
  const city = CITY_SLUGS[params.citySlug] || "";
  const subcategory = SUBCATEGORY_SLUGS[params.subSlug] || "";
  const dealType = DEAL_SLUGS[params.dealSlug] || "";
  const rooms = ROOM_SLUGS[params.roomsSlug] || "";

  const draft = {
    cat: REAL_ESTATE_CAT,
    location: city,
    subcategory,
    specs: {},
  };

  if (dealType) draft.specs["Тип сделки"] = dealType;
  if (rooms) draft.specs["Комнат"] = rooms;

  return draft;
}

export function isRealEstateSeoPath(pathname = "") {
  if (!pathname.startsWith("/realestate/")) return false;
  if (pathname.startsWith("/realestate/zhk/")) return false;
  if (pathname.startsWith("/realestate/sravnenie")) return false;
  return Boolean(pathname.split("/")[2]);
}

export function buildRealEstateSeoPath({
  city = "",
  subcategory = "",
  dealType = "",
  rooms = "",
} = {}) {
  const citySlug = slugifyCity(city);
  if (!citySlug) return "/realestate";

  const parts = ["realestate", citySlug];
  const subSlug = slugifySubcategory(subcategory);
  if (subSlug) parts.push(subSlug);

  const dealSlug = slugifyDeal(dealType);
  if (dealSlug) parts.push(dealSlug);

  const roomsSlug = slugifyRooms(rooms);
  if (roomsSlug) parts.push(roomsSlug);

  return `/${parts.join("/")}`;
}

export function buildRealEstateListingUrl({
  dealType = "",
  subcategory = "",
  city = "",
  rooms = "",
  priceFrom = "",
  priceTo = "",
  specs = {},
  sort = "",
  areaFrom = "",
  areaTo = "",
  floorFrom = "",
  floorTo = "",
  floorNotFirst = false,
  floorNotLast = false,
  sellerType = "",
  pricePerSqmFrom = "",
  pricePerSqmTo = "",
} = {}) {
  if (dealType) specs = { ...specs, "Тип сделки": dealType };
  if (rooms) specs = { ...specs, Комнат: rooms };

  const hasExtra =
    priceFrom ||
    priceTo ||
    sort ||
    areaFrom ||
    areaTo ||
    floorFrom ||
    floorTo ||
    floorNotFirst ||
    floorNotLast ||
    sellerType ||
    pricePerSqmFrom ||
    pricePerSqmTo ||
    Object.keys(specs).some(
      (key) =>
        key !== "Тип сделки" &&
        key !== "Комнат" &&
        specs[key]
    );

  if (!hasExtra && city && slugifyCity(city)) {
    return buildRealEstateSeoPath({
      city,
      subcategory,
      dealType: specs["Тип сделки"] || dealType,
      rooms: specs["Комнат"] || rooms,
    });
  }

  const params = new URLSearchParams();
  params.set("cat", REAL_ESTATE_CAT);

  if (subcategory) params.set("subcategory", subcategory);
  if (city) params.set("location", city);
  if (priceFrom) params.set("priceFrom", priceFrom);
  if (priceTo) params.set("priceTo", priceTo);
  if (sort) params.set("sort", sort);
  if (areaFrom) params.set("areaFrom", areaFrom);
  if (areaTo) params.set("areaTo", areaTo);
  if (floorFrom) params.set("floorFrom", floorFrom);
  if (floorTo) params.set("floorTo", floorTo);
  if (floorNotFirst) params.set("floorNotFirst", "1");
  if (floorNotLast) params.set("floorNotLast", "1");
  if (sellerType) params.set("sellerType", sellerType);
  if (pricePerSqmFrom) params.set("pricePerSqmFrom", pricePerSqmFrom);
  if (pricePerSqmTo) params.set("pricePerSqmTo", pricePerSqmTo);

  const specEntries = Object.entries(specs).filter(
    ([key, value]) => String(key).trim() && String(value).trim()
  );

  if (specEntries.length) {
    params.set("specs", JSON.stringify(Object.fromEntries(specEntries)));
  }

  return `/listing?${params.toString()}`;
}

export function buildRealEstatePageTitle(draft = {}) {
  const city = draft.location || "";
  const subcategory = draft.subcategory || "";
  const deal = draft.specs?.["Тип сделки"] || "";
  const rooms = draft.specs?.["Комнат"] || "";
  const district = draft.specs?.["Район"] || "";

  const parts = [];

  if (subcategory) {
    parts.push(subcategory);
  } else {
    parts.push("Недвижимость");
  }

  if (rooms) {
    parts.push(`${rooms}-комн.`);
  }

  if (deal) {
    parts.push(deal.toLowerCase());
  }

  if (city) {
    parts.push(`в ${city}`);
  }

  if (district) {
    parts.push(`· ${district}`);
  }

  return parts.join(" ");
}

export function buildRealEstateMetaDescription(draft = {}) {
  const title = buildRealEstatePageTitle(draft);
  return `${title} — объявления на Oriyon.store. Фильтры по цене, площади, этажу и району.`;
}

export { CITY_SLUGS, SUBCATEGORY_SLUGS, DEAL_SLUGS, ROOM_SLUGS, DEAL_TYPES, ROOM_OPTIONS };
