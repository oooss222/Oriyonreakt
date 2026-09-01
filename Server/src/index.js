const express = require("express");
const compression = require("compression");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const http = require("http");

require("dotenv").config();

const { initDb, pool } = require("./db");
const { initSocket } = require("./socket");
const { getAllowedOrigins, isOriginAllowed } = require("./corsOrigins");
const { startMonthlyReportScheduler } = require("./lib/financeReport");
const { startListingMaintenanceScheduler } = require("./lib/listingMaintenance");
const { registerSeoRoutes, registerCrawlerRoutes } = require("./lib/seoPrerender");
const { securityHeaders } = require("./middleware/securityHeaders");
const {
  authLoginLimiter,
  authRegisterLimiter,
  authPhoneSendLimiter,
  authPhoneVerifyLimiter,
  apiGeneralLimiter,
} = require("./middleware/rateLimit");
const { validateEnv } = require("./lib/env");
const {
  rlsContextMiddleware,
  systemRlsMiddleware,
} = require("./lib/rlsContext");
const Listing = require("./models/Listing");

const app = express();
const server = http.createServer(app);
const io = initSocket(server);

app.set("io", io);
app.set("trust proxy", 1);

const PORT = Number(process.env.PORT || 4000);
const IS_PRODUCTION = process.env.NODE_ENV === "production";

app.use(securityHeaders);
app.use(compression({ threshold: 1024 }));

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
app.use("/api", apiGeneralLimiter);

app.use(
  express.json({
    limit: "2mb",
  })
);

app.use(rlsContextMiddleware);

app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "uploads"), {
    maxAge: "30d",
  })
);

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    return res.json({
      ok: true,
      db: "postgresql",
    });
  } catch (e) {
    console.error("HEALTH_DB_ERROR:", e?.message);

    return res.status(503).json({
      ok: false,
      db: "unavailable",
    });
  }
});

app.use("/api/auth/check-identity", authLoginLimiter);
app.use("/api/auth/login", authLoginLimiter);
app.use("/api/auth/register", authRegisterLimiter);
app.use("/api/auth/phone/send-code", authPhoneSendLimiter);
app.use("/api/auth/phone/verify", authPhoneVerifyLimiter);
app.use("/api/auth", systemRlsMiddleware);
app.use("/api/auth", require("./routes/auth"));

app.use("/api/users", require("./routes/users"));

app.use("/api/favorites", require("./routes/favorites"));

app.use("/api/upload", require("./routes/upload"));

app.use("/api/listings", require("./routes/listings"));

app.use("/api/compare", require("./routes/compare"));

app.use("/api/events", require("./routes/events"));

app.use("/api/recommendations", require("./routes/recommendations"));

app.use("/api/settings", require("./routes/settings"));

app.use("/api/messages", require("./routes/messages"));

app.use("/api/payments/alif/callback", systemRlsMiddleware);
app.use("/api/payments", require("./routes/payments"));

app.use("/api/reviews", require("./routes/reviews"));

app.use("/api/saved-searches", require("./routes/savedSearches"));

app.use("/api/developments", require("./routes/developments"));

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

registerCrawlerRoutes(app, {
  Listing,
  query: require("./db").query,
});

const clientDistCandidates = [
  path.join(__dirname, "..", "public"),
  path.join(__dirname, "..", "..", "client", "dist"),
];

const clientDist = clientDistCandidates.find((dir) =>
  fs.existsSync(path.join(dir, "index.html"))
);

if (clientDist) {
  console.log("Serving frontend from:", clientDist);

  registerSeoRoutes(app, {
    clientDist,
    Listing,
  });

  // Vite emits content-hashed filenames under /assets, so those are immutable.
  // index.html must stay uncached or clients pin an old asset manifest.
  app.use(
    express.static(clientDist, {
      maxAge: "365d",
      immutable: true,
      setHeaders(res, filePath) {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    })
  );

  app.get(/^(?!\/api).*/, (req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(clientDist, "index.html"));
  });
} else {
  console.warn("Frontend build not found; running API only");
}

app.use((err, req, res, next) => {
  console.error("UNCAUGHT_ERROR:", err);

  if (err?.status && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({
      error: err.message || "Bad request",
    });
  }

  res.status(500).json({
    error: IS_PRODUCTION ? "Server error" : err?.message || "Server error",
    ...(IS_PRODUCTION ? {} : { stack: err?.stack }),
  });
});

async function start() {
  try {
    validateEnv();
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
      startListingMaintenanceScheduler();
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

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`Received ${signal}, shutting down`);

  const forceExit = setTimeout(() => {
    console.warn("Shutdown timed out, exiting");
    process.exit(1);
  }, 15000);
  forceExit.unref();

  try {
    io.close();
    await new Promise((resolve) => server.close(resolve));
    await pool.end().catch(() => {});
  } finally {
    clearTimeout(forceExit);
    process.exit(0);
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start();