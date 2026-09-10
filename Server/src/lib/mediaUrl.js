const CLOUDINARY_HOSTS = new Set(["res.cloudinary.com"]);

function getCloudName() {
  return String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
}

/**
 * Accepts only media produced by our own upload pipeline: a local /uploads path
 * or a Cloudinary URL under the configured cloud. Anything else lets a user
 * point listings and chat attachments at arbitrary third-party hosts.
 */
function isAllowedMediaUrl(rawUrl) {
  const value = String(rawUrl || "").trim();

  if (!value) return false;

  if (value.startsWith("/uploads/")) {
    return !value.includes("..");
  }

  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") {
    return false;
  }

  if (!CLOUDINARY_HOSTS.has(parsed.hostname.toLowerCase())) {
    return false;
  }

  const cloudName = getCloudName();

  if (!cloudName) {
    return true;
  }

  return parsed.pathname.startsWith(`/${cloudName}/`);
}

function isAllowedLinkUrl(rawUrl) {
  const value = String(rawUrl || "").trim();

  if (!value) return false;

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

module.exports = {
  isAllowedMediaUrl,
  isAllowedLinkUrl,
};
