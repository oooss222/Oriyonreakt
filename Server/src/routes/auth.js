const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function makeToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || "user",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

function isValidEmail(email = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safeUser(user) {
  return User.sanitize(user);
}

router.post("/register", async (req, res) => {
  try {
    let {
      email,
      password,
      name,
      phone,
      sellerType,
    } = req.body || {};

    email = String(email || "").trim().toLowerCase();
    password = String(password || "");
    name = String(name || "").trim();
    phone = String(phone || "").trim();
    sellerType = sellerType || "private";

    if (!email || !password || !name) {
      return res.status(400).json({
        error: "name, email, password required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: "Invalid email",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 chars",
      });
    }

    if (!["private", "company"].includes(sellerType)) {
      return res.status(400).json({
        error: "Invalid sellerType",
      });
    }

    const exists = await User.findByEmail(email);

    if (exists) {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    const user = await User.create({
      email,
      password,
      name,
      phone,
      sellerType,
      role: "user",
    });

    return res.json({
      token: makeToken(user),
      user: safeUser(user),
    });
  } catch (e) {
    console.error("REGISTER_ERROR:", e?.message, e?.code);

    if (e?.code === "23505") {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    if (/JWT_SECRET/i.test(e?.message || "")) {
      return res.status(500).json({
        error: "Server misconfigured: JWT_SECRET missing",
      });
    }

    return res.status(500).json({
      error: "Register failed",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    console.log("LOGIN_START");

    let { email, password } = req.body || {};

    email = String(email || "").trim().toLowerCase();
    password = String(password || "");

    console.log("LOGIN_EMAIL:", email);

    if (!email || !password) {
      return res.status(400).json({
        error: "email, password required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: "Invalid email",
      });
    }

    console.log("LOGIN_BEFORE_FIND_USER");

    const user = await User.findByEmail(email);

    console.log("LOGIN_AFTER_FIND_USER:", Boolean(user));

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        error: "User is blocked",
      });
    }

    console.log("LOGIN_BEFORE_COMPARE_PASSWORD");

    const ok = await User.comparePassword(user, password);

    console.log("LOGIN_AFTER_COMPARE_PASSWORD:", ok);

    if (!ok) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    console.log("LOGIN_SUCCESS");

    return res.json({
      token: makeToken(user),
      user: safeUser(user),
    });
  } catch (e) {
    console.error("LOGIN_ERROR:", e?.message, e?.code);

    return res.status(500).json({
      error: "Login failed",
      details: e?.message || "Unknown error",
    });
  }
});

router.get("/verification", (req, res) => {
  res.json({
    emailVerified: false,
    pending: false,
  });
});

router.post("/verification", (req, res) => {
  res.json({
    ok: true,
    pending: true,
  });
});

module.exports = router;