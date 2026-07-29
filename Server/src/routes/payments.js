const router = require("express").Router();
const crypto = require("crypto");

const auth = require("../middleware/auth");
const User = require("../models/User");
const PaymentOrder = require("../models/PaymentOrder");
const {
  getConfig,
  buildCallbackUrl,
  buildReturnUrl,
  initiateWalletPayment,
  checkPaymentStatus,
  normalizeCallbackPayload,
  verifyCallbackToken,
  isSuccessfulStatus,
  isTerminalFailureStatus,
} = require("../lib/alifPay");

function buildOrderId(userId) {
  const suffix = crypto.randomBytes(4).toString("hex");

  return `oriyon-${String(userId).slice(0, 8)}-${Date.now()}-${suffix}`;
}

async function completePaidOrder(order, providerPayload = {}) {
  if (!order) {
    return null;
  }

  const paidOrder = await PaymentOrder.markPaid(order.orderId, {
    transactionId: providerPayload.transactionId || order.transactionId,
    providerStatus: providerPayload.status || "ok",
    callbackPayload: providerPayload,
  });

  if (!paidOrder) {
    return PaymentOrder.findByOrderId(order.orderId);
  }

  await User.topUpWallet(
    paidOrder.userId,
    paidOrder.amount,
    `Пополнение через Alif (${paidOrder.orderId})`
  );

  return PaymentOrder.findByOrderId(order.orderId);
}

async function failOrder(order, providerPayload = {}) {
  if (!order || order.status === "paid") {
    return order;
  }

  return PaymentOrder.updateStatus(order.orderId, {
    status: isTerminalFailureStatus(providerPayload.status) ? "failed" : "pending",
    transactionId: providerPayload.transactionId || "",
    providerStatus: providerPayload.status || "",
    callbackPayload: providerPayload,
  });
}

router.get("/config", (req, res) => {
  const config = getConfig();

  return res.json({
    alifEnabled: config.enabled,
    directTopUpEnabled: config.allowDirectTopUp,
    environment: config.environment,
    provider: "alif",
  });
});

router.post("/alif/wallet-top-up", auth, async (req, res) => {
  try {
    const config = getConfig();

    if (!config.enabled) {
      return res.status(503).json({
        error: "Alif payments are not configured",
      });
    }

    const amount = Number(req.body?.amount || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        error: "Invalid amount",
      });
    }

    if (amount > 10000) {
      return res.status(400).json({
        error: "Amount is too large",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const orderId = buildOrderId(user.id);
    const callbackUrl = buildCallbackUrl();
    const returnUrl = buildReturnUrl();

    await PaymentOrder.create({
      userId: user.id,
      orderId,
      amount,
      provider: "alif",
    });

    const payment = await initiateWalletPayment({
      orderId,
      amount,
      callbackUrl,
      returnUrl,
      info: `Пополнение кошелька Oriyon (${formatAmount(amount)} TJS)`,
      email: user.email,
      phone: user.phone,
    });

    return res.json({
      orderId,
      paymentUrl: payment.paymentUrl,
      provider: "alif",
      environment: config.environment,
    });
  } catch (e) {
    if (e?.message === "ALIF_DISABLED") {
      return res.status(503).json({
        error: "Alif payments are disabled",
      });
    }

    console.error("ALIF_WALLET_TOP_UP_ERROR:", e?.message);

    return res.status(500).json({
      error: e?.message || "Failed to initialize Alif payment",
    });
  }
});

router.post("/alif/callback", async (req, res) => {
  try {
    const config = getConfig();
    const payload = normalizeCallbackPayload(req.body || {});

    if (!payload.orderId) {
      return res.status(400).json({
        error: "orderId required",
      });
    }

    const order = await PaymentOrder.findByOrderId(payload.orderId);

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    const tokenValid = verifyCallbackToken({
      key: config.key,
      password: config.password,
      orderId: payload.orderId,
      status: payload.status,
      transactionId: payload.transactionId,
      token: payload.token,
    });

    if (!tokenValid) {
      console.error("ALIF_CALLBACK_INVALID_TOKEN:", payload.orderId);

      return res.status(401).json({
        error: "Invalid callback token",
      });
    }

    if (isSuccessfulStatus(payload.status)) {
      await completePaidOrder(order, payload);
    } else if (isTerminalFailureStatus(payload.status)) {
      await failOrder(order, payload);
    } else {
      await PaymentOrder.updateStatus(order.orderId, {
        status: "pending",
        transactionId: payload.transactionId,
        providerStatus: payload.status,
        callbackPayload: payload,
      });
    }

    return res.status(200).send("OK");
  } catch (e) {
    console.error("ALIF_CALLBACK_ERROR:", e?.message);

    return res.status(500).json({
      error: "Callback processing failed",
    });
  }
});

router.post("/alif/sync/:orderId", auth, async (req, res) => {
  try {
    const order = await PaymentOrder.findByOrderId(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    if (String(order.userId) !== String(req.user.id)) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    if (order.status === "paid") {
      const user = await User.findById(req.user.id);

      return res.json({
        order,
        user: User.sanitize(user),
      });
    }

    const providerStatus = normalizeCallbackPayload(
      await checkPaymentStatus(order.orderId)
    );

    if (isSuccessfulStatus(providerStatus.status)) {
      const updated = await completePaidOrder(order, providerStatus);
      const user = await User.findById(req.user.id);

      return res.json({
        order: updated,
        user: User.sanitize(user),
      });
    }

    if (isTerminalFailureStatus(providerStatus.status)) {
      const updated = await failOrder(order, providerStatus);

      return res.json({
        order: updated,
      });
    }

    return res.json({
      order,
      providerStatus,
    });
  } catch (e) {
    console.error("ALIF_SYNC_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to sync payment status",
    });
  }
});

function formatAmount(amount) {
  return Number(amount).toFixed(2);
}

module.exports = router;
