const { detectPlatform, normalizeUrl } = require("./detectPlatform");
const {
  metaContent,
  firstMatch,
  parsePriceDigits,
  parseSomonPriceFromTitle,
  parsePaydoTitle,
  parseSomonRealEstateTitle,
  parseTransportTitle,
  stripHtml,
  stripPriceSuffix,
} = require("./htmlUtils");

const IGNORED_CRUMBS = new Set([
  "все объявления",
  "главная",
  "транспорт",
  "недвижимость",
  "телефоны и связь",
  "электроника и бытовая техника",
  "компьютеры и оргтехника",
  "мебель",
]);

const SPEC_MAP = {
  realestate: {
    "Площадь": "Площадь общая",
    "Площадь:": "Площадь общая",
    "Этаж": "Этаж",
    "Этажей в доме": "Этажей в доме",
    "Район": "Район",
    "Ремонт": "Ремонт",
    "ЖК": "ЖК",
    "Комнат": "Комнат",
    "Тип застройки": "Тип",
  },
  transport: {
    "Год выпуска": "Год",
    "Коробка передач": "КПП",
    "Вид топлива": "Топливо",
    "Пробег": "Пробег",
    "Состояние": "Состояние",
    "Марка": "Марка",
    "Модель": "Модель",
    "Цвет": "Цвет",
  },
  phones: {
    "Производитель": "Производитель",
    "Модель": "Модель",
    "Память": "Память",
    "Состояние": "Состояние",
    "Гарантия": "Гарантия",
  },
  electronics: {
    "Тип": "Тип",
    "Бренд": "Бренд",
    "Модель": "Модель",
    "Состояние": "Состояние",
    "Гарантия": "Гарантия",
  },
  computers: {
    "Тип": "Тип",
    "Бренд": "Бренд",
    "Модель": "Модель",
    "Процессор": "Процессор",
    "ОЗУ": "ОЗУ",
    "Накопитель": "Накопитель",
    "Видеокарта": "Видеокарта",
    "Состояние": "Состояние",
  },
  furniture: {
    "Тип": "Тип",
    "Материал": "Материал",
    "Состояние": "Состояние",
    "Цвет": "Цвет",
    "Размеры": "Размеры",
  },
};

function normalizeLabel(label = "") {
  return String(label).replace(/:$/, "").trim();
}

function normalizeValue(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function mapSpecsForCategory(specs = [], cat = "") {
  const map = SPEC_MAP[cat] || {};
  const merged = new Map();

  for (const row of specs) {
    const rawName = normalizeLabel(row?.name);
    const rawValue = normalizeValue(row?.value);
    if (!rawName || !rawValue) continue;

    const name = map[rawName] || rawName;
    if (!merged.has(name)) {
      merged.set(name, rawValue);
    }
  }

  return [...merged.entries()].map(([name, value]) => ({ name, value }));
}

function mergeSpecs(...lists) {
  const merged = new Map();
  for (const list of lists) {
    for (const row of list || []) {
      const name = normalizeLabel(row?.name);
      const value = normalizeValue(row?.value);
      if (!name || !value) continue;
      merged.set(name, value);
    }
  }
  return [...merged.entries()].map(([name, value]) => ({ name, value }));
}

function extractKeyChars(html = "") {
  const rows = [];
  const re =
    /<span class="key-chars">([\s\S]*?)<\/span>[\s\S]*?class="value-chars"[^>]*>([\s\S]*?)<\//gi;

  for (const match of String(html).matchAll(re)) {
    const name = stripHtml(match[1]);
    const value = stripHtml(match[2]);
    if (name && value) rows.push({ name, value });
  }

  return rows;
}

function extractLabelValuePairs(html = "") {
  const rows = [];
  const seen = new Set();
  const patterns = [
    /"label"\s*:\s*"([^"]+)"[\s\S]{0,120}?"value"\s*:\s*"([^"]*)"/g,
    /"title"\s*:\s*"([^"]+)"[\s\S]{0,120}?"value"\s*:\s*"([^"]*)"/g,
    /"name"\s*:\s*"([^"]+)"[\s\S]{0,120}?"value"\s*:\s*"([^"]*)"/g,
  ];

  for (const re of patterns) {
    for (const match of String(html).matchAll(re)) {
      const name = normalizeLabel(stripHtml(match[1]));
      const value = normalizeValue(stripHtml(match[2]));
      const key = `${name}:${value}`;
      if (!name || !value || seen.has(key)) continue;
      if (name.length > 80 || value.length > 120) continue;
      seen.add(key);
      rows.push({ name, value });
      if (rows.length >= 24) return rows;
    }
  }

  return rows;
}

function extractPaydoCity(html = "", fallback = "") {
  if (fallback) return fallback;

  const cityInStrings = [...String(html).matchAll(/,"([А-ЯA-ZЁ][^"]{2,30})","(?:null|\d)/g)]
    .map((match) => match[1])
    .find((value) => /душанбе|худжанд|бохтар|куляб|хорог/i.test(value));

  return cityInStrings || "";
}

function extractBreadcrumbCity(html = "") {
  const crumbs = [
    ...String(html).matchAll(/itemprop="name">([^<]+)<\/span>/gi),
  ]
    .map((m) => stripHtml(m[1]))
    .filter((crumb) => crumb && !IGNORED_CRUMBS.has(crumb.toLowerCase()));

  const cityCandidates = ["Душанбе", "Худжанд", "Бохтар", "Куляб", "Хорог"];
  for (const crumb of crumbs.reverse()) {
    if (cityCandidates.some((city) => crumb.includes(city))) {
      return crumb;
    }
  }

  return "";
}

function parseSomon(html, url, cat) {
  const ogTitle = metaContent(html, "og:title");
  const metaPrice = parsePriceDigits(firstMatch(html, /itemprop="price"\s+content="([^"]+)"/i));
  const price = metaPrice || parseSomonPriceFromTitle(ogTitle);
  const image = metaContent(html, "og:image");

  const htmlSpecs = extractKeyChars(html);
  const titleParsed =
    cat === "realestate"
      ? parseSomonRealEstateTitle(ogTitle)
      : cat === "transport"
        ? parseTransportTitle(ogTitle)
        : { title: stripPriceSuffix(ogTitle), specs: [] };

  const location =
    titleParsed.location ||
    extractBreadcrumbCity(html) ||
    firstMatch(html, /"city"\s*:\s*"([^"]+)"/i);

  const specs = mapSpecsForCategory(
    mergeSpecs(titleParsed.specs, htmlSpecs),
    cat
  );

  return {
    platform: "somon",
    url,
    snapshot: {
      title: titleParsed.title || ogTitle || "Объявление Somon.tj",
      price,
      location,
      image,
      specs,
    },
    warnings: price ? [] : ["Не удалось определить цену — проверьте вручную"],
  };
}

function parsePaydo(html, url, cat) {
  const ogTitle = metaContent(html, "og:title");
  const parsed = parsePaydoTitle(ogTitle);
  const metaPrice = parsePriceDigits(firstMatch(html, /itemprop="price"\s+content="([^"]+)"/i));
  const price = metaPrice || parsed.price;
  const image = metaContent(html, "og:image");
  const jsonSpecs = extractLabelValuePairs(html);
  const location = extractPaydoCity(html, parsed.location);

  const specs = mapSpecsForCategory(
    mergeSpecs(parsed.specs, jsonSpecs),
    cat
  );

  return {
    platform: "paydo",
    url,
    snapshot: {
      title: parsed.title || ogTitle || "Объявление Paydo.tj",
      price,
      location,
      image,
      specs,
    },
    warnings: price ? [] : ["Не удалось определить цену — проверьте вручную"],
  };
}

function parseAlon(html, url, cat) {
  const ogTitle = metaContent(html, "og:title");
  const metaPrice = parsePriceDigits(firstMatch(html, /itemprop="price"\s+content="([^"]+)"/i));
  const price =
    metaPrice ||
    parseSomonPriceFromTitle(ogTitle) ||
    parsePriceDigits(metaContent(html, "product:price:amount"));
  const image = metaContent(html, "og:image");
  const htmlSpecs = extractKeyChars(html);
  const titleParsed =
    cat === "realestate"
      ? parseSomonRealEstateTitle(ogTitle)
      : cat === "transport"
        ? parseTransportTitle(ogTitle)
        : { title: stripPriceSuffix(ogTitle), specs: [] };

  const specs = mapSpecsForCategory(
    mergeSpecs(titleParsed.specs, htmlSpecs),
    cat
  );

  if (!ogTitle && !htmlSpecs.length && !price) {
    return parseGeneric(html, url, cat, "alon");
  }

  return {
    platform: "alon",
    url,
    snapshot: {
      title: titleParsed.title || stripPriceSuffix(ogTitle) || "Объявление Alon.tj",
      price,
      location: titleParsed.location || extractBreadcrumbCity(html),
      image,
      specs,
    },
    warnings:
      htmlSpecs.length > 0
        ? []
        : ["Извлечены только базовые поля — дополните характеристики вручную"],
  };
}

function parseGeneric(html, url, cat, platform = "other") {
  const ogTitle = metaContent(html, "og:title");
  const description = metaContent(html, "og:description");
  const image = metaContent(html, "og:image");
  const price =
    parsePriceDigits(firstMatch(html, /itemprop="price"\s+content="([^"]+)"/i)) ||
    parsePriceDigits(metaContent(html, "product:price:amount")) ||
    parseSomonPriceFromTitle(ogTitle);

  return {
    platform,
    url,
    snapshot: {
      title: ogTitle || description.slice(0, 120) || "Внешнее объявление",
      price,
      location: "",
      image,
      specs: [],
    },
    warnings: [
      "Автоматически извлечены только базовые поля. Дополните характеристики вручную.",
    ],
  };
}

const MAX_REDIRECTS = 3;
const MAX_HTML_BYTES = 2_000_000;

async function fetchPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    let currentUrl = url;
    let res;

    // Follow redirects manually so every hop is re-checked against the host
    // allowlist; an open redirect on a partner site must not reach internal IPs.
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      res = await fetch(currentUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; OriyonCompareBot/1.0; +https://oriyon.store)",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
        },
        redirect: "manual",
      });

      if (res.status < 300 || res.status >= 400) {
        break;
      }

      const location = res.headers.get("location");
      if (!location) {
        break;
      }

      const nextUrl = normalizeUrl(new URL(location, currentUrl).toString());

      if (!nextUrl) {
        throw new Error("Ссылка ведёт за пределы поддерживаемых площадок");
      }

      if (hop === MAX_REDIRECTS) {
        throw new Error("Слишком много перенаправлений");
      }

      currentUrl = nextUrl;
    }

    if (!res.ok) {
      throw new Error(`Сайт вернул ошибку ${res.status}`);
    }

    const declaredLength = Number(res.headers.get("content-length") || 0);
    if (declaredLength > MAX_HTML_BYTES) {
      throw new Error("Страница слишком большая для импорта");
    }

    const html = await res.text();
    if (!html || html.length < 200) {
      throw new Error("Пустой ответ от сайта");
    }

    if (html.length > MAX_HTML_BYTES) {
      throw new Error("Страница слишком большая для импорта");
    }

    return html;
  } finally {
    clearTimeout(timeout);
  }
}

async function importCompareListing(rawUrl, cat = "realestate") {
  const url = normalizeUrl(rawUrl);
  if (!url) {
    throw new Error("Поддерживаются только ссылки Somon.tj, Paydo.tj, Alon.tj и Savdo.tj");
  }

  const platform = detectPlatform(url);
  const html = await fetchPage(url);

  if (/statusCode":500|"Failed to load advertisement"/.test(html)) {
    throw new Error("Объявление недоступно или удалено на площадке");
  }

  let result;
  if (platform === "somon") {
    result = parseSomon(html, url, cat);
  } else if (platform === "paydo") {
    result = parsePaydo(html, url, cat);
  } else if (platform === "alon") {
    result = parseAlon(html, url, cat);
  } else {
    result = parseGeneric(html, url, cat, platform);
  }

  if (!result.snapshot.title) {
    throw new Error("Не удалось извлечь данные объявления");
  }

  return {
    ...result,
    cat,
    importedAt: new Date().toISOString(),
  };
}

module.exports = {
  importCompareListing,
  mapSpecsForCategory,
};
