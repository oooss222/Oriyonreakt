import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../api/api_exception.dart";
import "../state/providers.dart";

Future<void> toggleListingFavorite({
  required BuildContext context,
  required WidgetRef ref,
  required String listingId,
  required bool isFavorite,
}) async {
  final auth = ref.read(authControllerProvider);
  if (!auth.isLoggedIn) {
    context.push("/auth");
    return;
  }
  final api = ref.read(apiClientProvider);
  final t = ref.read(stringsProvider);
  try {
    HapticFeedback.lightImpact();
    if (isFavorite) {
      await api.removeFavorite(listingId);
    } else {
      await api.addFavorite(listingId);
    }
    ref.invalidate(favoritesListProvider);
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(t.t(isFavorite ? "favorites.removed" : "favorites.added"))),
      );
    }
  } on ApiException catch (error) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
    }
  }
}
