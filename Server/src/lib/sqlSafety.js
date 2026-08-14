const CONTROL_CHARS = /[\0\x08\x09\x1a]/;

function createSqlError(code, message) {
  const error = new Error(message);
  error.code = code;
  error.status = 400;
  return error;
}

function validateQueryArgs(text, params = []) {
  if (typeof text !== "string" || !text.trim()) {
    throw createSqlError("SQL_INVALID_QUERY", "Invalid SQL query text");
  }

  if (CONTROL_CHARS.test(text)) {
    throw createSqlError("SQL_INVALID_QUERY", "Invalid SQL control characters");
  }

  if (!Array.isArray(params)) {
    throw createSqlError("SQL_INVALID_PARAMS", "SQL params must be an array");
  }

  for (const value of params) {
    if (value === undefined) {
      throw createSqlError("SQL_INVALID_PARAMS", "SQL params cannot contain undefined");
    }
  }
}

function assertEnumValue(value, allowed, fieldName = "VALUE") {
  if (value == null || value === "" || value === "all") {
    return null;
  }

  if (!Array.isArray(allowed) || !allowed.includes(value)) {
    throw createSqlError(
      `SQL_INVALID_${fieldName}`,
      `Invalid ${fieldName.toLowerCase()}`
    );
  }

  return value;
}

function pickAllowedValue(value, allowed, fallback = null) {
  if (value == null || value === "") {
    return fallback;
  }

  return allowed.includes(value) ? value : fallback;
}

function safeSort(sort, sortMap, defaultKey) {
  if (!sortMap || typeof sortMap !== "object") {
    throw createSqlError("SQL_INVALID_SORT", "Invalid sort map");
  }

  const fallback = sortMap[defaultKey] ? defaultKey : Object.keys(sortMap)[0];
  return sortMap[sort] || sortMap[fallback];
}

function safeLimit(limit, { min = 1, max = 100, fallback = 25 } = {}) {
  const numeric = Number(limit);

  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(numeric), min), max);
}

function safeOffset(offset, { max = 100000 } = {}) {
  const numeric = Number(offset);

  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }

  return Math.min(Math.trunc(numeric), max);
}

function buildWhere(conditions = []) {
  return conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
}

function pickIdentifier(key, allowedMap) {
  const column = allowedMap?.[key];

  if (!column) {
    throw createSqlError("SQL_INVALID_IDENTIFIER", "Invalid SQL identifier");
  }

  return column;
}

function likePattern(value, { maxLength = 120 } = {}) {
  return String(value || "")
    .trim()
    .slice(0, maxLength)
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

function bindLike(values, rawValue, { maxLength = 120 } = {}) {
  values.push(`%${likePattern(rawValue, { maxLength })}%`);
  return values.length;
}

module.exports = {
  validateQueryArgs,
  assertEnumValue,
  pickAllowedValue,
  safeSort,
  safeLimit,
  safeOffset,
  buildWhere,
  pickIdentifier,
  likePattern,
  bindLike,
};
