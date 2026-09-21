import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:intl/date_symbol_data_local.dart";
import "package:shared_preferences/shared_preferences.dart";

import "router.dart";
import "state/providers.dart";
import "theme.dart";

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting("ru");
  final prefs = await SharedPreferences.getInstance();
  runApp(
    ProviderScope(
      overrides: [
        sharedPreferencesProvider.overrideWithValue(prefs),
      ],
      child: const DiyorApp(),
    ),
  );
}

class DiyorApp extends ConsumerWidget {
  const DiyorApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeControllerProvider).themeMode;
    return MaterialApp.router(
      title: "Diyor.tj",
      debugShowCheckedModeBanner: false,
      theme: buildDiyorTheme(Brightness.light),
      darkTheme: buildDiyorTheme(Brightness.dark),
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
