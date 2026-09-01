const crypto = require("crypto");

// Terminal credentials are never defaulted: without them the gateway stays off
// instead of silently falling back to a shared sandbox terminal.
const DEFAULTS = {
  apiUrl: "https://test-web.alif.tj/v2",
  gate: "korti_milli",
};

function resolveAlifEndpoints(apiUrl = "") {
  const normalized = String(apiUrl).replace(/\/$/, "");
  const rootBase = normalized.replace(/\/v2$/, "");
  const v2Base = normalized.endsWith("/v2") ? normalized : `${rootBase}/v2`;

  return {
    rootBase,
    v2Url: `${v2Base}/`,
    legacyUrl: `${rootBase}/`,
    checktxnUrl: `${rootBase}/checktxn`,
  };
}

function getConfig() {
  const key = String(process.env.ALIF_TERMINAL_KEY || "").trim();
  const password = String(process.env.ALIF_TERMINAL_PASSWORD || "").trim();
  const apiUrl = String(process.env.ALIF_API_URL || DEFAULTS.apiUrl).replace(
    /\/$/,
    ""
  );
  const gate = String(process.env.ALIF_GATE || DEFAULTS.gate).trim();
  const enabled =
    process.env.ALIF_ENABLED !== "false" && Boolean(key && password);

  const endpoints = resolveAlifEndpoints(apiUrl);

  return {
    enabled,
    key,
    password,
    apiUrl,
    gate,
    endpoints,
    environment: apiUrl.includes("test-web") ? "test" : "production",
    checkoutMode: String(
      process.env.ALIF_CHECKOUT_MODE ||
        (apiUrl.includes("/v2") ? "v2" : "legacy")
    ).toLowerCase(),
    allowDirectTopUp:
      process.env.NODE_ENV !== "production" &&
      process.env.ALIF_ALLOW_DIRECT_TOPUP === "true",
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

function formatAlifPhone(phone = "") {
  const digits = String(phone).replace(/[^\d]/g, "");

  if (!digits) {
    return "992900000000";
  }

  if (digits.startsWith("992") && digits.length >= 12) {
    return digits.slice(0, 12);
  }

  if (digits.length >= 9) {
    return `992${digits.slice(-9)}`;
  }

  return `992${digits.padStart(9, "0")}`;
}

async function parseJsonResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function buildLegacyCheckout({
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

  const token = buildPaymentToken({
    key: config.key,
    password: config.password,
    orderId,
    amount,
    callbackUrl,
  });

  return {
    action: config.endpoints.legacyUrl,
    method: "POST",
    fields: {
      key: config.key,
      token,
      orderId,
      callbackUrl,
      returnUrl,
      amount: formatAmount(amount),
      gate: gate || config.gate,
      info: info || "",
      email: email || "",
      phone: formatAlifPhone(phone),
    },
  };
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

  const mode = config.checkoutMode;

  if (mode === "v2") {
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
      phone: formatAlifPhone(phone),
      gate: gate || config.gate,
    };

    const response = await fetch(config.endpoints.v2Url, {
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
        mode: "v2",
        raw: body,
      };
    }

    const allowLegacyFallback = process.env.ALIF_V2_FALLBACK !== "false";

    if (!allowLegacyFallback) {
      throw new Error(
        body.message ||
          (Number(body.code) === 401
            ? "Alif отклонил запрос (401). Проверьте terminal key и whitelist callback URL у Alif."
            : "Failed to initialize Alif payment")
      );
    }

    console.warn(
      "ALIF_V2_FALLBACK:",
      body.code || response.status,
      body.message || "switching to legacy checkout"
    );
  }

  return {
    checkout: buildLegacyCheckout({
      orderId,
      amount,
      callbackUrl,
      returnUrl,
      info,
      email,
      phone,
      gate,
    }),
    provider: "alif",
    mode: "legacy",
  };
}

async function checkPaymentStatus(orderId) {
  const config = getConfig();
  const token = buildStatusToken({
    key: config.key,
    password: config.password,
    orderId,
  });

  const response = await fetch(config.endpoints.checktxnUrl, {
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
  buildLegacyCheckout,
  buildPaymentToken,
  buildStatusToken,
  verifyCallbackToken,
  normalizePhone: formatAlifPhone,
  formatAlifPhone,
  initiateWalletPayment,
  checkPaymentStatus,
  normalizeCallbackPayload,
  isSuccessfulStatus,
  isTerminalFailureStatus,
};
