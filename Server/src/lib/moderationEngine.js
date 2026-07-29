const { query } = require("../db");

const TRUSTED_APPROVAL_THRESHOLD = Number(
  process.env.MODERATION_TRUSTED_THRESHOLD || 8
);

const STOP_WORDS = [
  "наркот",
  "оружие",
  "пистолет",
  "автомат",
  "взрывч",
  "порно",
  "xxx",
  "casino",
  "казино",
  "лохотрон",
  "мошен",
  "обман",
  "скam",
  "scam",
];

function normalizeText(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function containsStopWords(text = "") {
  const normalized = normalizeText(text);
  return STOP_WORDS.filter((word) => normalized.includes(word));
}

function listingSnapshot(listing) {
  return {
    title: listing.title || "",
    price: listing.price || "",
    description: listing.description || "",
    location: listing.location || "",
    cat: listing.cat || "",
    subcategory: listing.subcategory || "",
    images: Array.isArray(listing.images) ? listing.images : [],
  };
}

function computeDiff(previous, current) {
  if (!previous) return [];

  const fields = [
    ["title", "Заголовок"],
    ["price", "Цена"],
    ["description", "Описание"],
    ["location", "Локация"],
    ["cat", "Категория"],
    ["subcategory", "Подкатегория"],
  ];

  const changes = [];

  for (const [key, label] of fields) {
    const before = String(previous[key] ?? "");
    const after = String(current[key] ?? "");

    if (before !== after) {
      changes.push({ field: key, label, before, after });
    }
  }

  const prevImages = JSON.stringify(previous.images || []);
  const nextImages = JSON.stringify(current.images || []);

  if (prevImages !== nextImages) {
    changes.push({
      field: "images",
      label: "Фото",
      before: `${(previous.images || []).length} шт.`,
      after: `${(current.images || []).length} шт.`,
    });
  }

  return changes;
}

async function findDuplicateFlag(listing, ownerId) {
  const title = normalizeText(listing.title);
  const price = String(listing.price || "").trim();

  if (!title || !ownerId) {
    return null;
  }

  const result = await query(
    `
    SELECT id, title
    FROM listings
    WHERE owner = $1
      AND id <> COALESCE($4, '00000000-0000-0000-0000-000000000000'::uuid)
      AND lower(trim(title)) = $2
      AND trim(price) = $3
      AND status IN ('pending', 'approved')
      AND created_at >= now() - interval '14 days'
    LIMIT 1
    `,
    [ownerId, title, price, listing.id || null]
  );

  if (!result.rows[0]) {
    return null;
  }

  return {
    code: "duplicate",
    message: "Похожее объявление уже есть у этого продавца",
    duplicateId: result.rows[0].id,
  };
}

async function evaluateListing(listing, owner, { isUpdate = false } = {}) {
  const flags = [];
  const images = Array.isArray(listing.images) ? listing.images : [];
  const title = String(listing.title || "").trim();
  const description = String(listing.description || "").trim();
  const price = String(listing.price || "").trim();
  const combined = `${title} ${description}`;

  if (!images.length) {
    flags.push({
      code: "no_photos",
      severity: "high",
      message: "Нет фотографий",
    });
  }

  if (!title || title.length < 3) {
    flags.push({
      code: "empty_title",
      severity: "high",
      message: "Слишком короткий заголовок",
    });
  }

  if (!price || price === "0" || price === "0.00") {
    flags.push({
      code: "invalid_price",
      severity: "medium",
      message: "Цена не указана или равна нулю",
    });
  }

  const stopWords = containsStopWords(combined);

  if (stopWords.length) {
    flags.push({
      code: "stop_words",
      severity: "high",
      message: `Стоп-слова: ${stopWords.join(", ")}`,
      details: stopWords,
    });
  }

  const duplicate = await findDuplicateFlag(listing, owner?.id || listing.owner);

  if (duplicate) {
    flags.push(duplicate);
  }

  const highSeverity = flags.filter((item) => item.severity === "high");

  if (highSeverity.length) {
    const autoReason = highSeverity.map((item) => item.message).join("; ");

    return {
      action: "auto_reject",
      flags,
      reason: autoReason,
      autoModerationReason: autoReason,
    };
  }

  const trustLevel = owner?.trustLevel || owner?.trust_level || "new";

  if (trustLevel === "trusted" && flags.length === 0 && !isUpdate) {
    return {
      action: "auto_approve",
      flags,
      reason: "",
      autoModerationReason: "Доверенный продавец",
    };
  }

  return {
    action: "queue",
    flags,
    reason: "",
    autoModerationReason: flags.length
      ? flags.map((item) => item.message).join("; ")
      : "",
  };
}

module.exports = {
  TRUSTED_APPROVAL_THRESHOLD,
  listingSnapshot,
  computeDiff,
  evaluateListing,
};
