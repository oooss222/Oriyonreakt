import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:shared_preferences/shared_preferences.dart";

import "../api/api_client.dart";
import "../api/api_exception.dart";
import "../data/catalog.dart";
import "../l10n/strings.dart";
import "../models/listing.dart";
import "../models/user.dart";
import "../theme/app_theme.dart";
import "chat_providers.dart";

final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw StateError("SharedPreferences must be overridden in main()");
});

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final localeControllerProvider =
    NotifierProvider<LocaleController, String>(LocaleController.new);

class LocaleController extends Notifier<String> {
  static const _key = "diyor_lang";

  @override
  String build() {
    final prefs = ref.watch(sharedPreferencesProvider);
    final stored = prefs.getString(_key) ?? prefs.getString("oriyon_lang") ?? "ru";
    return AppStrings.supported.contains(stored) ? stored : "ru";
  }

  Future<void> setLang(String lang) async {
    final value = AppStrings.supported.contains(lang) ? lang : "ru";
    await ref.read(sharedPreferencesProvider).setString(_key, value);
    state = value;
  }
}

final stringsProvider = Provider<AppStrings>((ref) {
  return AppStrings(ref.watch(localeControllerProvider));
});

final themeModeControllerProvider =
    NotifierProvider<ThemeModeController, AppThemePreference>(ThemeModeController.new);

class ThemeModeController extends Notifier<AppThemePreference> {
  static const _key = "diyor_theme";

  @override
  AppThemePreference build() {
    final prefs = ref.watch(sharedPreferencesProvider);
    return AppThemePreference.parse(
      prefs.getString(_key) ?? prefs.getString("oriyon_theme"),
    );
  }

  Future<void> setPreference(AppThemePreference value) async {
    await ref.read(sharedPreferencesProvider).setString(_key, value.name);
    state = value;
  }
}

class AuthState {
  const AuthState({this.user, this.token = "", this.loading = true});

  final AuthUser? user;
  final String token;
  final bool loading;

  bool get isLoggedIn => token.isNotEmpty && user != null;
}

final authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);

class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() {
    Future.microtask(restore);
    return const AuthState();
  }

  ApiClient get _api => ref.read(apiClientProvider);

  Future<void> restore() async {
    final token = await _api.readToken();
    if (token == null || token.isEmpty) {
      state = const AuthState(loading: false);
      return;
    }
    try {
      final user = await _api.me();
      state = AuthState(user: user, token: token, loading: false);
      ref.read(chatSocketProvider).connect(token);
    } on ApiException {
      await _api.clearToken();
      state = const AuthState(loading: false);
    } catch (_) {
      state = const AuthState(loading: false);
    }
  }

  Future<void> _apply(AuthSession session) async {
    await _api.saveToken(session.token);
    state = AuthState(user: session.user, token: session.token, loading: false);
    ref.read(chatSocketProvider).connect(session.token);
    ref.invalidate(favoritesListProvider);
    ref.invalidate(unreadCountProvider);
    ref.invalidate(myListingsProvider);
  }

  Future<void> loginEmail(String email, String password) async {
    await _apply(await _api.login(email: email, password: password));
  }

  Future<void> registerEmail({
    required String name,
    required String email,
    required String password,
  }) async {
    await _apply(await _api.register(name: name, email: email, password: password));
  }

  Future<Map<String, dynamic>> sendPhoneCode(String phone, String mode) {
    return _api.sendPhoneCode(phone: phone, mode: mode);
  }

  Future<void> verifyPhone({
    required String phone,
    required String code,
    required String mode,
    String name = "",
  }) async {
    await _apply(await _api.verifyPhoneCode(
      phone: phone,
      code: code,
      mode: mode,
      name: name,
    ));
  }

  Future<void> refreshMe() async {
    if (!state.isLoggedIn) return;
    try {
      final user = await _api.me();
      state = AuthState(user: user, token: state.token, loading: false);
    } catch (_) {}
  }

  Future<void> logout() async {
    ref.read(chatSocketProvider).disconnect();
    await _api.clearToken();
    state = const AuthState(loading: false);
    ref.invalidate(favoritesListProvider);
    ref.invalidate(unreadCountProvider);
    ref.invalidate(myListingsProvider);
  }
}

final favoritesListProvider = FutureProvider<List<Listing>>((ref) async {
  final auth = ref.watch(authControllerProvider);
  if (!auth.isLoggedIn) return [];
  return ref.read(apiClientProvider).favorites();
});

final favoritesIdsProvider = FutureProvider<Set<String>>((ref) async {
  final items = await ref.watch(favoritesListProvider.future);
  return items.map((item) => item.id).toSet();
});

final unreadCountProvider = FutureProvider<int>((ref) async {
  final auth = ref.watch(authControllerProvider);
  if (!auth.isLoggedIn) return 0;
  final items = await ref.read(apiClientProvider).inbox();
  return items.fold<int>(0, (sum, item) => sum + item.unreadCount);
});

final myListingsProvider = FutureProvider<List<Listing>>((ref) async {
  final auth = ref.watch(authControllerProvider);
  if (!auth.isLoggedIn) return [];
  return ref.read(apiClientProvider).myListings();
});

final searchRegionControllerProvider =
    NotifierProvider<SearchRegionController, String>(SearchRegionController.new);

class SearchRegionController extends Notifier<String> {
  static const _key = "diyor_city";

  @override
  String build() {
    final prefs = ref.watch(sharedPreferencesProvider);
    final stored = prefs.getString(_key) ?? prefs.getString("oriyon_city") ?? "";
    if (stored.isEmpty || cities.contains(stored)) return stored;
    return "";
  }

  Future<void> setCity(String city) async {
    final value = city.isEmpty || cities.contains(city) ? city : "";
    await ref.read(sharedPreferencesProvider).setString(_key, value);
    state = value;
  }
}

final chatStarredControllerProvider =
    NotifierProvider<ChatStarredController, Set<String>>(ChatStarredController.new);

class ChatStarredController extends Notifier<Set<String>> {
  static const _key = "diyor_starred_chats";

  @override
  Set<String> build() {
    final prefs = ref.watch(sharedPreferencesProvider);
    final stored = prefs.getStringList(_key) ??
        prefs.getStringList("oriyon_starred_chats") ??
        const [];
    return stored.toSet();
  }

  bool contains(String key) => state.contains(key);

  Future<void> toggle(String key) async {
    final next = {...state};
    if (!next.add(key)) next.remove(key);
    await ref.read(sharedPreferencesProvider).setStringList(_key, next.toList());
    state = next;
  }
}
