import "package:intl/intl.dart";

double? parsePriceNumber(String? value) {
  if (value == null || value.trim().isEmpty) return null;
  final n = double.tryParse(value.replaceAll(" ", "").replaceAll(",", "."));
  return n;
}

String formatPrice(String? value, {String empty = "Цена не указана"}) {
  final n = parsePriceNumber(value);
  if (n == null) {
    if (value == null || value.trim().isEmpty) return empty;
    return value;
  }
  final formatted = NumberFormat.decimalPattern("ru_RU").format(n.round());
  return "$formatted TJS";
}

String formatSomoni(num value) {
  return "${NumberFormat.decimalPattern("ru_RU").format(value)} TJS";
}

String formatWallet(num value) {
  final formatted = NumberFormat("0.00", "ru_RU").format(value);
  return "$formatted TJS";
}

String formatCount(int value) {
  return NumberFormat.decimalPattern("ru_RU").format(value);
}

String timeAgo(DateTime? date, {required String Function(String) t}) {
  if (date == null) return "";
  final diff = DateTime.now().difference(date.toLocal());
  if (diff.inMinutes < 1) return t("time.justNow");
  if (diff.inMinutes < 60) return t("time.minAgo").replaceAll("{{n}}", "${diff.inMinutes}");
  if (diff.inHours < 24) return t("time.hoursAgo").replaceAll("{{n}}", "${diff.inHours}");
  if (diff.inDays == 1) return t("time.yesterday");
  if (diff.inDays < 7) return t("time.daysAgo").replaceAll("{{n}}", "${diff.inDays}");
  return DateFormat("d MMM y", "ru").format(date.toLocal());
}

String formatInboxTime(DateTime? date, {required String Function(String) t}) {
  if (date == null) return "";
  final local = date.toLocal();
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final day = DateTime(local.year, local.month, local.day);
  if (day == today) return DateFormat("HH:mm").format(local);
  if (day == today.subtract(const Duration(days: 1))) return t("time.yesterday");
  if (local.year == now.year) return DateFormat("d MMM", "ru").format(local).replaceAll(".", "");
  return DateFormat("d MMM y", "ru").format(local).replaceAll(".", "");
}

String formatMessageTime(DateTime? date) {
  if (date == null) return "";
  return DateFormat("HH:mm").format(date.toLocal());
}
