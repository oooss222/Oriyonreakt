class AuthUser {
  const AuthUser({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    this.whatsapp = "",
    this.telegram = "",
    this.role = "user",
    this.sellerType = "private",
    this.companyName = "",
    this.walletBalance = 0,
    this.emailVerified = false,
    this.businessVerified = false,
  });

  final String id;
  final String name;
  final String email;
  final String phone;
  final String whatsapp;
  final String telegram;
  final String role;
  final String sellerType;
  final String companyName;
  final double walletBalance;
  final bool emailVerified;
  final bool businessVerified;

  String get displayName {
    if (sellerType == "company" && companyName.trim().isNotEmpty) {
      return companyName.trim();
    }
    return name.trim().isEmpty ? email : name.trim();
  }

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: "${json["id"] ?? json["_id"] ?? ""}",
      name: "${json["name"] ?? ""}",
      email: "${json["email"] ?? ""}",
      phone: "${json["phone"] ?? ""}",
      whatsapp: "${json["whatsapp"] ?? ""}",
      telegram: "${json["telegram"] ?? ""}",
      role: "${json["role"] ?? "user"}",
      sellerType: "${json["sellerType"] ?? "private"}",
      companyName: "${json["companyName"] ?? ""}",
      walletBalance: double.tryParse("${json["walletBalance"] ?? 0}") ?? 0,
      emailVerified: json["emailVerified"] == true,
      businessVerified: json["businessVerified"] == true,
    );
  }
}

class AuthSession {
  const AuthSession({required this.token, required this.user});

  final String token;
  final AuthUser user;

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    final userJson = json["user"];
    return AuthSession(
      token: "${json["token"] ?? ""}",
      user: AuthUser.fromJson(
        userJson is Map ? Map<String, dynamic>.from(userJson) : const {},
      ),
    );
  }
}

class SellerProfile {
  const SellerProfile({
    required this.id,
    required this.displayName,
    this.sellerType = "private",
    this.companyName = "",
    this.companyLogo = "",
    this.whatsapp = "",
    this.telegram = "",
    this.listingsCount = 0,
    this.ratingAverage = 0,
    this.ratingCount = 0,
    this.createdAt,
    this.businessVerified = false,
  });

  final String id;
  final String displayName;
  final String sellerType;
  final String companyName;
  final String companyLogo;
  final String whatsapp;
  final String telegram;
  final int listingsCount;
  final double ratingAverage;
  final int ratingCount;
  final DateTime? createdAt;
  final bool businessVerified;

  factory SellerProfile.fromJson(Map<String, dynamic> json) {
    return SellerProfile(
      id: "${json["id"] ?? json["_id"] ?? ""}",
      displayName: "${json["displayName"] ?? json["name"] ?? ""}",
      sellerType: "${json["sellerType"] ?? "private"}",
      companyName: "${json["companyName"] ?? ""}",
      companyLogo: "${json["companyLogo"] ?? ""}",
      whatsapp: "${json["whatsapp"] ?? ""}",
      telegram: "${json["telegram"] ?? ""}",
      listingsCount: int.tryParse("${json["listingsCount"] ?? 0}") ?? 0,
      ratingAverage: double.tryParse("${json["ratingAverage"] ?? 0}") ?? 0,
      ratingCount: int.tryParse("${json["ratingCount"] ?? 0}") ?? 0,
      createdAt: DateTime.tryParse("${json["createdAt"] ?? ""}"),
      businessVerified: json["businessVerified"] == true,
    );
  }
}
