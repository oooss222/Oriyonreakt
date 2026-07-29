const crypto = require("crypto");

const TEST_DEFAULTS = {
  key: "44444444",
  password: "cztef62wrwcysyubbbdnhlk1rs2cztfsqgwww7j0",
  apiUrl: "https://test-web.alif.tj",
  gate: "korti_milli",
};

function getConfig() {
  const key = String(process.env.ALIF_TERMINAL_KEY || TEST_DEFAULTS.key).trim();
  const password = String(
    process.env.ALIF_TERMINAL_PASSWORD || TEST_DEFAULTS.password
  ).trim();
  const apiUrl = String(process.env.ALIF_API_URL || TEST_DEFAULTS.apiUrl).replace(
    /\/$/,
    ""
  );
  const gate = String(process.env.ALIF_GATE || TEST_DEFAULTS.gate).trim();
  const enabled =
    process.env.ALIF_ENABLED !== "false" && Boolean(key && password);

  return {
    enabled,
    key,
    password,
    apiUrl,
    gate,
    environment:
      apiUrl.includes("test-web") || key === TEST_DEFAULTS.key ? "test" : "production",
    allowDirectTopUp: process.env.ALIF_ALLOW_DIRECT_TOPUP === "true",
  };
}

function buildSecret(key, password) {
  return crypto.createHmac("sha256", key).update(password).digest("hex");
}

function formatAmount(amount) {
  return Number(amount).toFixed(2);
}

function buildPaymentToken({ key, password, orderId, amount, callbackUrl }) {
  const secret = buildSecret(key, password);
  const data = `${key}${orderId}${formatAmount(amount)}${callbackUrl}`;

  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

function buildStatusToken({ key, password, orderId }) {
  const secret = buildSecret(key, password);
  const data = `${key}${orderId}`;

  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

function verifyCallbackToken({
  key,
  password,
  orderId,
  status,
  transactionId,
  token,
}) {
  if (!token) {
    return false;
  }

  const secret = buildSecret(key, password);
  const data = `${orderId}${status}${transactionId}`;
  const expected = crypto.createHmac("sha256", secret).update(data).digest("hex");

  return expected === token;
}

function getAppBaseUrl() {
  return String(
    process.env.APP_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      `http://localhost:${process.env.PORT || 4000}`
  ).replace(/\/$/, "");
}

function getClientBaseUrl() {
  return String(process.env.CLIENT_URL || getAppBaseUrl()).replace(/\/$/, "");
}

function buildCallbackUrl() {
  if (process.env.ALIF_CALLBACK_URL) {
    return String(process.env.ALIF_CALLBACK_URL).trim();
  }

  return `${getAppBaseUrl()}/api/payments/alif/callback`;
}

function buildReturnUrl() {
  if (process.env.ALIF_RETURN_URL) {
    return String(process.env.ALIF_RETURN_URL).trim();
  }

  return `${getClientBaseUrl()}/profile?tab=wallet&payment=return`;
}

function normalizePhone(phone = "") {
  const digits = String(phone).replace(/[^\d]/g, "");

  if (!digits) {
    return "992900000000";
  }

  if (digits.startsWith("992")) {
    return digits;
  }

  if (digits.length === 9) {
    return `992${digits}`;
  }

  return digits;
}

async function parseJsonResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

async function initiateWalletPayment({
  orderId,
  amount,
  callbackUrl,
  returnUrl,
  info,
  email,
  phone,
  gate,
}) {
  const config = getConfig();

  if (!config.enabled) {
    throw new Error("ALIF_DISABLED");
  }

  const token = buildPaymentToken({
    key: config.key,
    password: config.password,
    orderId,
    amount,
    callbackUrl,
  });

  const payload = {
    order_id: orderId,
    token,
    key: config.key,
    callback_url: callbackUrl,
    return_url: returnUrl,
    amount: formatAmount(amount),
    info,
    email: email || undefined,
    phone: normalizePhone(phone),
    gate: gate || config.gate,
  };

  const response = await fetch(`${config.apiUrl}/v2/`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await parseJsonResponse(response);

  if (Number(body.code) === 200 && body.url) {
    return {
      paymentUrl: body.url,
      provider: "alif",
      raw: body,
    };
  }

  throw new Error(body.message || "Failed to initialize Alif payment");
}

async function checkPaymentStatus(orderId) {
  const config = getConfig();
  const token = buildStatusToken({
    key: config.key,
    password: config.password,
    orderId,
  });

  const response = await fetch(`${config.apiUrl}/checktxn`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderId,
      key: config.key,
      token,
    }),
  });

  return parseJsonResponse(response);
}

function normalizeCallbackPayload(payload = {}) {
  return {
    orderId: payload.orderId || payload.order_id || "",
    transactionId: payload.transactionId || payload.transaction_id || "",
    status: payload.status || "",
    token: payload.token || "",
    amount: Number(payload.amount || 0),
    account: payload.account || payload.phone || "",
    transactionType: payload.transaction_type || payload.transactionType || "",
  };
}

function isSuccessfulStatus(status) {
  return String(status || "").toLowerCase() === "ok";
}

function isTerminalFailureStatus(status) {
  const normalized = String(status || "").toLowerCase();

  return ["failed", "canceled", "cancelled", "partially_canceled"].includes(
    normalized
  );
}

module.exports = {
  getConfig,
  buildCallbackUrl,
  buildReturnUrl,
  buildPaymentToken,
  buildStatusToken,
  verifyCallbackToken,
  normalizePhone,
  initiateWalletPayment,
  checkPaymentStatus,
  normalizeCallbackPayload,
  isSuccessfulStatus,
  isTerminalFailureStatus,
};
