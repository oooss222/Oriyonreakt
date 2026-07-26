function getAllowedOrigins() {
  const origins = new Set();

  for (const value of [
    process.env.CORS_ORIGIN,
    process.env.RENDER_EXTERNAL_URL,
  ]) {
    if (!value) continue;

    for (const part of value.split(",")) {
      const trimmed = part.trim();

      if (trimmed) {
        origins.add(trimmed);
      }
    }
  }

  if (origins.size === 0) {
    origins.add("http://localhost:5173");
  }

  return [...origins];
}

function isOriginAllowed(origin) {
  if (!origin) {
    return true;
  }

  return getAllowedOrigins().includes(origin);
}

module.exports = {
  getAllowedOrigins,
  isOriginAllowed,
};
