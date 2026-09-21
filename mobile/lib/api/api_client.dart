import "dart:convert";

import "package:dio/dio.dart";
import "package:flutter_secure_storage/flutter_secure_storage.dart";

import "../config.dart";
import "../models/ad.dart";
import "../models/listing.dart";
import "../models/message.dart";
import "../models/user.dart";
import "api_exception.dart";

class ApiClient {
  ApiClient({FlutterSecureStorage? storage, Dio? dio})
      : _storage = storage ?? const FlutterSecureStorage(),
        _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: AppConfig.apiBase,
                connectTimeout: const Duration(seconds: 30),
                receiveTimeout: const Duration(seconds: 45),
                sendTimeout: const Duration(seconds: 30),
                headers: {"Accept": "application/json"},
              ),
            ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: tokenKey);
          if (token != null && token.isNotEmpty) {
            options.headers["Authorization"] = "Bearer $token";
          }
          final lang = options.extra["lang"] as String?;
          if (lang != null && lang.isNotEmpty) {
            options.headers["Accept-Language"] = lang;
          }
          handler.next(options);
        },
      ),
    );
  }

  static const tokenKey = "auth_token";

  final Dio _dio;
  final FlutterSecureStorage _storage;

  Future<String?> readToken() => _storage.read(key: tokenKey);

  Future<void> saveToken(String token) => _storage.write(key: tokenKey, value: token);

  Future<void> clearToken() => _storage.delete(key: tokenKey);

  Future<dynamic> _send(
    String method,
    String path, {
    Map<String, dynamic>? query,
    Object? body,
  }) async {
    try {
      final response = await _dio.request<dynamic>(
        path,
        data: body,
        queryParameters: query,
        options: Options(method: method),
      );
      return response.data;
    } on DioException catch (error) {
      throw _mapDio(error);
    }
  }

  ApiException _mapDio(DioException error) {
    if (error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.badCertificate ||
        error.type == DioExceptionType.unknown) {
      return ApiException(
        "Нет соединения с сервером. Проверьте интернет и попробуйте снова.",
        kind: "network",
      );
    }

    final data = error.response?.data;
    final status = error.response?.statusCode;
    var message = status == null ? "Нет ответа от сервера" : "Ошибка сервера ($status)";
    String? code;
    if (data is Map) {
      final fromApi = "${data["error"] ?? data["message"] ?? ""}".trim();
      if (fromApi.isNotEmpty) message = fromApi;
      code = data["code"]?.toString();
    }
    if (status == 401) {
      clearToken();
    }
    if (status == 502 || status == 503 || status == 504 || status == 522 || status == 524) {
      message = "Сервер временно недоступен. Попробуйте через минуту.";
    }
    return ApiException(message, status: status, code: code);
  }

  Future<AuthSession> login({required String email, required String password}) async {
    final data = await _send("POST", "/auth/login", body: {
      "email": email,
      "password": password,
    });
    return AuthSession.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<AuthSession> register({
    required String name,
    required String email,
    required String password,
    String phone = "",
  }) async {
    final data = await _send("POST", "/auth/register", body: {
      "name": name,
      "email": email,
      "password": password,
      if (phone.isNotEmpty) "phone": phone,
    });
    return AuthSession.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<Map<String, dynamic>> sendPhoneCode({
    required String phone,
    required String mode,
  }) async {
    final data = await _send("POST", "/auth/phone/send-code", body: {
      "phone": phone,
      "mode": mode,
    });
    return Map<String, dynamic>.from(data as Map);
  }

  Future<AuthSession> verifyPhoneCode({
    required String phone,
    required String code,
    required String mode,
    String name = "",
  }) async {
    final data = await _send("POST", "/auth/phone/verify", body: {
      "phone": phone,
      "code": code,
      "mode": mode,
      if (name.isNotEmpty) "name": name,
    });
    return AuthSession.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<AuthUser> me() async {
    final data = await _send("GET", "/users/me");
    final map = Map<String, dynamic>.from(data as Map);
    final nested = map["user"];
    return AuthUser.fromJson(nested is Map ? Map<String, dynamic>.from(nested) : map);
  }

  Future<AuthUser> updateMe(Map<String, dynamic> body) async {
    final data = await _send("PUT", "/users/me", body: body);
    return AuthUser.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<SellerProfile> sellerPublic(String id) async {
    final data = await _send("GET", "/users/$id/public");
    return SellerProfile.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<Map<String, dynamic>> siteSettings() async {
    final data = await _send("GET", "/settings");
    return Map<String, dynamic>.from(data as Map? ?? {});
  }

  Future<String> sitePolicy() async {
    final data = await _send("GET", "/settings/policy");
    if (data is Map) {
      return "${data["content"] ?? data["policyContent"] ?? data["policy"] ?? ""}";
    }
    return "$data";
  }

  Future<Map<String, dynamic>> businessSupportContact() async {
    final data = await _send("GET", "/settings/business-support");
    return Map<String, dynamic>.from(data as Map? ?? {});
  }

  Map<String, dynamic> _listingQuery({
    String? cat,
    String? subcategory,
    String? search,
    String? location,
    String? priceFrom,
    String? priceTo,
    String? owner,
    Map<String, String>? specs,
    String? sort,
    int? limit,
    int? offset,
  }) {
    return {
      if (cat != null && cat.isNotEmpty) "cat": cat,
      if (subcategory != null && subcategory.isNotEmpty) "subcategory": subcategory,
      if (search != null && search.isNotEmpty) "search": search,
      if (location != null && location.isNotEmpty) "location": location,
      if (priceFrom != null && priceFrom.isNotEmpty) "priceFrom": priceFrom,
      if (priceTo != null && priceTo.isNotEmpty) "priceTo": priceTo,
      if (owner != null && owner.isNotEmpty) "owner": owner,
      if (specs != null && specs.isNotEmpty) "specs": jsonEncode(specs),
      if (sort != null && sort.isNotEmpty) "sort": sort,
      if (limit != null) "limit": "$limit",
      if (offset != null) "offset": "$offset",
    };
  }

  Future<List<Listing>> listings({
    String? cat,
    String? subcategory,
    String? search,
    String? location,
    String? priceFrom,
    String? priceTo,
    String? owner,
    Map<String, String>? specs,
    String sort = "new",
    int limit = 30,
    int offset = 0,
  }) async {
    final data = await _send(
      "GET",
      "/listings",
      query: _listingQuery(
        cat: cat,
        subcategory: subcategory,
        search: search,
        location: location,
        priceFrom: priceFrom,
        priceTo: priceTo,
        owner: owner,
        specs: specs,
        sort: sort,
        limit: limit,
        offset: offset,
      ),
    );
    return parseListingList(data);
  }

  Future<int> listingsCount({
    String? cat,
    String? subcategory,
    String? search,
    String? location,
    String? priceFrom,
    String? priceTo,
    Map<String, String>? specs,
  }) async {
    final data = await _send(
      "GET",
      "/listings/count",
      query: _listingQuery(
        cat: cat,
        subcategory: subcategory,
        search: search,
        location: location,
        priceFrom: priceFrom,
        priceTo: priceTo,
        specs: specs,
      ),
    );
    if (data is Map) {
      return int.tryParse("${data["total"] ?? 0}") ?? 0;
    }
    return 0;
  }

  Future<({int total, Map<String, int> bySubcategory})> listingStats(
    String cat, {
    String location = "",
  }) async {
    final data = await _send("GET", "/listings/stats", query: {
      "cat": cat,
      if (location.isNotEmpty) "location": location,
    });
    if (data is! Map) return (total: 0, bySubcategory: const <String, int>{});
    final raw = data["bySubcategory"];
    final bySub = <String, int>{};
    if (raw is Map) {
      for (final entry in raw.entries) {
        bySub["${entry.key}"] = int.tryParse("${entry.value}") ?? 0;
      }
    }
    return (
      total: int.tryParse("${data["total"] ?? 0}") ?? 0,
      bySubcategory: bySub,
    );
  }

  Future<List<PromoAd>> ads({required String placement, String cat = ""}) async {
    final data = await _send("GET", "/ads", query: {
      "placement": placement,
      if (cat.isNotEmpty) "cat": cat,
    });
    return parsePromoAdList(data);
  }

  Future<void> trackAd(String id, {String type = "impression"}) async {
    if (id.isEmpty) return;
    try {
      await _send("POST", "/ads/$id/track", body: {"type": type});
    } catch (_) {}
  }

  Future<Listing> listingById(String id) async {
    final data = await _send("GET", "/listings/$id");
    final map = Map<String, dynamic>.from(data as Map);
    final nested = map["listing"];
    return Listing.fromJson(nested is Map ? Map<String, dynamic>.from(nested) : map);
  }

  Future<void> recordListingView(String id) async {
    try {
      await _send("POST", "/listings/$id/view");
    } catch (_) {}
  }

  Future<Map<String, dynamic>> homeRecommendations({
    String city = "Душанбе",
    int limit = 20,
  }) async {
    final data = await _send("GET", "/recommendations/home", query: {
      "city": city,
      "limit": "$limit",
    });
    return Map<String, dynamic>.from(data as Map? ?? {});
  }

  Future<List<Listing>> favorites() async {
    final data = await _send("GET", "/favorites");
    return parseListingList(data);
  }

  Future<void> addFavorite(String id) => _send("POST", "/favorites/$id");

  Future<void> removeFavorite(String id) => _send("DELETE", "/favorites/$id");

  Future<List<Listing>> myListings() async {
    final data = await _send("GET", "/listings/mine");
    return parseListingList(data);
  }

  Future<Listing> createListing(Map<String, dynamic> body) async {
    final data = await _send("POST", "/listings", body: body);
    return Listing.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<Listing> updateListing(String id, Map<String, dynamic> body) async {
    final data = await _send("PUT", "/listings/$id", body: body);
    return Listing.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<void> markSold(String id) => _send("POST", "/listings/$id/sold");

  Future<void> archiveListing(String id) => _send("POST", "/listings/$id/archive");

  Future<void> republishListing(String id) => _send("POST", "/listings/$id/republish");

  Future<void> promoteListing(String id, {required String type, required int days}) {
    return _send("POST", "/listings/$id/promote", body: {"type": type, "days": days});
  }

  Future<void> reportListing(String id, {required String reason, String details = ""}) {
    return _send("POST", "/listings/$id/report", body: {
      "reason": reason,
      "details": details,
    });
  }

  Future<List<String>> uploadImages(List<MultipartFile> files) async {
    final form = FormData.fromMap({
      "images": files,
    });
    try {
      final response = await _dio.post<dynamic>("/upload/images", data: form);
      final urls = response.data is Map ? (response.data["urls"] as List?) : null;
      return (urls ?? const []).map((item) => "$item").toList();
    } on DioException catch (error) {
      throw _mapDio(error);
    }
  }

  Future<List<ChatMessage>> inbox({bool archived = false}) async {
    final data = await _send("GET", "/messages/inbox", query: {
      if (archived) "archived": "1",
    });
    if (data is List) {
      return data
          .whereType<Map>()
          .map((item) => ChatMessage.fromJson(Map<String, dynamic>.from(item)))
          .toList();
    }
    return const [];
  }

  Future<void> markThreadRead({required String listingId, required String peerId}) {
    return _send("POST", "/messages/$listingId/read", body: {"peerId": peerId});
  }

  Future<void> patchThread({
    required String listingId,
    required String peerId,
    bool? archived,
    bool? muted,
  }) {
    return _send("PATCH", "/messages/threads/$listingId", body: {
      "peerId": peerId,
      "isArchived": ?archived,
      "isMuted": ?muted,
    });
  }

  Future<List<ChatMessage>> thread({
    required String listingId,
    required String peerId,
  }) async {
    final data = await _send("GET", "/messages/$listingId", query: {
      "peerId": peerId,
    });
    final items = data is Map ? data["messages"] : data;
    if (items is List) {
      return items
          .whereType<Map>()
          .map((item) => ChatMessage.fromJson(Map<String, dynamic>.from(item)))
          .toList();
    }
    return const [];
  }

  Future<ChatMessage> sendMessage({
    required String listingId,
    required String receiverId,
    required String text,
  }) async {
    final data = await _send("POST", "/messages/$listingId", body: {
      "text": text,
      "receiverId": receiverId,
    });
    final payload = data is Map && data["message"] is Map ? data["message"] : data;
    return ChatMessage.fromJson(Map<String, dynamic>.from(payload as Map));
  }

  Future<Map<String, dynamic>> reviews(String sellerId) async {
    final data = await _send("GET", "/reviews/seller/$sellerId");
    return Map<String, dynamic>.from(data as Map? ?? {});
  }

  Future<List<WalletTx>> walletTransactions() async {
    final data = await _send("GET", "/users/me/wallet/transactions", query: {
      "limit": "50",
    });
    final items = data is Map ? (data["items"] ?? data["transactions"] ?? data) : data;
    if (items is List) {
      return items
          .whereType<Map>()
          .map((item) => WalletTx.fromJson(Map<String, dynamic>.from(item)))
          .toList();
    }
    return const [];
  }

  Future<Map<String, dynamic>> initAlifTopUp(num amount) async {
    final data = await _send("POST", "/payments/alif/wallet-top-up", body: {
      "amount": amount,
    });
    return Map<String, dynamic>.from(data as Map);
  }

  Future<void> syncAlifPayment(String orderId) {
    return _send("POST", "/payments/alif/sync/$orderId");
  }
}
