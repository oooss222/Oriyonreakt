String normalizePhoneInput(String input) {
  var digits = input.replaceAll(RegExp(r"\D"), "");
  if (digits.startsWith("992") && digits.length > 9) {
    digits = digits.substring(3);
  }
  if (digits.startsWith("0") && digits.length > 9) {
    digits = digits.substring(1);
  }
  if (digits.length > 9) digits = digits.substring(0, 9);
  return digits;
}

String formatPhoneLocalDigits(String digits) {
  final value = normalizePhoneInput(digits);
  if (value.length <= 2) return value;
  if (value.length <= 5) return "${value.substring(0, 2)} ${value.substring(2)}";
  if (value.length <= 7) {
    return "${value.substring(0, 2)} ${value.substring(2, 5)} ${value.substring(5)}";
  }
  return "${value.substring(0, 2)} ${value.substring(2, 5)} ${value.substring(5, 7)} ${value.substring(7)}";
}

String phoneDigitsToApi(String digits) {
  final normalized = normalizePhoneInput(digits);
  return normalized.isEmpty ? "" : "+992$normalized";
}

bool isValidPhoneDigits(String digits) {
  final normalized = normalizePhoneInput(digits);
  return normalized.length == 9 && normalized.startsWith("9");
}

String formatPhonePretty(String raw) {
  final digits = raw.replaceAll(RegExp(r"\D"), "");
  var local = digits;
  if (local.startsWith("992") && local.length >= 12) {
    local = local.substring(3);
  }
  if (local.length != 9) return raw.trim();
  return "+992 ${local.substring(0, 2)} ${local.substring(2, 5)} ${local.substring(5, 7)} ${local.substring(7)}";
}
