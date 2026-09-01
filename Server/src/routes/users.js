const router = require("express").Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const { walletTopUpLimiter } = require("../middleware/rateLimit");

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
    const current = await User.findById(req.user.id);

    if (!current) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const body = req.body || {};

    if (
      body.sellerType !== undefined &&
      body.sellerType !== current.sellerType
    ) {
      return res.status(403).json({
        error: "Business account can only be assigned by an administrator",
      });
    }

    const updateFields = {
      name: body.name !== undefined ? String(body.name).trim() : undefined,
      phone: body.phone !== undefined ? String(body.phone).trim() : undefined,
      whatsapp:
        body.whatsapp !== undefined
          ? normalizeWhatsapp(body.whatsapp)
          : undefined,
      telegram:
        body.telegram !== undefined
          ? normalizeTelegram(body.telegram)
          : undefined,
      extraPhones:
        body.extraPhones !== undefined
          ? Array.isArray(body.extraPhones)
            ? body.extraPhones
            : []
          : undefined,
    };

    if (current.sellerType === "company") {
      Object.assign(updateFields, {
        companyName:
          body.companyName !== undefined
            ? String(body.companyName).trim()
            : undefined,
        companyDescription:
          body.companyDescription !== undefined
            ? String(body.companyDescription).trim()
            : undefined,
        companyLogo:
          body.companyLogo !== undefined
            ? String(body.companyLogo).trim()
            : undefined,
        companyAddress:
          body.companyAddress !== undefined
            ? String(body.companyAddress).trim()
            : undefined,
        companyWebsite:
          body.companyWebsite !== undefined
            ? String(body.companyWebsite).trim()
            : undefined,
        companyInstagram:
          body.companyInstagram !== undefined
            ? String(body.companyInstagram).trim()
            : undefined,
        listingAutoBumpEnabled:
          body.listingAutoBumpEnabled !== undefined
            ? Boolean(body.listingAutoBumpEnabled)
            : undefined,
        listingAutoBumpIntervalHours:
          body.listingAutoBumpIntervalHours !== undefined
            ? Number(body.listingAutoBumpIntervalHours)
            : undefined,
      });
    }

    if (
      current.sellerType !== "company" &&
      (body.listingAutoBumpEnabled !== undefined ||
        body.listingAutoBumpIntervalHours !== undefined)
    ) {
      return res.status(403).json({
        error: "Auto bump is available for premium accounts only",
      });
    }

    const updated = await User.updateProfile(req.user.id, updateFields);

    if (!updated) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.json(User.sanitize(updated));
  } catch (e) {
    if (e?.message === "INVALID_SELLER_TYPE") {
      return res.status(400).json({
        error: "Invalid seller type",
      });
    }

    if (e?.message === "COMPANY_NAME_REQUIRED") {
      return res.status(400).json({
        error: "Company name is required",
      });
    }

    if (e?.message === "TOO_MANY_LISTINGS_FOR_PRIVATE") {
      return res.status(400).json({
        error: "Too many active listings to switch to private account",
        activeListings: e.activeListings,
      });
    }

    console.error("USER_UPDATE_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to update profile",
    });
  }
});

router.get("/me/business", auth, async (req, res) => {
  try {
    const stats = await User.getBusinessStats(req.user.id);

    if (!stats) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.json(stats);
  } catch (e) {
    console.error("USER_BUSINESS_STATS_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load business stats",
    });
  }
});

router.get("/me/analytics", auth, async (req, res) => {
  try {
    const period = String(req.query.period || "7d");
    const analytics = await User.getSellerAnalytics(req.user.id, period);

    if (!analytics) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.json(analytics);
  } catch (e) {
    console.error("USER_ANALYTICS_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load analytics",
    });
  }
});

router.get("/me/compare", auth, async (req, res) => {
  try {
    const UserCompareList = require("../models/UserCompareList");
    const buckets = await UserCompareList.getAll(req.user.id);
    return res.json(buckets);
  } catch (e) {
    console.error("USER_COMPARE_GET_ERROR:", e?.message);
    return res.status(500).json({
      error: "Failed to load compare lists",
    });
  }
});

router.get("/me/compare/:cat", auth, async (req, res) => {
  try {
    const UserCompareList = require("../models/UserCompareList");
    const data = await UserCompareList.getByCat(req.user.id, req.params.cat);
    return res.json(data);
  } catch (e) {
    console.error("USER_COMPARE_CAT_GET_ERROR:", e?.message);
    return res.status(500).json({
      error: "Failed to load compare list",
    });
  }
});

router.put("/me/compare/:cat", auth, async (req, res) => {
  try {
    const UserCompareList = require("../models/UserCompareList");
    const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];
    const data = await UserCompareList.upsert(req.user.id, req.params.cat, entries);
    return res.json(data);
  } catch (e) {
    if (e?.message === "INVALID_CAT") {
      return res.status(400).json({ error: "Unsupported category" });
    }
    console.error("USER_COMPARE_PUT_ERROR:", e?.message);
    return res.status(500).json({
      error: "Failed to save compare list",
    });
  }
});

router.get("/me/listing-draft", auth, async (req, res) => {
  try {
    const ListingDraft = require("../models/ListingDraft");
    const draft = await ListingDraft.get(req.user.id);
    return res.json({ draft });
  } catch (e) {
    console.error("LISTING_DRAFT_GET_ERROR:", e?.message);
    return res.status(500).json({
      error: "Failed to load listing draft",
    });
  }
});

router.put("/me/listing-draft", auth, async (req, res) => {
  try {
    const ListingDraft = require("../models/ListingDraft");
    const draft = await ListingDraft.upsert(req.user.id, req.body || {});
    return res.json({ draft });
  } catch (e) {
    console.error("LISTING_DRAFT_PUT_ERROR:", e?.message);
    return res.status(500).json({
      error: "Failed to save listing draft",
    });
  }
});

router.delete("/me/listing-draft", auth, async (req, res) => {
  try {
    const ListingDraft = require("../models/ListingDraft");
    await ListingDraft.clear(req.user.id);
    return res.json({ ok: true });
  } catch (e) {
    console.error("LISTING_DRAFT_DELETE_ERROR:", e?.message);
    return res.status(500).json({
      error: "Failed to clear listing draft",
    });
  }
});

router.post("/me/business/bump-all", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    if (user.sellerType !== "company") {
      return res.status(403).json({
        error: "Bulk listing refresh is available for premium accounts only",
      });
    }

    const Listing = require("../models/Listing");
    const updatedCount = await Listing.bumpAllApprovedForOwner(req.user.id);

    await require("../db").query(
      `
      UPDATE users
      SET listing_auto_bump_last_at = now(), updated_at = now()
      WHERE id = $1
      `,
      [req.user.id]
    );

    return res.json({
      updatedCount,
      refreshedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("USER_BUSINESS_BUMP_ALL_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to refresh listings",
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

// Credits the wallet with no payment proof, so it is a local development
// shortcut only: production always rejects it regardless of gateway state.
router.post("/me/wallet/top-up", auth, walletTopUpLimiter, async (req, res) => {
  try {
    const { getConfig } = require("../lib/alifPay");
    const alifConfig = getConfig();

    if (!alifConfig.allowDirectTopUp) {
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