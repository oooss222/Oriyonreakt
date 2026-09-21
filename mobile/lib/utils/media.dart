import "../config.dart";

String withImageWidth(String url, int width) {
  if (width <= 0 || !url.contains("res.cloudinary.com")) return url;
  const marker = "/upload/";
  final index = url.indexOf(marker);
  if (index < 0) return url;
  final prefixEnd = index + marker.length;
  final rest = url.substring(prefixEnd);
  if (RegExp(r"^[a-z]{1,3}_[^/]*/").hasMatch(rest)) return url;
  return "${url.substring(0, prefixEnd)}f_auto,q_auto,c_limit,w_$width/$rest";
}

String resolveMediaUrl(String? src, {int width = 0}) {
  if (src == null || src.trim().isEmpty) return "";
  final value = src.trim();
  if (value.startsWith("http") || value.startsWith("data:")) {
    return withImageWidth(value, width);
  }
  final origin = AppConfig.apiBase.replaceFirst(RegExp(r"/api/?$"), "");
  final clean = value.replaceFirst(RegExp(r"^/+"), "");
  return withImageWidth("$origin/$clean", width);
}

String whatsappHref(String value) {
  final digits = value.replaceAll(RegExp(r"[^\d]"), "");
  if (digits.isEmpty) return "";
  return "https://wa.me/$digits";
}

String telegramHref(String value) {
  final raw = value.trim();
  if (raw.isEmpty) return "";
  if (raw.startsWith("http")) return raw;
  return "https://t.me/${raw.replaceFirst(RegExp(r"^@"), "")}";
}
