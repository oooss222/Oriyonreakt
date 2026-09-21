class AppConfig {
  static const apiBase = String.fromEnvironment(
    "API_BASE",
    defaultValue: "https://oriyonreakt-1.onrender.com/api",
  );

  static const siteOrigin = String.fromEnvironment(
    "SITE_ORIGIN",
    defaultValue: "https://oriyonreakt-1.onrender.com",
  );

  static const publicSite = String.fromEnvironment(
    "PUBLIC_SITE",
    defaultValue: "https://diyor.tj",
  );

  static const supportEmail = "info@diyor.tj";
  static const appVersion = "1.0.0";

  static String get socketUrl {
    final uri = Uri.parse(apiBase);
    if (uri.path.endsWith("/api")) {
      return uri.replace(path: "").toString().replaceAll(RegExp(r"/$"), "");
    }
    return uri.origin;
  }
}
