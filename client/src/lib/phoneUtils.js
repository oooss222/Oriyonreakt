export function normalizePhoneInput(input) {
  if (!input) return "";

  let digits = String(input).replace(/\D/g, "");

  if (digits.startsWith("992") && digits.length > 9) {
    digits = digits.slice(3);
  }

  if (digits.startsWith("0") && digits.length > 9) {
    digits = digits.slice(1);
  }

  return digits.slice(0, 9);
}

export function formatPhoneLocalDigits(digits) {
  const value = normalizePhoneInput(digits);

  if (value.length <= 2) return value;
  if (value.length <= 5) return `${value.slice(0, 2)} ${value.slice(2)}`;
  if (value.length <= 7) {
    return `${value.slice(0, 2)} ${value.slice(2, 5)} ${value.slice(5)}`;
  }

  return `${value.slice(0, 2)} ${value.slice(2, 5)} ${value.slice(5, 7)} ${value.slice(7)}`;
}

export function phoneDigitsToApi(digits) {
  const normalized = normalizePhoneInput(digits);
  return normalized ? `+992${normalized}` : "";
}

export function isValidPhoneDigits(digits) {
  const normalized = normalizePhoneInput(digits);
  return normalized.length === 9 && normalized.startsWith("9");
}
