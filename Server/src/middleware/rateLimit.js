const buckets = new Map();

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];

  if (forwarded) {
    return String(forwarded).split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
}

function pruneBuckets(now) {
  if (buckets.size < 5000) {
    return;
  }

  for (const [key, entry] of buckets) {
    if (now - entry.startedAt > entry.windowMs) {
      buckets.delete(key);
    }
  }
}

function createRateLimiter({
  windowMs,
  max,
  message = "Too many requests",
  keyGenerator = getClientIp,
  skip,
}) {
  return function rateLimitMiddleware(req, res, next) {
    if (typeof skip === "function" && skip(req)) {
      return next();
    }

    const key = String(keyGenerator(req) || "unknown");
    const now = Date.now();
    const entry = buckets.get(key);

    if (!entry || now - entry.startedAt > windowMs) {
      buckets.set(key, { startedAt: now, count: 1, windowMs });
      pruneBuckets(now);
      return next();
    }

    entry.count += 1;

    if (entry.count > max) {
      const retryAfterSec = Math.ceil(
        (windowMs - (now - entry.startedAt)) / 1000
      );

      res.set("Retry-After", String(Math.max(retryAfterSec, 1)));

      return res.status(429).json({
        error: message,
        retryAfterSec: Math.max(retryAfterSec, 1),
      });
    }

    return next();
  };
}

const authLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Too many login attempts. Try again later.",
});

const authRegisterLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many registration attempts. Try again later.",
});

const authPhoneSendLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: "Too many SMS requests. Try again later.",
});

const authPhoneVerifyLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: "Too many verification attempts. Try again later.",
});

const apiGeneralLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 200,
  message: "Too many requests. Slow down.",
  skip: (req) => req.path === "/health",
});

function userOrIpKey(req) {
  return req.user?.id ? `user:${req.user.id}` : getClientIp(req);
}

const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 40,
  message: "Upload limit reached. Try again later.",
  keyGenerator: userOrIpKey,
});

const reviewLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many reviews. Try again later.",
  keyGenerator: userOrIpKey,
});

const messageSendLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many messages. Slow down.",
  keyGenerator: userOrIpKey,
});

const reportLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: "Too many reports. Try again later.",
  keyGenerator: userOrIpKey,
});

const compareImportLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Too many import requests. Try again later.",
  keyGenerator: userOrIpKey,
});

const walletTopUpLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many top-up attempts. Try again later.",
  keyGenerator: userOrIpKey,
});

module.exports = {
  createRateLimiter,
  getClientIp,
  authLoginLimiter,
  authRegisterLimiter,
  authPhoneSendLimiter,
  authPhoneVerifyLimiter,
  apiGeneralLimiter,
  uploadLimiter,
  reviewLimiter,
  messageSendLimiter,
  reportLimiter,
  compareImportLimiter,
  walletTopUpLimiter,
};
