const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

const { initDb, pool } = require("./db");

const app = express();

const PORT = Number(process.env.PORT || 4000);

const ALLOWED_ORIGINS = (
  process.env.CORS_ORIGIN || "http://localhost:5173"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) {
        return cb(null, true);
      }

      if (ALLOWED_ORIGINS.includes(origin)) {
        return cb(null, true);
      }

      return cb(
        new Error("CORS: Origin not allowed: " + origin)
      );
    },

    credentials: true,
  })
);

app.use(
  express.json({
    limit: "2mb",
  })
);

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "..", "uploads")
  )
);

app.get("/api/health", (req, res) =>
  res.json({
    ok: true,
    db: "postgresql",
  })
);

app.use("/api/auth", require("./routes/auth"));

app.use("/api/users", require("./routes/users"));

app.use("/api/favorites", require("./routes/favorites"));

app.use("/api/upload", require("./routes/upload"));

app.use("/api/listings", require("./routes/listings"));

app.use("/api/messages", require("./routes/messages"));

app.use("/api/ads", require("./routes/ads"));

app.use("/api/admin", require("./routes/admin"));

app.use(
  "/api/moderation",
  require("./routes/moderation")
);

app.use("/api", (req, res) =>
  res.status(404).json({
    error: "Not found",
  })
);

app.use((err, req, res, next) => {
  console.error("UNCAUGHT_ERROR:", err);

  res.status(500).json({
    error: err?.message || "Server error",
    stack: err?.stack,
  });
});

async function start() {
  try {
    await initDb();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`API running on port ${PORT}`);

      console.log("Database: PostgreSQL");

      console.log(
        "CORS allowed origins:",
        ALLOWED_ORIGINS.join(", ")
      );
    });
  } catch (e) {
    console.error(
      "PostgreSQL connection/init error:",
      e.message
    );

    await pool.end().catch(() => {});

    process.exit(1);
  }
}

start();