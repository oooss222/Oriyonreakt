class ApiException implements Exception {
  ApiException(
    this.message, {
    this.status,
    this.code,
    this.kind = "http",
  });

  final String message;
  final int? status;
  final String? code;
  final String kind;

  bool get isUnauthorized => status == 401;
  bool get isNetwork => kind == "network";

  @override
  String toString() => message;
}
