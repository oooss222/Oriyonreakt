import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../api/api_exception.dart";
import "../../state/providers.dart";
import "../../theme.dart";
import "../../widgets/common.dart";
import "../../widgets/favorite.dart";

class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final auth = ref.watch(authControllerProvider);
    if (!auth.isLoggedIn) {
      return Scaffold(
        appBar: AppBar(title: Text(t.t("favorites.title"))),
        body: LoginGate(message: t.t("auth.needLogin"), actionLabel: t.t("nav.login")),
      );
    }

    final asyncFavs = ref.watch(favoritesListProvider);
    final items = asyncFavs.valueOrNull ?? [];

    return Scaffold(
      appBar: AppBar(title: Text(t.t("favorites.title"))),
      body: asyncFavs.isLoading && items.isEmpty
          ? ListingSkeleton(count: 6)
          : asyncFavs.hasError && items.isEmpty
              ? ErrorView(
                  message: asyncFavs.error is ApiException
                      ? (asyncFavs.error as ApiException).message
                      : t.t("common.error"),
                  onRetry: () => ref.invalidate(favoritesListProvider),
                  retryLabel: t.t("common.retry"),
                )
              : items.isEmpty
                  ? EmptyView(
                      message: t.t("favorites.empty"),
                      icon: Icons.favorite_border,
                      actionLabel: t.t("nav.catalog"),
                      onAction: () => context.push("/catalog"),
                    )
                  : GridView.builder(
                      padding: EdgeInsets.fromLTRB(12, 12, 12, AppSpace.belowNav(context)),
                      gridDelegate: ListingGridDelegate.of(context),
                      itemCount: items.length,
                      itemBuilder: (context, index) {
                        final item = items[index];
                        return ListingCard(
                          item: item,
                          strings: t,
                          animateEntrance: true,
                          heroTag: "listing-hero-${item.id}",
                          isFavorite: true,
                          onFavorite: () => toggleListingFavorite(
                            context: context,
                            ref: ref,
                            listingId: item.id,
                            isFavorite: true,
                          ),
                        );
                      },
                    ),
    );
  }
}
