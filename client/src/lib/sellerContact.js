export function buildWhatsappHref(value = "") {
  const digits = String(value).replace(/[^\d]/g, "");

  if (!digits) {
    return "";
  }

  return `https://wa.me/${digits}`;
}

export function buildTelegramHref(value = "") {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  const username = raw.replace(/^@/, "");

  return `https://t.me/${username}`;
}
