const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// простая JWT-аутентификация
function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// GET /api/users/me
router.get("/me", auth, async (req, res) => {
  const u = await User.findById(req.userId).lean();
  if (!u) return res.status(404).json({ error: "User not found" });
  const { _id: id, email, name, phone, sellerType } = u;
  res.json({ id, email, name, phone, sellerType });
});

// PATCH /api/users/me
router.patch("/me", auth, async (req, res) => {
  const { name, phone, sellerType } = req.body || {};
  const u = await User.findByIdAndUpdate(
    req.userId,
    { $set: { name, phone, sellerType } },
    { new: true }
  ).lean();
  if (!u) return res.status(404).json({ error: "User not found" });
  const { _id: id, email } = u;
  res.json({
    id,
    email,
    name: u.name,
    phone: u.phone,
    sellerType: u.sellerType,
  });
});

module.exports = router;
