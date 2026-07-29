export function parsePriceNumber(value) {
  if (value == null || value === "") return null;

  const n = Number(String(value).replace(/\s/g, "").replace(",", "."));

  return Number.isFinite(n) ? n : null;
}

export function formatPrice(
  value,
  { emptyLabel = "Цена не указана", currency = "TJS" } = {}
) {
  const n = parsePriceNumber(value);

  if (n == null) {
    if (value == null || value === "") {
      return emptyLabel;
    }

    return String(value);
  }

  return `${n.toLocaleString("ru-RU")} ${currency}`;
}

export function formatViewCount(count) {
  return Number(count || 0).toLocaleString("ru-RU");
}

export function formatViewsLabel(count) {
  return `${formatViewCount(count)} просмотров`;
}

export function formatMoney(
  value,
  { currency = "TJS", emptyLabel = "" } = {}
) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return emptyLabel;
  }

  return `${numeric.toLocaleString("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export function getListingDisplayDate(listing) {
  const created = listing?.createdAt ? new Date(listing.createdAt) : null;
  const bumped = listing?.bumpedAt ? new Date(listing.bumpedAt) : null;

  if (bumped && !Number.isNaN(bumped.getTime())) {
    if (!created || Number.isNaN(created.getTime()) || bumped > created) {
      return bumped;
    }
  }

  if (created && !Number.isNaN(created.getTime())) {
    return created;
  }

  return null;
}

export function formatListingDate(
  listing,
  { emptyLabel = "", withTime = false } = {}
) {
  const date = getListingDisplayDate(listing);

  if (!date) {
    return emptyLabel;
  }

  if (withTime) {
    return date.toLocaleString("ru-RU");
  }

  return date.toLocaleDateString("ru-RU");
}

export function isListingDateUpdated(listing) {
  const created = listing?.createdAt ? new Date(listing.createdAt) : null;
  const bumped = listing?.bumpedAt ? new Date(listing.bumpedAt) : null;

  return Boolean(
    bumped &&
      !Number.isNaN(bumped.getTime()) &&
      created &&
      !Number.isNaN(created.getTime()) &&
      bumped.getTime() > created.getTime()
  );
}
