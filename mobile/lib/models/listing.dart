class ListingSpec {
  const ListingSpec({required this.name, required this.value});

  final String name;
  final String value;

  factory ListingSpec.fromJson(dynamic json) {
    if (json is Map) {
      return ListingSpec(
        name: "${json["name"] ?? ""}",
        value: "${json["value"] ?? ""}",
      );
    }
    return const ListingSpec(name: "", value: "");
  }

  Map<String, dynamic> toJson() => {"name": name, "value": value};
}

class Listing {
  const Listing({
    required this.id,
    required this.title,
    required this.price,
    required this.description,
    required this.location,
    required this.cat,
    required this.subcategory,
    required this.imageUrls,
    required this.specs,
    required this.ownerId,
    required this.status,
    required this.views,
    required this.vip,
    required this.top,
    this.highlight = false,
    this.sellerName = "",
    this.phone = "",
    this.sellerWhatsapp = "",
    this.sellerTelegram = "",
    this.ownerSellerType = "",
    this.ownerCompanyName = "",
    this.ownerCompanyLogo = "",
    this.ownerBusinessVerified = false,
    this.createdAt,
    this.publicId = "",
  });

  final String id;
  final String title;
  final String price;
  final String description;
  final String location;
  final String cat;
  final String subcategory;
  final List<String> imageUrls;
  final List<ListingSpec> specs;
  final String ownerId;
  final String status;
  final int views;
  final bool vip;
  final bool top;
  final bool highlight;
  final String sellerName;
  final String phone;
  final String sellerWhatsapp;
  final String sellerTelegram;
  final String ownerSellerType;
  final String ownerCompanyName;
  final String ownerCompanyLogo;
  final bool ownerBusinessVerified;
  final DateTime? createdAt;
  final String publicId;

  String get displaySellerName {
    if (ownerSellerType == "company" && ownerCompanyName.trim().isNotEmpty) {
      return ownerCompanyName.trim();
    }
    return sellerName.trim();
  }

  String get thumb => imageUrls.isEmpty ? "" : imageUrls.first;

  String get contactPhone {
    final direct = _cleanContact(phone);
    if (direct.isNotEmpty) return direct;
    final digits = sellerWhatsapp.replaceAll(RegExp(r"[^\d]"), "");
    if (digits.length >= 12 && digits.startsWith("992")) return "+$digits";
    if (digits.length == 9 && digits.startsWith("9")) return "+992$digits";
    return "";
  }

  factory Listing.fromJson(Map<String, dynamic> json) {
    final seller = _asJsonMap(json["seller"]);
    final owner = json["owner"] is Map ? _asJsonMap(json["owner"]) : const <String, dynamic>{};
    return Listing(
      id: "${json["id"] ?? json["_id"] ?? ""}",
      title: "${json["title"] ?? ""}",
      price: "${json["price"] ?? ""}",
      description: "${json["description"] ?? ""}",
      location: "${json["location"] ?? json["city"] ?? ""}",
      cat: "${json["cat"] ?? ""}",
      subcategory: "${json["subcategory"] ?? ""}",
      imageUrls: parseImageUrls(json["images"]),
      specs: (json["specs"] is List)
          ? (json["specs"] as List).map(ListingSpec.fromJson).toList()
          : const [],
      ownerId: json["owner"] is Map
          ? _cleanContact("${owner["id"] ?? owner["_id"] ?? ""}")
          : _cleanContact("${json["owner"] ?? json["ownerId"] ?? ""}"),
      status: "${json["status"] ?? "approved"}",
      views: int.tryParse("${json["views"] ?? 0}") ?? 0,
      vip: json["vip"] == true,
      top: json["top"] == true,
      highlight: json["highlight"] == true,
      sellerName: "${json["sellerName"] ?? json["ownerName"] ?? seller["name"] ?? ""}",
      phone: _readContact(json, seller, owner, const ["phone", "sellerPhone", "seller_phone", "ownerPhone"]),
      sellerWhatsapp: _readContact(json, seller, owner, const ["sellerWhatsapp", "whatsapp"]),
      sellerTelegram: _readContact(json, seller, owner, const ["sellerTelegram", "telegram"]),
      ownerSellerType: "${json["ownerSellerType"] ?? ""}",
      ownerCompanyName: "${json["ownerCompanyName"] ?? ""}",
      ownerCompanyLogo: "${json["ownerCompanyLogo"] ?? ""}",
      ownerBusinessVerified: json["ownerBusinessVerified"] == true,
      createdAt: DateTime.tryParse("${json["createdAt"] ?? ""}"),
      publicId: "${json["publicId"] ?? json["public_id"] ?? ""}",
    );
  }
}

Map<String, dynamic> _asJsonMap(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return const {};
}

String _cleanContact(String value) {
  final text = value.trim();
  if (text.isEmpty || text.toLowerCase() == "null") return "";
  return text;
}

String _readContact(
  Map<String, dynamic> json,
  Map<String, dynamic> seller,
  Map<String, dynamic> owner,
  List<String> keys,
) {
  for (final source in [json, seller, owner]) {
    for (final key in keys) {
      final value = _cleanContact("${source[key] ?? ""}");
      if (value.isNotEmpty) return value;
    }
  }
  return "";
}

List<String> parseImageUrls(dynamic images) {
  if (images is! List) return const [];
  return images
      .map((entry) {
        if (entry is String) return entry;
        if (entry is Map) {
          return "${entry["url"] ?? entry["src"] ?? entry["path"] ?? entry["secure_url"] ?? ""}";
        }
        return "";
      })
      .where((url) => url.trim().isNotEmpty)
      .toList();
}

List<Listing> parseListingList(dynamic data) {
  if (data is List) {
    return data
        .whereType<Map>()
        .map((item) => Listing.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }
  if (data is Map && data["items"] is List) {
    return parseListingList(data["items"]);
  }
  return const [];
}
