// Ориентировочные медианы цены за м² (сомони) по районам Душанбе — для подсказок, не финансовая оценка.
const DUSHANBE_PRICE_PER_SQM = {
  Центр: 8500,
  Сино: 6200,
  Фирдавси: 5800,
  Шохмансур: 5500,
  "Исмоил Сомони": 6000,
  "92-й микрорайон": 5200,
  "102-й микрорайон": 4800,
  "120-й микрорайон": 4500,
  "140-й микрорайон": 4200,
  "Нижняя часть": 4000,
  Варзоб: 3800,
  default: 5000,
};

const CITY_DEFAULT = {
  Душанбе: DUSHANBE_PRICE_PER_SQM.default,
  Худжанд: 4200,
  Бохтар: 3500,
  Куляб: 3200,
};

function parsePriceNumber(raw = "") {
  const digits = String(raw || "").replace(/[^\d]/g, "");
  const value = Number(digits);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function parseAreaSqm(raw = "") {
  const match = String(raw || "").replace(/\s/g, "").match(/[\d.,]+/);
  if (!match) return null;
  const value = Number(String(match[0]).replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function getBenchmarkPricePerSqm({ city = "Душанбе", district = "" } = {}) {
  if (city === "Душанбе" && district && DUSHANBE_PRICE_PER_SQM[district]) {
    return DUSHANBE_PRICE_PER_SQM[district];
  }

  return CITY_DEFAULT[city] || 4500;
}

export function assessListingPrice({
  price,
  areaRaw,
  city = "Душанбе",
  district = "",
  dealType = "",
  rePricePerSqm = null,
} = {}) {
  if (dealType && dealType !== "Купить") {
    return null;
  }

  const total = parsePriceNumber(price);
  let perSqm = rePricePerSqm != null ? Number(rePricePerSqm) : null;

  if (!perSqm) {
    const area = parseAreaSqm(areaRaw);
    if (total && area) {
      perSqm = Math.round(total / area);
    }
  }

  if (!perSqm) return null;

  const benchmark = getBenchmarkPricePerSqm({ city, district });
  const ratio = perSqm / benchmark;
  const diffPct = Math.round((ratio - 1) * 100);

  if (ratio < 0.65) {
    return {
      level: "low",
      perSqm,
      benchmark,
      diffPct,
      message: `Цена за м² (${perSqm.toLocaleString("ru-RU")} с.) заметно ниже типичной для района (~${benchmark.toLocaleString("ru-RU")} с.). Проверьте объект и документы.`,
    };
  }

  if (ratio > 1.35) {
    return {
      level: "high",
      perSqm,
      benchmark,
      diffPct,
      message: `Цена за м² (${perSqm.toLocaleString("ru-RU")} с.) выше типичной для района (~${benchmark.toLocaleString("ru-RU")} с.) на ${diffPct > 0 ? "+" : ""}${diffPct}%.`,
    };
  }

  return {
    level: "ok",
    perSqm,
    benchmark,
    diffPct,
    message: `Цена за м² близка к средней по району (~${benchmark.toLocaleString("ru-RU")} с.).`,
  };
}
