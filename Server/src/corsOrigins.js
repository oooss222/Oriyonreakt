function getAllowedOrigins() {
  const origins = new Set();

  for (const value of [
    process.env.CORS_ORIGIN,
    process.env.RENDER_EXTERNAL_URL,
    process.env.CLIENT_URL,
    process.env.APP_URL,
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

function lanOriginsEnabled() {
  const flag = String(process.env.ALLOW_LAN_ORIGINS || "").toLowerCase();

  if (["true", "1", "yes", "on"].includes(flag)) return true;
  if (["false", "0", "no", "off"].includes(flag)) return false;

  return String(process.env.NODE_ENV || "").toLowerCase() !== "production";
}

function isLanHostname(hostname) {
  const host = String(hostname || "")
    .replace(/^\[|\]$/g, "")
    .toLowerCase();

  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "0:0:0:0:0:0:0:1"
  ) {
    return true;
  }

  const parts = host.split(".");
  if (parts.length !== 4) return false;

  const octets = parts.map((part) => Number(part));
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  const [a, b] = octets;

  if (a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true;

  return false;
}

function isLanOrigin(origin) {
  try {
    const url = new URL(origin);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    return isLanHostname(url.hostname);
  } catch {
    return false;
  }
}

function isOriginAllowed(origin) {
  if (!origin) {
    return true;
  }

  if (getAllowedOrigins().includes(origin)) {
    return true;
  }

  return lanOriginsEnabled() && isLanOrigin(origin);
}

module.exports = {
  getAllowedOrigins,
  isOriginAllowed,
  isLanOrigin,
  lanOriginsEnabled,
};
