function isProduction() {
  return String(process.env.NODE_ENV || "").toLowerCase() === "production";
}

function buildContentSecurityPolicy() {
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https: wss:",
    "frame-src 'self' https://www.openstreetmap.org",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");

  if (isProduction()) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  if (!String(req.path || "").startsWith("/api")) {
    res.setHeader("Content-Security-Policy", buildContentSecurityPolicy());
  }

  next();
}

module.exports = {
  securityHeaders,
  buildContentSecurityPolicy,
};
