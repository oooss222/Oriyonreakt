String listingThreadLocation({
  required String listingId,
  required String peerId,
  String title = "",
}) {
  final path = "/messages/thread/$listingId/$peerId";
  if (title.trim().isEmpty) return path;
  return Uri(path: path, queryParameters: {"title": title}).toString();
}
