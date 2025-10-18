const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const makeToken = (u) => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
  return jwt.sign(
    { id: u._id.toString(), email: u.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

function isValidEmail(email = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    let { email, password, name, phone, sellerType } = req.body || {};
    email = (email || "").trim().toLowerCase();
    name = (name || "").trim();

    if (!email || !password || !name) {
      return res.status(400).json({ error: "name, email, password required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 chars" });
    }

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ error: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hash,
      name,
      phone,
      sellerType: sellerType || "private",
    });

    const token = makeToken(user);
    const safe = {
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      sellerType: user.sellerType,
    };
    return res.json({ token, user: safe });
  } catch (e) {
    console.error("REGISTER_ERROR:", e?.message, e?.code);
    if (e?.code === 11000)
      return res.status(409).json({ error: "Email already registered" });
    if (/JWT_SECRET/i.test(e?.message || ""))
      return res
        .status(500)
        .json({ error: "Server misconfigured: JWT_SECRET missing" });
    return res.status(500).json({ error: "Register failed" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body || {};
    email = (email || "").trim().toLowerCase();
    if (!email || !password)
      return res.status(400).json({ error: "email, password required" });
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = makeToken(user);
    const safe = {
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      sellerType: user.sellerType,
    };
    return res.json({ token, user: safe });
  } catch (e) {
    console.error("LOGIN_ERROR:", e?.message);
    return res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
