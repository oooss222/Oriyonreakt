import "package:cached_network_image/cached_network_image.dart";
import "package:flutter/material.dart";
import "package:go_router/go_router.dart";

import "../data/catalog.dart";
import "../l10n/strings.dart";
import "../models/listing.dart";
import "../theme.dart";
import "../utils/format.dart";
import "../utils/media.dart";
import "motion.dart";
import "ui.dart";

class PromotionBadge extends StatelessWidget {
  const PromotionBadge({super.key, required this.vip, required this.top, this.compact = true});

  final bool vip;
  final bool top;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    if (!vip && !top) return const SizedBox.shrink();
    return Wrap(
      spacing: 6,
      children: [
        if (vip)
          _Pill(
            label: "VIP",
            foreground: DiyorColors.sun800,
            background: const Color(0xFFFFC799),
            icon: Icons.workspace_premium_rounded,
            compact: compact,
          ),
        if (top)
          _Pill(
            label: "TOP",
            foreground: Colors.white,
            background: DiyorColors.lagoon,
            icon: Icons.trending_up_rounded,
            compact: compact,
          ),
      ],
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({
    required this.label,
    required this.foreground,
    required this.background,
    required this.icon,
    required this.compact,
  });

  final String label;
  final Color foreground;
  final Color background;
  final IconData icon;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: compact ? 7 : 10, vertical: compact ? 3 : 5),
      decoration: BoxDecoration(
        color: background,
        borderRadius: AppRadii.pill,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: compact ? 11 : 14, color: foreground),
          const SizedBox(width: 3),
          Text(
            label,
            style: TextStyle(
              color: foreground,
              fontSize: compact ? 10 : 12,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}

class ListingCard extends StatelessWidget {
  const ListingCard({
    super.key,
    required this.item,
    this.horizontal = false,
    this.featured = false,
    this.onFavorite,
    this.isFavorite = false,
    this.strings,
    this.heroTag,
    this.animateEntrance = false,
  });

  final Listing item;
  final bool horizontal;
  final bool featured;
  final VoidCallback? onFavorite;
  final bool isFavorite;
  final AppStrings? strings;
  final String? heroTag;
  final bool animateEntrance;

  @override
  Widget build(BuildContext context) {
    if (featured) {
      final card = FeaturedListingCard(
        item: item,
        onFavorite: onFavorite,
        isFavorite: isFavorite,
        strings: strings,
        heroTag: heroTag,
      );
      if (!animateEntrance) return card;
      return AppAppear(child: card);
    }
    final t = strings;
    final image = resolveMediaUrl(item.thumb, width: 600);
    final title = item.title.isEmpty ? (t?.t("listing.noTitle") ?? "Без названия") : item.title;
    final location = item.location.isEmpty ? (t?.t("listing.noLocation") ?? "Город не указан") : item.location;
    final price = formatPrice(item.price, empty: t?.t("listing.noPrice") ?? "Цена не указана");
    final time = item.createdAt == null
        ? ""
        : timeAgo(item.createdAt, t: (key) => t?.t(key) ?? key);

    final media = AspectRatio(
      aspectRatio: 4 / 3,
      child: Stack(
        fit: StackFit.expand,
        children: [
          ColoredBox(
            color: context.diyor.placeholder,
            child: image.isEmpty
                ? Icon(Icons.image_outlined, color: context.diyor.muted)
                : _ListingImage(url: image, heroTag: heroTag),
          ),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0x33000000), Colors.transparent, Color(0x26000000)],
                stops: [0, 0.35, 1],
              ),
            ),
          ),
          if (item.vip || item.top)
            Positioned(
              left: 8,
              top: 8,
              child: PromotionBadge(vip: item.vip, top: item.top),
            ),
          if (onFavorite != null)
            Positioned(
              right: 6,
              top: 6,
              child: Material(
                color: Colors.white.withValues(alpha: 0.94),
                shape: const CircleBorder(),
                elevation: 1,
                child: InkWell(
                  customBorder: const CircleBorder(),
                  onTap: onFavorite,
                  child: SizedBox(
                    width: 40,
                    height: 40,
                    child: FavoriteHeart(active: isFavorite),
                  ),
                ),
              ),
            ),
          if (item.imageUrls.length > 1)
            Positioned(
              right: 8,
              bottom: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.55),
                  borderRadius: AppRadii.pill,
                ),
                child: Text(
                  "${item.imageUrls.length}",
                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700),
                ),
              ),
            ),
        ],
      ),
    );

    final body = Padding(
      padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: context.diyor.chip,
              borderRadius: AppRadii.pill,
            ),
            child: Text(
              location,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: context.diyor.muted,
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 13,
              height: 1.25,
              color: context.diyor.ink,
            ),
          ),
          const Spacer(),
          Row(
            children: [
              Expanded(
                child: Text(
                  price,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.price.copyWith(fontSize: 14),
                ),
              ),
              if (time.isNotEmpty)
                Text(time, style: TextStyle(color: context.diyor.muted, fontSize: 11, fontWeight: FontWeight.w600)),
            ],
          ),
        ],
      ),
    );

    final child = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        media,
        Expanded(child: body),
      ],
    );

    final card = AppPressable(
      onTap: () => context.push("/ad/${item.id}"),
      child: AppCard(
        vip: item.vip,
        top: item.top && !item.vip,
        child: horizontal ? SizedBox(width: 168, height: 248, child: child) : SizedBox.expand(child: child),
      ),
    );
    if (!animateEntrance) return card;
    return AppAppear(child: card);
  }
}

class _ListingImage extends StatelessWidget {
  const _ListingImage({required this.url, this.heroTag});

  final String url;
  final String? heroTag;

  @override
  Widget build(BuildContext context) {
    final image = CachedNetworkImage(
      imageUrl: url,
      fit: BoxFit.cover,
      errorWidget: (_, _, _) => const Icon(Icons.broken_image_outlined),
    );
    if (heroTag == null || heroTag!.isEmpty) return image;
    return Hero(tag: heroTag!, child: image);
  }
}

class FeaturedListingCard extends StatelessWidget {
  const FeaturedListingCard({
    super.key,
    required this.item,
    this.onFavorite,
    this.isFavorite = false,
    this.strings,
    this.heroTag,
  });

  final Listing item;
  final VoidCallback? onFavorite;
  final bool isFavorite;
  final AppStrings? strings;
  final String? heroTag;

  @override
  Widget build(BuildContext context) {
    final t = strings;
    final image = resolveMediaUrl(item.thumb, width: 900);
    final title = item.title.isEmpty ? (t?.t("listing.noTitle") ?? "Без названия") : item.title;
    final location = item.location.isEmpty ? (t?.t("listing.noLocation") ?? "Город не указан") : item.location;
    final price = formatPrice(item.price, empty: t?.t("listing.noPrice") ?? "Цена не указана");

    return AppPressable(
      onTap: () => context.push("/ad/${item.id}"),
      borderRadius: BorderRadius.circular(20),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: context.diyor.surface,
          borderRadius: BorderRadius.circular(20),
          boxShadow: AppShadows.soft,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              child: AspectRatio(
                aspectRatio: 16 / 10,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    ColoredBox(
                      color: context.diyor.placeholder,
                      child: image.isEmpty
                          ? Icon(Icons.image_outlined, color: context.diyor.muted, size: 40)
                          : _ListingImage(url: image, heroTag: heroTag),
                    ),
                    if (item.vip || item.top)
                      Positioned(
                        left: 10,
                        top: 10,
                        child: PromotionBadge(vip: item.vip, top: item.top),
                      ),
                    if (onFavorite != null)
                      Positioned(
                        right: 8,
                        top: 8,
                        child: Material(
                          color: Colors.white.withValues(alpha: 0.94),
                          shape: const CircleBorder(),
                          elevation: 1,
                          child: InkWell(
                            customBorder: const CircleBorder(),
                            onTap: onFavorite,
                            child: SizedBox(
                              width: 40,
                              height: 40,
                              child: FavoriteHeart(active: isFavorite),
                            ),
                          ),
                        ),
                      ),
                    if (item.imageUrls.length > 1)
                      Positioned(
                        right: 10,
                        bottom: 10,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.55),
                            borderRadius: AppRadii.pill,
                          ),
                          child: Text(
                            "${item.imageUrls.length}",
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    price,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: context.diyor.ink,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      height: 1.15,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: context.diyor.muted,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    location,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: context.diyor.muted.withValues(alpha: 0.85),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class CategoryTile extends StatelessWidget {
  const CategoryTile({
    super.key,
    required this.category,
    this.onTap,
    this.showcase = false,
    this.label,
  });

  final CategoryInfo category;
  final VoidCallback? onTap;
  final bool showcase;
  final String? label;

  @override
  Widget build(BuildContext context) {
    final image = resolveMediaUrl(categoryImagePath(category.slug), width: showcase ? 420 : 240);
    final caption = (label ?? category.shortTitle).trim();
    final radius = BorderRadius.circular(showcase ? 16 : AppRadii.md);
    final fallbackColor = showcase ? context.diyor.placeholder : DiyorColors.ink600;
    final fallbackIconColor = showcase ? context.diyor.muted : Colors.white;

    final media = ClipRRect(
      borderRadius: radius,
      child: SizedBox(
        width: showcase ? double.infinity : 84,
        height: showcase ? 78 : 64,
        child: Stack(
          fit: StackFit.expand,
          children: [
            ColoredBox(color: fallbackColor),
            CachedNetworkImage(
              imageUrl: image,
              fit: BoxFit.cover,
              errorWidget: (_, _, _) => ColoredBox(
                color: fallbackColor,
                child: Icon(_iconFor(category.slug), color: fallbackIconColor, size: showcase ? 30 : 28),
              ),
            ),
            if (!showcase)
              const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Color(0x99000000)],
                  ),
                ),
              ),
          ],
        ),
      ),
    );

    return AppPressable(
      onTap: onTap,
      borderRadius: radius,
      child: SizedBox(
        width: showcase ? double.infinity : 84,
        child: Column(
          crossAxisAlignment: showcase ? CrossAxisAlignment.stretch : CrossAxisAlignment.center,
          children: [
            media,
            SizedBox(height: showcase ? 8 : 6),
            Text(
              caption,
              maxLines: 2,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: showcase ? 12 : 11,
                fontWeight: FontWeight.w700,
                height: 1.15,
                color: context.diyor.ink,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

IconData _iconFor(String slug) {
  return switch (slug) {
    "realestate" => Icons.apartment_outlined,
    "transport" => Icons.directions_car_outlined,
    "furniture" => Icons.chair_outlined,
    "phones" => Icons.smartphone_outlined,
    "electronics" => Icons.kitchen_outlined,
    "computers" => Icons.laptop_outlined,
    "services" => Icons.handyman_outlined,
    "food" => Icons.restaurant_outlined,
    "kids" => Icons.child_care_outlined,
    "travel" => Icons.flight_outlined,
    "clothing" => Icons.checkroom_outlined,
    "construction" => Icons.construction_outlined,
    "business" => Icons.storefront_outlined,
    _ => Icons.grid_view_outlined,
  };
}
