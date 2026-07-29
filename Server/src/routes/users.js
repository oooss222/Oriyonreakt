const router = require("express").Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Wallet = require("../models/Wallet");

router.get("/:id/public", async (req, res) => {
  try {
    const profile = await User.getPublicProfile(req.params.id);

    if (!profile) {
      return res.status(404).json({
        error: "Seller not found",
      });
    }

    return res.json(profile);
  } catch (e) {
    console.error("USER_PUBLIC_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load seller profile",
    });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.json(User.sanitize(user));
  } catch (e) {
    console.error("USER_ME_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load profile",
    });
  }
});

function normalizeWhatsapp(value = "") {
  return String(value).replace(/[^\d]/g, "");
}

function normalizeTelegram(value = "") {
  value = String(value).trim();

  if (!value) return "";

  if (value.startsWith("https://t.me/")) {
    return value;
  }

  return `https://t.me/${value.replace("@", "")}`;
}

router.put("/me", auth, async (req, res) => {
  try {
    const body = req.body || {};

    const updated = await User.updateProfile(req.user.id, {
    name: body.name ? String(body.name).trim() : undefined,
    phone: body.phone ? String(body.phone).trim() : undefined,
    whatsapp:
    body.whatsapp !== undefined
      ? normalizeWhatsapp(body.whatsapp)
      : undefined,

    telegram:
    body.telegram !== undefined
      ? normalizeTelegram(body.telegram)
      : undefined,
    sellerType: body.sellerType || undefined,
  });

    if (!updated) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.json(User.sanitize(updated));
  } catch (e) {
    console.error("USER_UPDATE_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to update profile",
    });
  }
});

router.get("/me/wallet/transactions", auth, async (req, res) => {
  try {
    const limit = Number(req.query.limit || 50);
    const offset = Number(req.query.offset || 0);

    const transactions = await Wallet.findByUser(req.user.id, {
      limit,
      offset,
    });

    return res.json(transactions);
  } catch (e) {
    console.error("WALLET_TRANSACTIONS_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load wallet transactions",
    });
  }
});

router.post("/me/wallet/top-up", auth, async (req, res) => {
  try {
    const { getConfig } = require("../lib/alifPay");
    const alifConfig = getConfig();

    if (alifConfig.enabled && !alifConfig.allowDirectTopUp) {
      return res.status(403).json({
        error: "Direct top-up is disabled. Use Alif payment gateway.",
      });
    }

    const amount = Number(req.body?.amount || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        error: "Invalid amount",
      });
    }

    if (amount > 100000) {
      return res.status(400).json({
        error: "Amount is too large",
      });
    }

    const updated = await User.topUpWallet(
      req.user.id,
      amount
    );

    if (!updated) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.json(User.sanitize(updated));
  } catch (e) {
    console.error("WALLET_TOP_UP_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to top up wallet",
    });
  }
});

module.exports = router;