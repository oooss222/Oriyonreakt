import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../api/api_exception.dart";
import "../../data/catalog.dart";
import "../../l10n/strings.dart";
import "../../state/providers.dart";
import "../../theme.dart";
import "../../widgets/common.dart";
import "account_widgets.dart";

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final lang = ref.watch(localeControllerProvider);
    final themePref = ref.watch(themeModeControllerProvider);
    final city = ref.watch(searchRegionControllerProvider);
    final user = ref.watch(authControllerProvider).user;

    return Scaffold(
      body: Column(
        children: [
          AccountHeader(title: t.t("profile.settings"), showBack: true),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
              children: [
                AccountGroup(
                  children: [
                    AccountTile(
                      icon: Icons.home_outlined,
                      iconColor: const Color(0xFF5B8DEF),
                      iconBackground: const Color(0xFFE8F0FE),
                      title: t.t("profile.region"),
                      value: city.isEmpty ? t.t("profile.regionAll") : city,
                      onTap: () => _pickCity(context, ref, t),
                    ),
                    AccountTile(
                      icon: Icons.notifications_none_rounded,
                      iconColor: const Color(0xFFE11D48),
                      iconBackground: const Color(0xFFFFE4E6),
                      title: t.t("profile.notifications"),
                      value: t.t("profile.notificationsOn"),
                      onTap: () => _showNotifications(context, t),
                    ),
                    AccountTile(
                      icon: Icons.wb_sunny_outlined,
                      iconColor: const Color(0xFFD97706),
                      iconBackground: const Color(0xFFFEF3C7),
                      title: t.t("profile.appearance"),
                      value: _themeLabel(t, themePref),
                      onTap: () => _pickTheme(context, ref, t, themePref),
                    ),
                    AccountTile(
                      icon: Icons.language_rounded,
                      iconColor: const Color(0xFF7C3AED),
                      iconBackground: const Color(0xFFEDE9FE),
                      title: t.t("profile.languageApp"),
                      value: _langLabel(lang),
                      onTap: () => _pickLanguage(context, ref, t, lang),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                AccountGroup(
                  children: [
                    AccountTile(
                      icon: Icons.description_outlined,
                      iconColor: DiyorColors.lagoon,
                      iconBackground: DiyorColors.lagoon50,
                      title: t.t("profile.terms"),
                      onTap: () => context.push("/profile/policy"),
                    ),
                    AccountTile(
                      icon: Icons.verified_user_outlined,
                      iconColor: const Color(0xFF4F46E5),
                      iconBackground: const Color(0xFFE0E7FF),
                      title: t.t("profile.security"),
                      value: user?.emailVerified == true
                          ? t.t("profile.emailVerified")
                          : t.t("profile.emailUnverified"),
                      onTap: () => _showSecurity(context, t, user?.emailVerified == true),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _themeLabel(AppStrings t, AppThemePreference pref) => switch (pref) {
        AppThemePreference.light => t.t("profile.themeLight"),
        AppThemePreference.dark => t.t("profile.themeDark"),
        AppThemePreference.system => t.t("profile.themeSystem"),
      };

  String _langLabel(String lang) => switch (lang) {
        "tg" => "Тоҷикӣ",
        "en" => "English",
        _ => "Русский",
      };

  Future<void> _pickCity(BuildContext context, WidgetRef ref, AppStrings t) async {
    final selected = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: Text(t.t("profile.regionAll")),
                onTap: () => Navigator.pop(context, ""),
              ),
              for (final city in cities)
                ListTile(title: Text(city), onTap: () => Navigator.pop(context, city)),
            ],
          ),
        );
      },
    );
    if (selected == null) return;
    await ref.read(searchRegionControllerProvider.notifier).setCity(selected);
  }

  Future<void> _pickTheme(
    BuildContext context,
    WidgetRef ref,
    AppStrings t,
    AppThemePreference current,
  ) async {
    final selected = await showModalBottomSheet<AppThemePreference>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (final item in [
                (AppThemePreference.light, Icons.light_mode_outlined, t.t("profile.themeLight")),
                (AppThemePreference.dark, Icons.dark_mode_outlined, t.t("profile.themeDark")),
                (AppThemePreference.system, Icons.brightness_auto_outlined, t.t("profile.themeSystem")),
              ])
                ListTile(
                  leading: Icon(item.$2, color: item.$1 == current ? DiyorColors.sun : null),
                  title: Text(item.$3),
                  trailing: item.$1 == current ? const Icon(Icons.check_rounded, color: DiyorColors.sun) : null,
                  onTap: () => Navigator.pop(context, item.$1),
                ),
            ],
          ),
        );
      },
    );
    if (selected == null) return;
    await ref.read(themeModeControllerProvider.notifier).setPreference(selected);
  }

  Future<void> _pickLanguage(
    BuildContext context,
    WidgetRef ref,
    AppStrings t,
    String current,
  ) async {
    final selected = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (final item in const [
                ("ru", "Русский"),
                ("tg", "Тоҷикӣ"),
                ("en", "English"),
              ])
                ListTile(
                  title: Text(item.$2),
                  trailing: item.$1 == current ? const Icon(Icons.check_rounded, color: DiyorColors.sun) : null,
                  onTap: () => Navigator.pop(context, item.$1),
                ),
            ],
          ),
        );
      },
    );
    if (selected == null) return;
    await ref.read(localeControllerProvider.notifier).setLang(selected);
  }

  Future<void> _showNotifications(BuildContext context, AppStrings t) {
    return showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(t.t("profile.notifications"), style: AppText.h3),
                const SizedBox(height: 10),
                Text(t.t("profile.notificationsHint"), style: AppText.body.copyWith(color: context.diyor.muted)),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _showSecurity(BuildContext context, AppStrings t, bool emailVerified) {
    return showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(t.t("profile.security"), style: AppText.h3),
                const SizedBox(height: 12),
                Text(
                  emailVerified ? t.t("profile.emailVerified") : t.t("profile.emailUnverified"),
                  style: AppText.body.copyWith(
                    color: emailVerified ? DiyorColors.lagoon : context.diyor.muted,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 10),
                Text(t.t("profile.securityTip"), style: AppText.body.copyWith(color: context.diyor.muted)),
              ],
            ),
          ),
        );
      },
    );
  }
}

class PolicyScreen extends ConsumerStatefulWidget {
  const PolicyScreen({super.key});

  @override
  ConsumerState<PolicyScreen> createState() => _PolicyScreenState();
}

class _PolicyScreenState extends ConsumerState<PolicyScreen> {
  int _retry = 0;

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    return Scaffold(
      body: Column(
        children: [
          AccountHeader(title: t.t("profile.terms"), showBack: true),
          Expanded(
            child: FutureBuilder<String>(
              key: ValueKey(_retry),
              future: ref.read(apiClientProvider).sitePolicy(),
              builder: (context, snapshot) {
                if (snapshot.connectionState != ConnectionState.done) {
                  return const AppLoading();
                }
                if (snapshot.hasError) {
                  return ErrorView(
                    message: snapshot.error is ApiException
                        ? (snapshot.error as ApiException).message
                        : t.t("common.error"),
                    onRetry: () => setState(() => _retry++),
                    retryLabel: t.t("common.retry"),
                  );
                }
                final text = (snapshot.data ?? "").trim();
                return ListView(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
                  children: [
                    Text(
                      text.isEmpty ? t.t("common.empty") : text,
                      style: AppText.body.copyWith(height: 1.5),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
