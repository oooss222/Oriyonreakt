const dns = require("dns").promises;
const net = require("net");

function isPrivateIp(ip) {
  const value = String(ip || "").toLowerCase();
  const mapped = value.startsWith("::ffff:") ? value.slice(7) : value;

  if (mapped === "::1" || mapped === "0.0.0.0") return true;

  if (net.isIPv4(mapped)) {
    const [a, b] = mapped.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }

  if (mapped.startsWith("fc") || mapped.startsWith("fd") || mapped.startsWith("fe80")) {
    return true;
  }

  return false;
}

function isBlockedHostname(hostname) {
  const host = String(hostname || "").replace(/\.+$/, "").toLowerCase();

  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    return true;
  }

  if (net.isIP(host) && isPrivateIp(host)) {
    return true;
  }

  return false;
}

async function assertPublicUrl(raw) {
  let parsed;

  try {
    parsed = new URL(String(raw || ""));
  } catch {
    throw new Error("Некорректная ссылка");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Нужна ссылка http или https");
  }

  if (parsed.username || parsed.password) {
    throw new Error("Ссылка с паролем не поддерживается");
  }

  if (isBlockedHostname(parsed.hostname)) {
    throw new Error("Внутренние адреса импортировать нельзя");
  }

  if (!net.isIP(parsed.hostname)) {
    const records = await dns.lookup(parsed.hostname, { all: true });
    if (!records.length || records.some((record) => isPrivateIp(record.address))) {
      throw new Error("Внутренние адреса импортировать нельзя");
    }
  }

  parsed.hash = "";
  return parsed;
}

module.exports = {
  isPrivateIp,
  isBlockedHostname,
  assertPublicUrl,
};
