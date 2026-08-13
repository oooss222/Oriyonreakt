const TJ_MOBILE_RE = /^\+992(9\d{8})$/;

function normalizePhone(input) {
  if (!input || typeof input !== "string") {
    return null;
  }

  let digits = input.replace(/\D/g, "");

  if (digits.startsWith("992") && digits.length === 12) {
    digits = digits.slice(3);
  }

  if (digits.startsWith("0") && digits.length === 10) {
    digits = digits.slice(1);
  }

  if (digits.length !== 9 || !digits.startsWith("9")) {
    return null;
  }

  return `+992${digits}`;
}

function isValidTjPhone(input) {
  const normalized = normalizePhone(input);
  return Boolean(normalized && TJ_MOBILE_RE.test(normalized));
}

function formatPhoneDisplay(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return phone || "";
  }

  const local = normalized.slice(4);
  return `+992 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
}

function phoneToSyntheticEmail(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return null;
  }

  return `${normalized.replace(/\D/g, "")}@phone.oriyon.store`;
}

module.exports = {
  normalizePhone,
  isValidTjPhone,
  formatPhoneDisplay,
  phoneToSyntheticEmail,
};
