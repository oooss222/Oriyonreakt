class PromoAd {
  const PromoAd({
    required this.id,
    this.title = "",
    this.headline = "",
    this.description = "",
    this.imageUrl = "",
    this.linkUrl = "",
    this.format = "banner",
    this.advertiser = "",
  });

  final String id;
  final String title;
  final String headline;
  final String description;
  final String imageUrl;
  final String linkUrl;
  final String format;
  final String advertiser;

  String get caption {
    final head = headline.trim();
    if (head.isNotEmpty) return head;
    return title.trim();
  }

  factory PromoAd.fromJson(Map<String, dynamic> json) {
    return PromoAd(
      id: "${json["id"] ?? ""}",
      title: "${json["title"] ?? ""}",
      headline: "${json["headline"] ?? ""}",
      description: "${json["description"] ?? ""}",
      imageUrl: "${json["imageUrl"] ?? json["image_url"] ?? ""}",
      linkUrl: "${json["linkUrl"] ?? json["link_url"] ?? ""}",
      format: "${json["format"] ?? "banner"}",
      advertiser: "${json["advertiser"] ?? ""}",
    );
  }
}

List<PromoAd> parsePromoAdList(dynamic data) {
  if (data is List) {
    return data
        .whereType<Map>()
        .map((item) => PromoAd.fromJson(Map<String, dynamic>.from(item)))
        .where((item) => item.id.isNotEmpty && item.format != "html")
        .toList();
  }
  if (data is Map && data["items"] is List) {
    return parsePromoAdList(data["items"]);
  }
  return const [];
}
