const router = require("express").Router();
const auth = require("../middleware/auth");
const User = require("../models/User");

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

router.put("/me", auth, async (req, res) => {
  try {
    const body = req.body || {};

    const updated = await User.updateProfile(req.user.id, {
      name: body.name ? String(body.name).trim() : undefined,
      phone: body.phone ? String(body.phone).trim() : undefined,
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

router.post("/me/wallet/top-up", auth, async (req, res) => {
  try {
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