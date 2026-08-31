import { USER_KEY } from "./auth";

const MIN_PHONE_DIGITS = 9;

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

function digitsOf(value) {
  return String(value || "").replace(/\D/g, "");
}

export function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function userHasSellerPhone(user = readStoredUser()) {
  if (!user) return false;

  const candidates = [
    user.phone,
    ...(Array.isArray(user.extraPhones) ? user.extraPhones : []),
    ...(Array.isArray(user.extra_phones) ? user.extra_phones : []),
  ];

  return candidates.some((phone) => digitsOf(phone).length >= MIN_PHONE_DIGITS);
}

export function mergeUserIntoStorage(user) {
  if (!user) return;

  try {
    const current = readStoredUser() || {};
    localStorage.setItem(USER_KEY, JSON.stringify({ ...current, ...user }));
  } catch {
    // ignore quota / private mode
  }
}
