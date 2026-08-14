function hasDatabaseConfig() {
  return Boolean(
    process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.PGHOST
  );
}

function validateEnv() {
  const isProd = process.env.NODE_ENV === "production";
  const errors = [];
  const warnings = [];

  if (!process.env.JWT_SECRET) {
    errors.push("JWT_SECRET is required");
  } else if (process.env.JWT_SECRET.length < 32) {
    warnings.push("JWT_SECRET should be at least 32 characters");
  }

  if (!hasDatabaseConfig()) {
    errors.push("Database config missing (DATABASE_URL or PGHOST)");
  }

  if (isProd && process.env.SMS_EXPOSE_CODE === "true") {
    warnings.push("SMS_EXPOSE_CODE is enabled in production (ignored)");
  }

  if (isProd && !process.env.CLIENT_URL && !process.env.APP_URL) {
    warnings.push("CLIENT_URL or APP_URL is not set");
  }

  for (const message of warnings) {
    console.warn("[env]", message);
  }

  if (errors.length) {
    for (const message of errors) {
      console.error("[env]", message);
    }

    if (isProd) {
      throw new Error(`Environment validation failed: ${errors.join("; ")}`);
    }
  }
}

module.exports = {
  validateEnv,
};
