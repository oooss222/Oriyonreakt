const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path"); // ✅ добавлено: нужен для статики /uploads
require("dotenv").config(); // загружаем .env раньше всего

const app = express();

// ---- Config ----
const PORT = process.env.PORT || 4000;

// гарантируем наличие имени базы в URI (если в .env забыли)
function ensureDbName(uri) {
  try {
    const u = new URL(uri);
    // u.pathname: "/oriyon_dev" или "/"
    if (!u.pathname || u.pathname === "/" || u.pathname === "") {
      u.pathname = "/oriyon_dev";
    }
    return u.toString().replace(/\/$/, ""); // уберём лишний слэш в конце
  } catch {
    // если строка без протокола попала — вернём дефолт
    return "mongodb://127.0.0.1:27017/oriyon_dev";
  }
}

const MONGO_URI = ensureDbName(
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/oriyon_dev"
);

// поддержка нескольких ORIGIN через запятую
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

// ---- Middlewares ----
app.use(
  cors({
    origin: function (origin, cb) {
      // при SSR/health origin может быть undefined — разрешаем
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("CORS: Origin not allowed: " + origin));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

// ✅ раздача загруженных файлов (файлы кладём в ../uploads)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ---- Routes ----
app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/favorites", require("./routes/favorites"));

// ✅ роут для загрузки изображений
app.use("/api/upload", require("./routes/upload"));

// (если уже используешь на фронте)
try {
  app.use("/api/listings", require("./routes/listings"));
} catch (e) {
  // если файла пока нет — не падаем
  console.warn("routes/listings not mounted (no file yet) — ok for now");
}

// ✅ 404 для любых неизвестных маршрутов ВНУТРИ /api
// В Express 5 нельзя использовать '/api/*', поэтому используем '/api'.
// Этот обработчик должен стоять ПОСЛЕ всех app.use('/api/...').
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ---- Global error safety net ----
app.use((err, req, res, next) => {
  console.error("UNCAUGHT_ERROR:", err?.message);
  res.status(500).json({ error: "Server error" });
});

// ---- DB ----
mongoose.set("strictQuery", true);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Mongo connected:", MONGO_URI);
    app.listen(PORT, () => {
      console.log(`API http://localhost:${PORT}`);
      console.log("CORS allowed origins:", ALLOWED_ORIGINS.join(", "));
    });
  })
  .catch((e) => {
    console.error("Mongo connection error:", e.message);
    process.exit(1);
  });
