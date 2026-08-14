const UAParser = require("ua-parser-js");

function normalizeDeviceType(deviceType = "", userAgent = "") {
  const raw = String(deviceType || "").trim().toLowerCase();

  if (["mobile", "tablet", "desktop"].includes(raw)) {
    return raw;
  }

  if (/ipad|tablet/i.test(userAgent)) return "tablet";
  if (/mobile|android|iphone|ipod|windows phone/i.test(userAgent)) return "mobile";

  return "desktop";
}

function buildDeviceModel({ device = {}, os = {}, browser = {} } = {}) {
  const vendorModel = [device.vendor, device.model].filter(Boolean).join(" ").trim();
  if (vendorModel) return vendorModel.slice(0, 120);

  const osLabel = [os.name, os.version].filter(Boolean).join(" ").trim();
  if (osLabel) return osLabel.slice(0, 120);

  const browserLabel = [browser.name, browser.version].filter(Boolean).join(" ").trim();
  if (browserLabel) return browserLabel.slice(0, 120);

  return "Неизвестно";
}

function parseRegistrationDevice(userAgent = "") {
  const normalizedAgent = String(userAgent || "").trim();
  const parser = new UAParser(normalizedAgent);
  const device = parser.getDevice();
  const os = parser.getOS();
  const browser = parser.getBrowser();

  const type = normalizeDeviceType(device.type, normalizedAgent);

  return {
    type,
    model: buildDeviceModel({ device, os, browser }),
    userAgent: normalizedAgent.slice(0, 500),
  };
}

function getRegistrationDeviceFromRequest(req = {}) {
  const headerAgent = String(req.headers?.["user-agent"] || "").trim();
  const bodyAgent = String(req.body?.userAgent || "").trim();
  const userAgent = headerAgent || bodyAgent;
  const parsed = parseRegistrationDevice(userAgent);

  const clientType = String(req.body?.deviceType || "").trim().toLowerCase();
  const clientModel = String(req.body?.deviceModel || "").trim();

  return {
    registrationDeviceType: normalizeDeviceType(clientType, userAgent) || parsed.type,
    registrationDeviceModel: clientModel || parsed.model,
    registrationUserAgent: parsed.userAgent,
  };
}

module.exports = {
  parseRegistrationDevice,
  getRegistrationDeviceFromRequest,
};
