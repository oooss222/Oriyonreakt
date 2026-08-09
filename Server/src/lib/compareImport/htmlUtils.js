function decodeHtml(text = "") {
  return String(text)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .trim();
}

function stripHtml(html = "") {
  return decodeHtml(String(html).replace(/<[^>]+>/g, " "));
}

function metaContent(html = "", key = "") {
  const safe = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${safe}["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${safe}["']`,
    "i"
  );
  const match = String(html).match(re);
  return decodeHtml(match?.[1] || match?.[2] || "");
}

function firstMatch(html = "", regex) {
  const match = String(html).match(regex);
  return match ? decodeHtml(match[1] || "").trim() : "";
}

function parsePriceDigits(raw = "") {
  const text = String(raw).trim().replace(/\s+/g, "");
  if (!text) return "";

  const normalized = text.replace(",", ".");
  const match = normalized.match(/^(\d+(?:\.\d+)?)/);
  if (!match) return "";

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return "";

  return String(Math.round(amount));
}

function stripPriceSuffix(title = "") {
  return String(title)
    .replace(/\s([\d][\d\s.,]{2,})\s*c\.?\s*$/i, "")
    .replace(/\s—\s*([\d][\d\s.,]*)\s*TJS\s*$/i, "")
    .trim();
}

function parseSomonPriceFromTitle(title = "") {
  const match = String(title).match(/([\d][\d\s.,]*)\s*c\.?\s*$/i);
  if (!match) return "";
  return parsePriceDigits(match[1]);
}

function parsePaydoTitle(title = "") {
  const clean = String(title).replace(/\s*\|\s*Paydo\.tj\s*$/i, "").trim();

  const simple = clean.match(/^(.+?)\s+в\s+(.+?)\s+—\s*([\d\s.,]+)\s*TJS\s*$/i);
  if (simple && !clean.includes("•")) {
    return {
      title: simple[1].trim(),
      price: parsePriceDigits(simple[3]),
      location: simple[2].trim(),
      specs: [],
    };
  }

  const priceMatch = clean.match(/—\s*([\d\s.,]+)\s*TJS\s*$/i);
  const price = priceMatch ? parsePriceDigits(priceMatch[1]) : "";
  const head = priceMatch ? clean.slice(0, priceMatch.index).trim() : clean;

  const parts = head
    .split("•")
    .map((part) => part.trim())
    .filter(Boolean);

  const specs = [];
  let location = "";

  for (const part of parts) {
    const rooms = part.match(/^(\d+)-комн\.?$/i);
    if (rooms) {
      specs.push({ name: "Комнат", value: rooms[1] });
      continue;
    }

    const floor = part.match(/^(\d+)\s*этаж$/i);
    if (floor) {
      specs.push({ name: "Этаж", value: floor[1] });
      continue;
    }

    const area = part.match(/^([\d.,]+)\s*м²$/i);
    if (area) {
      specs.push({ name: "Площадь общая", value: `${area[1]} м²` });
      continue;
    }

    const inCity = part.match(/^(.+?)\s+в\s+(.+)$/i);
    if (inCity) {
      specs.push({ name: "Тип", value: inCity[1].trim() });
      location = inCity[2].trim();
      continue;
    }

    if (!location && /душанбе|худжанд|куlob|бохтар/i.test(part)) {
      location = part;
    }
  }

  return {
    title: head || clean,
    price,
    location,
    specs,
  };
}

function parseSomonRealEstateTitle(title = "") {
  const withoutPrice = stripPriceSuffix(title);
  const specs = [];

  const rooms = withoutPrice.match(/(\d+)-комн\.?/i);
  if (rooms) specs.push({ name: "Комнат", value: rooms[1] });

  const floor = withoutPrice.match(/(\d+)\s*этаж/i);
  if (floor) specs.push({ name: "Этаж", value: floor[1] });

  const area = withoutPrice.match(/([\d.,]+)\s*м²/i);
  if (area) specs.push({ name: "Площадь общая", value: `${area[1]} м²` });

  const district = withoutPrice.match(/,\s*([^,]+)$/);
  const location = district ? district[1].trim() : "";

  return {
    title: withoutPrice,
    location,
    specs,
  };
}

function parseTransportTitle(title = "") {
  const withoutPrice = stripPriceSuffix(title);
  const specs = [];
  const year = withoutPrice.match(/,\s*(\d{4})\s*$/);

  if (year) {
    specs.push({ name: "Год", value: year[1] });
  }

  const cleanTitle = withoutPrice
    .replace(/,\s*\d{4}\s*$/, "")
    .replace(/,\s*$/, "")
    .trim();

  return {
    title: cleanTitle,
    specs,
  };
}

module.exports = {
  decodeHtml,
  stripHtml,
  metaContent,
  firstMatch,
  parsePriceDigits,
  parseSomonPriceFromTitle,
  stripPriceSuffix,
  parsePaydoTitle,
  parseSomonRealEstateTitle,
  parseTransportTitle,
};
