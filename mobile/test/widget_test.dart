import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:flutter_test/flutter_test.dart";
import "package:diyor_mobile/data/catalog.dart";
import "package:diyor_mobile/data/spec_templates.dart";
import "package:diyor_mobile/features/catalog/catalog_filter_sheet.dart";
import "package:diyor_mobile/features/add/add_listing_screen.dart";
import "package:diyor_mobile/features/chat/inbox_screen.dart";
import "package:diyor_mobile/features/favorites/favorites_screen.dart";
import "package:diyor_mobile/features/profile/profile_screen.dart";
import "package:diyor_mobile/features/profile/settings_screen.dart";
import "package:shared_preferences/shared_preferences.dart";
import "package:diyor_mobile/l10n/strings.dart";
import "package:diyor_mobile/models/listing.dart";
import "package:diyor_mobile/models/user.dart";
import "package:diyor_mobile/state/providers.dart";
import "package:diyor_mobile/theme.dart";
import "package:diyor_mobile/utils/format.dart";
import "package:diyor_mobile/utils/phone.dart";
import "package:diyor_mobile/widgets/motion_nav_bar.dart";

void main() {
  test("formats Tajik phone numbers for the API", () {
    expect(phoneDigitsToApi("901234567"), "+992901234567");
    expect(isValidPhoneDigits("901234567"), isTrue);
    expect(isValidPhoneDigits("123"), isFalse);
    expect(formatPhonePretty("+992006556679"), "+992 00 655 66 79");
  });

  test("localizes core strings", () {
    expect(AppStrings("ru").t("nav.home"), "Главная");
    expect(AppStrings("en").t("nav.home"), "Home");
    expect(AppStrings("tg").t("nav.home"), "Асосӣ");
    expect(AppStrings("ru").t("profile.themeLight"), "Светлая");
    expect(AppStrings("en").t("profile.themeSystem"), "System");
    expect(AppStrings("tg").t("profile.themeDark"), "Торик");
    expect(AppStrings("ru").t("home.popularNow"), "Популярное сейчас");
    expect(AppStrings("ru").t("listing.filters"), "Фильтры");
    expect(AppStrings("ru").t("filter.condition"), "Состояние");
    expect(AppStrings("en").t("home.listingsCount", {"count": "12"}), "12 listings");
    expect(AppStrings("ru").t("chat.title"), "Чаты");
    expect(AppStrings("ru").t("chat.filterUnread"), "Непрочитанные");
  });

  test("formats listing counts", () {
    expect(formatCount(201920).replaceAll("\u00A0", " "), "201 920");
  });

  test("formats inbox timestamps", () {
    final now = DateTime.now();
    final yesterday = DateTime(now.year, now.month, now.day).subtract(const Duration(hours: 6));
    expect(formatInboxTime(now, t: (key) => key == "time.yesterday" ? "вчера" : key), matches(RegExp(r"^\d{2}:\d{2}$")));
    expect(
      formatInboxTime(yesterday, t: (key) => key == "time.yesterday" ? "вчера" : key),
      "вчера",
    );
  });

  test("formats prices", () {
    expect(formatPrice("1500"), contains("TJS"));
    expect(formatPrice(""), "Цена не указана");
  });

  test("add listing spec templates follow category and subcategory", () {
    final phones = specTemplateFor("phones", "Смартфоны");
    expect(phones.map((item) => item.name), containsAll(["Производитель", "Модель", "Память"]));
    expect(
      specTemplateFor("realestate", "Участки").firstWhere((item) => item.name == "Тип сделки").options,
      ["Купить", "Снять"],
    );
    expect(
      specTemplateFor("realestate", "Квартиры").firstWhere((item) => item.name == "Тип сделки").options,
      contains("Посуточно"),
    );
    expect(specTemplateFor("phones", "Мобильные аксессуары").map((item) => item.name), isNot(contains("Память")));
    expect(specTemplateFor("realestate", "Квартиры").map((item) => item.name), contains("Тип сделки"));
    expect(specTemplateFor("food", "Выпечка и десерты").map((item) => item.name), contains("Формат"));
    expect(specTemplateFor("unknown"), isEmpty);
    final drafts = draftsFromTemplate("phones", "Смартфоны", [(name: "Память", value: "128 GB")]);
    expect(compactSpecs(drafts), [
      {"name": "Память", "value": "128 GB"},
    ]);
  });

  test("catalog filters follow the opened category", () {
    expect(const CatalogFilterDraft().extraCount, 0);
    expect(
      const CatalogFilterDraft(
        cat: "phones",
        city: "Душанбе",
        specs: {"Состояние": "Новый"},
      ).extraCount,
      2,
    );
    expect(
      catalogSpecFilters("phones").map((item) => item.name),
      containsAll(["Производитель", "Модель", "Память", "Состояние"]),
    );
    expect(
      catalogSpecFilters("transport").map((item) => item.name),
      containsAll(["Марка", "Модель"]),
    );
    expect(catalogSpecFilters("food").map((item) => item.name), isNot(contains("Марка")));
    expect(
      catalogSpecFilters("phones", "Мобильные аксессуары").map((item) => item.name),
      contains("Тип аксессуара"),
    );
    expect(
      catalogSpecFilters("phones", "Мобильные аксессуары").map((item) => item.name),
      isNot(contains("Память")),
    );
    expect(
      catalogSpecFilters("transport", "Шины и диски").map((item) => item.name),
      isNot(contains("КПП")),
    );
    expect(
      catalogSpecFilters("realestate", "Участки").map((item) => item.name),
      isNot(contains("Комнат")),
    );
    expect(
      catalogSpecFilters("realestate", "Квартиры", {"Тип сделки": "Купить"}).map((item) => item.name),
      isNot(contains("Гостей")),
    );
    expect(
      catalogSpecFilters("realestate", "Квартиры", {"Тип сделки": "Посуточно"}).map((item) => item.name),
      contains("Гостей"),
    );
    expect(pruneListingSpecs("realestate", "Участки", {"Тип сделки": "Посуточно"}), isNot(contains("Тип сделки")));
    expect(realEstateSubFitsDeal("Участки", "Посуточно"), isFalse);
    expect(filterBrowseSubs("realestate", ["Квартиры", "Участки"], {"Тип сделки": "Посуточно"}), ["Квартиры"]);
    expect(hiddenConditionCats, containsAll(["food", "business", "travel"]));
  });

  test("category browse filters use groups inside lifestyle cats", () {
    expect(categoryBrowseSubs("food"), contains("Выпечка и десерты"));
    expect(categoryBrowseSubs("food").any((item) => item.contains(" — ")), isFalse);
    expect(categoryBrowseSubs("realestate"), contains("Квартиры"));
    expect(categoryBrowseSubs("transport"), contains("Легковые авто"));
    expect(categoryBrowseSubs("kids"), contains("Для мальчиков"));
    expect(homeFeedCategories.length, greaterThan(6));
    expect(homeFeedCategories.map((item) => item.slug).toSet().length, homeFeedCategories.length);
    expect(homeFeedCategories.take(6).map((item) => item.slug).toList(), homeShowcaseSlugs);
  });

  testWidgets("motion nav reports the tapped tab", (tester) async {
    var index = 0;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: StatefulBuilder(
            builder: (context, setState) {
              return DiyorMotionNavBar(
                index: index,
                onChanged: (next) => setState(() => index = next),
                items: const [
                  MotionNavItem(
                    icon: Icons.home_outlined,
                    selectedIcon: Icons.home_rounded,
                    label: "Главная",
                  ),
                  MotionNavItem(
                    icon: Icons.favorite_border_rounded,
                    selectedIcon: Icons.favorite_rounded,
                    label: "Избранное",
                  ),
                  MotionNavItem(
                    icon: Icons.person_outline_rounded,
                    selectedIcon: Icons.person_rounded,
                    label: "Профиль",
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );

    expect(find.byIcon(Icons.home_rounded), findsOneWidget);
    await tester.tap(find.byIcon(Icons.person_outline_rounded));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 320));
    expect(find.byIcon(Icons.person_rounded), findsOneWidget);
  });

  testWidgets("profile shows account cards when logged in", (tester) async {
    tester.view.physicalSize = const Size(400, 1400);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authControllerProvider.overrideWith(_LoggedInAuth.new),
          localeControllerProvider.overrideWith(_FixedLocale.new),
          themeModeControllerProvider.overrideWith(_FixedTheme.new),
          myListingsProvider.overrideWith((ref) async => <Listing>[]),
          favoritesListProvider.overrideWith((ref) async => <Listing>[]),
          unreadCountProvider.overrideWith((ref) async => 0),
        ],
        child: const MaterialApp(home: ProfileScreen()),
      ),
    );
    await tester.pump();

    expect(tester.takeException(), isNull);
    expect(find.text("Josef"), findsOneWidget);
    expect(find.text("Ҳисоби ман"), findsOneWidget);
    expect(find.text("Ҳисоби Diyor"), findsOneWidget);
    expect(find.text("Баромадан"), findsOneWidget);
    expect(find.text("Мои объявления"), findsOneWidget);
    expect(find.text("Частное лицо"), findsOneWidget);
  });

  testWidgets("settings lists region theme and language", (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
          authControllerProvider.overrideWith(_LoggedInAuth.new),
          localeControllerProvider.overrideWith(_FixedLocale.new),
          themeModeControllerProvider.overrideWith(_FixedTheme.new),
        ],
        child: const MaterialApp(home: SettingsScreen()),
      ),
    );

    expect(tester.takeException(), isNull);
    expect(find.text("Танзимот"), findsOneWidget);
    expect(find.text("Замина"), findsOneWidget);
    expect(find.text("Забони барнома"), findsOneWidget);
    expect(find.text("Минтақаи ҷустуҷӯ"), findsOneWidget);
    expect(find.text("Система"), findsOneWidget);
  });

  testWidgets("favorites tab renders empty state", (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authControllerProvider.overrideWith(_LoggedInAuth.new),
          localeControllerProvider.overrideWith(_FixedLocale.new),
          favoritesListProvider.overrideWith((ref) async => <Listing>[]),
        ],
        child: const MaterialApp(home: FavoritesScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.text("Интихобшуда"), findsOneWidget);
    expect(find.text("Здесь появятся сохранённые объявления"), findsOneWidget);
  });

  testWidgets("inbox shows chats header and login gate", (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authControllerProvider.overrideWith(_GuestAuth.new),
          localeControllerProvider.overrideWith(_FixedRu.new),
        ],
        child: const MaterialApp(home: InboxScreen()),
      ),
    );
    await tester.pump();

    expect(tester.takeException(), isNull);
    expect(find.text("Чаты"), findsOneWidget);
    expect(find.text("Поиск по чатам..."), findsOneWidget);
    expect(find.text("Войти"), findsOneWidget);
  });

  testWidgets("add listing form renders", (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authControllerProvider.overrideWith(_LoggedInAuth.new),
          localeControllerProvider.overrideWith(_FixedLocale.new),
        ],
        child: const MaterialApp(home: AddListingScreen()),
      ),
    );
    await tester.pump();

    expect(tester.takeException(), isNull);
    expect(find.byType(DropdownButtonFormField<String>), findsWidgets);
    expect(find.text("Хусусиятҳо", skipOffstage: false), findsOneWidget);
    expect(find.text("Производитель", skipOffstage: false), findsOneWidget);
    expect(find.text("Память", skipOffstage: false), findsOneWidget);
  });
}

class _LoggedInAuth extends AuthController {
  @override
  AuthState build() {
    return const AuthState(
      loading: false,
      token: "test-token",
      user: AuthUser(
        id: "1",
        name: "Josef",
        email: "josef@test.com",
        phone: "+992900000000",
      ),
    );
  }
}

class _GuestAuth extends AuthController {
  @override
  AuthState build() => const AuthState(loading: false);
}

class _FixedRu extends LocaleController {
  @override
  String build() => "ru";
}

class _FixedLocale extends LocaleController {
  @override
  String build() => "tg";
}

class _FixedTheme extends ThemeModeController {
  @override
  AppThemePreference build() => AppThemePreference.system;
}
