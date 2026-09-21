import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "features/add/add_listing_screen.dart";
import "features/auth/auth_screen.dart";
import "features/catalog/catalog_screen.dart";
import "features/chat/inbox_screen.dart";
import "features/chat/thread_screen.dart";
import "features/favorites/favorites_screen.dart";
import "features/home/home_screen.dart";
import "features/listing/listing_detail_screen.dart";
import "features/profile/profile_screen.dart";
import "features/profile/settings_screen.dart";
import "features/shell/app_shell.dart";
import "features/wallet/wallet_screen.dart";
import "theme.dart";
import "utils/nav.dart";

final _rootKey = GlobalKey<NavigatorState>();

GoRouter createRouter() {
  return GoRouter(
    navigatorKey: _rootKey,
    initialLocation: "/home",
    redirect: (context, state) {
      if (state.uri.path == "/") return "/home";
      return null;
    },
    errorBuilder: (context, state) => Scaffold(
      appBar: AppBar(),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(state.error?.toString() ?? "Страница не найдена"),
        ),
      ),
    ),
    routes: [
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(path: "/home", builder: (context, state) => const HomeScreen()),
          GoRoute(path: "/favorites", builder: (context, state) => const FavoritesScreen()),
          GoRoute(path: "/add", builder: (context, state) => const AddListingScreen()),
          GoRoute(
            path: "/messages",
            builder: (context, state) => const InboxScreen(),
            routes: [
              GoRoute(
                path: "thread/:listingId/:peerId",
                parentNavigatorKey: _rootKey,
                pageBuilder: (context, state) => appFadeSlidePage(
                  key: state.pageKey,
                  child: ChatThreadScreen(
                    listingId: state.pathParameters["listingId"]!,
                    peerId: state.pathParameters["peerId"]!,
                    title: state.uri.queryParameters["title"] ?? "",
                  ),
                ),
              ),
            ],
          ),
          GoRoute(path: "/profile", builder: (context, state) => const ProfileScreen()),
          GoRoute(
            path: "/catalog",
            pageBuilder: (context, state) => appFadeSlidePage(
              key: state.pageKey,
              child: CatalogScreen(
                initialCat: state.uri.queryParameters["cat"] ?? "",
                initialQuery: state.uri.queryParameters["q"] ?? state.uri.queryParameters["search"] ?? "",
                initialSubcategory: state.uri.queryParameters["subcategory"] ?? "",
              ),
            ),
          ),
        ],
      ),
      GoRoute(
        path: "/auth",
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => appFadeSlidePage(
          key: state.pageKey,
          child: const AuthScreen(),
        ),
      ),
      GoRoute(
        path: "/ad/:id",
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => appFadeSlidePage(
          key: state.pageKey,
          child: ListingDetailScreen(id: state.pathParameters["id"]!),
        ),
      ),
      GoRoute(
        path: "/seller/:id",
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => appFadeSlidePage(
          key: state.pageKey,
          child: SellerScreen(id: state.pathParameters["id"]!),
        ),
      ),
      GoRoute(
        path: "/chat/:listingId/:peerId",
        redirect: (context, state) => listingThreadLocation(
          listingId: state.pathParameters["listingId"]!,
          peerId: state.pathParameters["peerId"]!,
          title: state.uri.queryParameters["title"] ?? "",
        ),
      ),
      GoRoute(
        path: "/edit/:id",
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => appFadeSlidePage(
          key: state.pageKey,
          child: AddListingScreen(editId: state.pathParameters["id"]),
        ),
      ),
      GoRoute(
        path: "/my-listings",
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => appFadeSlidePage(
          key: state.pageKey,
          child: const MyListingsScreen(),
        ),
      ),
      GoRoute(
        path: "/profile/edit",
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => appFadeSlidePage(
          key: state.pageKey,
          child: const EditProfileScreen(),
        ),
      ),
      GoRoute(
        path: "/profile/settings",
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => appFadeSlidePage(
          key: state.pageKey,
          child: const SettingsScreen(),
        ),
      ),
      GoRoute(
        path: "/profile/policy",
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => appFadeSlidePage(
          key: state.pageKey,
          child: const PolicyScreen(),
        ),
      ),
      GoRoute(
        path: "/wallet",
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => appFadeSlidePage(
          key: state.pageKey,
          child: const WalletScreen(),
        ),
      ),
      GoRoute(
        path: "/wallet/checkout",
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) {
          final extra = state.extra is Map ? Map<String, dynamic>.from(state.extra as Map) : const {};
          return appFadeSlidePage(
            key: state.pageKey,
            child: CheckoutScreen(
              url: "${extra["url"] ?? ""}",
              orderId: "${extra["orderId"] ?? ""}",
            ),
          );
        },
      ),
    ],
  );
}

final routerProvider = Provider<GoRouter>((ref) => createRouter());
