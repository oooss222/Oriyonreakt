const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const http = require("http");

require("dotenv").config();

const { initDb, pool } = require("./db");
const { initSocket } = require("./socket");
const { getAllowedOrigins, isOriginAllowed } = require("./corsOrigins");
const { startMonthlyReportScheduler } = require("./lib/financeReport");

const app = express();
const server = http.createServer(app);
const io = initSocket(server);

app.set("io", io);

const PORT = Number(process.env.PORT || 4000);

const ALLOWED_ORIGINS = getAllowedOrigins();

const corsMiddleware = cors({
  origin(origin, cb) {
    if (isOriginAllowed(origin)) {
      return cb(null, true);
    }

    return cb(
      new Error("CORS: Origin not allowed: " + origin)
    );
  },

  credentials: true,
});

app.use("/api", corsMiddleware);

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

app.use("/api/settings", require("./routes/settings"));

app.use("/api/messages", require("./routes/messages"));

app.use("/api/payments", require("./routes/payments"));

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

const clientDistCandidates = [
  path.join(__dirname, "..", "public"),
  path.join(__dirname, "..", "..", "client", "dist"),
];

const clientDist = clientDistCandidates.find((dir) =>
  fs.existsSync(path.join(dir, "index.html"))
);

if (clientDist) {
  console.log("Serving frontend from:", clientDist);

  app.use(express.static(clientDist));

  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
} else {
  console.warn("Frontend build not found; running API only");
}

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

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`API running on port ${PORT}`);

      console.log("Database: PostgreSQL");
      console.log("WebSocket: enabled");

      console.log(
        "CORS allowed origins:",
        ALLOWED_ORIGINS.join(", ")
      );

      startMonthlyReportScheduler();
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