import "package:cached_network_image/cached_network_image.dart";
import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "package:photo_view/photo_view.dart";
import "package:photo_view/photo_view_gallery.dart";
import "package:url_launcher/url_launcher.dart";

import "../../api/api_exception.dart";
import "../../l10n/strings.dart";
import "../../config.dart";
import "../../data/catalog.dart";
import "../../data/report_reasons.dart";
import "../../models/listing.dart";
import "../../state/providers.dart";
import "../../theme.dart";
import "../../utils/format.dart";
import "../../utils/media.dart";
import "../../utils/nav.dart";
import "../../widgets/common.dart";
import "../../widgets/favorite.dart";

class ListingDetailScreen extends ConsumerStatefulWidget {
  const ListingDetailScreen({super.key, required this.id});

  final String id;

  @override
  ConsumerState<ListingDetailScreen> createState() => _ListingDetailScreenState();
}

class _ListingDetailScreenState extends ConsumerState<ListingDetailScreen> {
  Listing? _ad;
  List<Listing> _similar = const [];
  String? _error;
  bool _loading = true;
  bool _phoneVisible = false;
  int _imageIndex = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = ref.read(apiClientProvider);
      final ad = await api.listingById(widget.id);
      setState(() {
        _ad = ad;
        _loading = false;
      });
      api.recordListingView(widget.id);
      if (ad.cat.isNotEmpty) {
        final similar = await api.listings(cat: ad.cat, limit: 8, sort: "new");
        if (mounted) {
          setState(() => _similar = similar.where((item) => item.id != ad.id).take(8).toList());
        }
      }
    } on ApiException catch (error) {
      setState(() {
        _error = error.message;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    final auth = ref.watch(authControllerProvider);
    final favs = ref.watch(favoritesIdsProvider).valueOrNull ?? {};
    final ad = _ad;

    if (_loading) {
      return Scaffold(
        appBar: AppBar(),
        body: const AppLoading(),
      );
    }
    if (_error != null || ad == null) {
      return Scaffold(
        appBar: AppBar(),
        body: ErrorView(message: _error ?? t.t("common.error"), onRetry: _load, retryLabel: t.t("common.retry")),
      );
    }

    final images = ad.imageUrls.map((url) => resolveMediaUrl(url, width: 1200)).where((url) => url.isNotEmpty).toList();
    final isOwner = auth.user?.id == ad.ownerId;
    final isFav = favs.contains(ad.id);
    final sellerName = ad.displaySellerName.isEmpty ? t.t("listing.seller") : ad.displaySellerName;

    return Scaffold(
      appBar: AppBar(
        title: Text(ad.title.isEmpty ? t.t("listing.noTitle") : ad.title, maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [
          IconButton(
            tooltip: t.t("nav.favorites"),
            onPressed: () => toggleListingFavorite(
              context: context,
              ref: ref,
              listingId: ad.id,
              isFavorite: isFav,
            ),
            icon: FavoriteHeart(
              active: isFav,
              size: 22,
              inactiveColor: Colors.white,
            ),
          ),
          IconButton(
            tooltip: t.t("listing.share"),
            onPressed: () async {
              await Clipboard.setData(ClipboardData(text: "${AppConfig.siteOrigin}/ad/${ad.id}"));
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t.t("listing.share"))));
              }
            },
            icon: const Icon(Icons.ios_share_outlined),
          ),
          if (auth.isLoggedIn && !isOwner)
            IconButton(
              onPressed: () => _report(ad.id),
              icon: const Icon(Icons.flag_outlined),
            ),
        ],
      ),
      body: AppAppear(
        child: ListView(
        children: [
          if (images.isEmpty)
            AspectRatio(
              aspectRatio: 4 / 3,
              child: ColoredBox(
                color: context.diyor.placeholder,
                child: Icon(Icons.image_outlined, size: 48, color: context.diyor.muted),
              ),
            )
          else
            AspectRatio(
              aspectRatio: 4 / 3,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  PageView.builder(
                    itemCount: images.length,
                    onPageChanged: (index) => setState(() => _imageIndex = index),
                    itemBuilder: (context, index) {
                      return GestureDetector(
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => _GalleryPage(images: images, index: index),
                          ),
                        ),
                        child: ColoredBox(
                          color: context.diyor.placeholder,
                          child: index == 0
                              ? Hero(
                                  tag: "listing-hero-${ad.id}",
                                  child: CachedNetworkImage(imageUrl: images[index], fit: BoxFit.contain),
                                )
                              : CachedNetworkImage(imageUrl: images[index], fit: BoxFit.contain),
                        ),
                      );
                    },
                  ),
                  if (ad.vip || ad.top)
                    Positioned(
                      left: 12,
                      top: 12,
                      child: PromotionBadge(vip: ad.vip, top: ad.top, compact: false),
                    ),
                  if (images.length > 1)
                    Positioned(
                      right: 12,
                      bottom: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: DiyorColors.ink.withValues(alpha: 0.7),
                          borderRadius: AppRadii.pill,
                        ),
                        child: Text(
                          "${_imageIndex + 1} / ${images.length}",
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  formatPrice(ad.price, empty: t.t("listing.noPrice")),
                  style: AppText.priceLg,
                ),
                const SizedBox(height: 8),
                Text(ad.title, style: AppText.h1),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _MetaChip(icon: Icons.place_outlined, label: ad.location.isEmpty ? t.t("listing.noLocation") : ad.location),
                    _MetaChip(icon: Icons.category_outlined, label: categoryTitle(ad.cat)),
                    if (ad.subcategory.isNotEmpty) _MetaChip(icon: Icons.label_outline, label: ad.subcategory),
                    _MetaChip(icon: Icons.visibility_outlined, label: t.t("listing.views", {"count": "${ad.views}"})),
                    if (ad.createdAt != null)
                      _MetaChip(icon: Icons.schedule, label: timeAgo(ad.createdAt, t: (key) => t.t(key))),
                  ],
                ),
                const SizedBox(height: 20),
                if (ad.specs.any((spec) => spec.value.trim().isNotEmpty)) ...[
                  Text(t.t("listing.specs"), style: AppText.h2),
                  const SizedBox(height: 8),
                  AppCard(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Column(
                      children: [
                        for (final spec in ad.specs.where((spec) => spec.value.trim().isNotEmpty))
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Row(
                              children: [
                                Expanded(child: Text(spec.name, style: AppText.bodySmall)),
                                Expanded(
                                  child: Text(spec.value, textAlign: TextAlign.right, style: AppText.body.copyWith(fontWeight: FontWeight.w700)),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                if (ad.description.trim().isNotEmpty) ...[
                  Text(t.t("listing.description"), style: AppText.h2),
                  const SizedBox(height: 8),
                  Text(ad.description, style: AppText.body.copyWith(height: 1.5)),
                  const SizedBox(height: 16),
                ],
                AppCard(
                  onTap: ad.ownerId.isEmpty ? null : () => context.push("/seller/${ad.ownerId}"),
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: DiyorColors.lagoon,
                        foregroundColor: Colors.white,
                        child: Text(
                          sellerName.characters.first.toUpperCase(),
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(sellerName, style: AppText.h3),
                            Text(
                              ad.ownerSellerType == "company" ? t.t("seller.company") : t.t("seller.private"),
                              style: AppText.caption,
                            ),
                          ],
                        ),
                      ),
                      Icon(Icons.chevron_right, color: context.diyor.muted),
                    ],
                  ),
                ),
                if (_similar.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  Text(t.t("listing.similar"), style: AppText.h2),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 256,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _similar.length,
                      separatorBuilder: (_, _) => const SizedBox(width: 12),
                      itemBuilder: (context, index) {
                        final item = _similar[index];
                        return ListingCard(
                          item: item,
                          horizontal: true,
                          strings: t,
                          isFavorite: favs.contains(item.id),
                          onFavorite: () => toggleListingFavorite(
                            context: context,
                            ref: ref,
                            listingId: item.id,
                            isFavorite: favs.contains(item.id),
                          ),
                        );
                      },
                    ),
                  ),
                ],
                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
      ),
      bottomNavigationBar: SafeArea(
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: context.diyor.surface,
            border: Border(top: BorderSide(color: context.diyor.line)),
            boxShadow: AppShadows.lift,
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
            child: isOwner
                ? FilledButton.icon(
                    onPressed: () => context.push("/edit/${ad.id}"),
                    icon: const Icon(Icons.edit_outlined),
                    label: Text(t.t("listing.edit")),
                  )
                : _SellerContactBar(
                    price: formatPrice(ad.price, empty: t.t("listing.noPrice")),
                    phone: ad.contactPhone,
                    phoneVisible: _phoneVisible,
                    whatsapp: ad.sellerWhatsapp,
                    telegram: ad.sellerTelegram,
                    strings: t,
                    onRevealPhone: () {
                      if (ad.contactPhone.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(t.t("seller.noPhone"))),
                        );
                        return;
                      }
                      setState(() => _phoneVisible = true);
                    },
                    onChat: () {
                      if (!auth.isLoggedIn) {
                        context.push("/auth");
                        return;
                      }
                      context.push(
                        listingThreadLocation(
                          listingId: ad.id,
                          peerId: ad.ownerId,
                          title: ad.title,
                        ),
                      );
                    },
                  ),
          ),
        ),
      ),
    );
  }

  Future<void> _report(String id) async {
    final t = ref.read(stringsProvider);
    String reason = reportReasons.first.$1;
    final details = TextEditingController();
    final sent = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(t.t("report.title")),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                initialValue: reason,
                items: [
                  for (final item in reportReasons)
                    DropdownMenuItem(value: item.$1, child: Text(item.$2)),
                ],
                onChanged: (value) => reason = value ?? reason,
              ),
              TextField(controller: details, decoration: InputDecoration(hintText: t.t("report.details"))),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: Text(t.t("common.cancel"))),
            FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(t.t("report.send"))),
          ],
        );
      },
    );
    if (sent != true) return;
    try {
      await ref.read(apiClientProvider).reportListing(id, reason: reason, details: details.text);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t.t("report.sent"))));
      }
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
      }
    }
  }
}

class _SellerContactBar extends StatelessWidget {
  const _SellerContactBar({
    required this.price,
    required this.phone,
    required this.phoneVisible,
    required this.whatsapp,
    required this.telegram,
    required this.strings,
    required this.onRevealPhone,
    required this.onChat,
  });

  final String price;
  final String phone;
  final bool phoneVisible;
  final String whatsapp;
  final String telegram;
  final AppStrings strings;
  final VoidCallback onRevealPhone;
  final VoidCallback onChat;

  @override
  Widget build(BuildContext context) {
    final t = strings;
    final hasWhatsapp = whatsappHref(whatsapp).isNotEmpty;
    final hasTelegram = telegramHref(telegram).isNotEmpty;
    final phoneLabel = phone.isEmpty
        ? t.t("seller.showPhone")
        : (phoneVisible ? phone : t.t("seller.showPhone"));

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          price,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: AppText.price.copyWith(fontSize: 18),
        ),
        const SizedBox(height: 10),
        FilledButton.icon(
          onPressed: () async {
            if (phone.isEmpty || !phoneVisible) {
              onRevealPhone();
              return;
            }
            final uri = Uri(scheme: "tel", path: phone);
            if (await canLaunchUrl(uri)) await launchUrl(uri);
          },
          icon: const Icon(Icons.phone_outlined),
          label: AnimatedSwitcher(
            duration: AppMotion.of(context, AppMotion.fast),
            child: Text(
              phoneLabel,
              key: ValueKey(phoneLabel),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ),
        if (hasWhatsapp || hasTelegram) ...[
          const SizedBox(height: 8),
          Row(
            children: [
              if (hasWhatsapp)
                Expanded(
                  child: FilledButton(
                    style: FilledButton.styleFrom(backgroundColor: DiyorColors.whatsapp),
                    onPressed: () => launchUrl(Uri.parse(whatsappHref(whatsapp))),
                    child: Text(t.t("profile.whatsapp")),
                  ),
                ),
              if (hasWhatsapp && hasTelegram) const SizedBox(width: 8),
              if (hasTelegram)
                Expanded(
                  child: FilledButton(
                    style: FilledButton.styleFrom(backgroundColor: DiyorColors.telegram),
                    onPressed: () => launchUrl(Uri.parse(telegramHref(telegram))),
                    child: Text(t.t("profile.telegram")),
                  ),
                ),
            ],
          ),
        ],
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: onChat,
          icon: const Icon(Icons.chat_bubble_outline),
          label: Text(t.t("seller.chat")),
        ),
      ],
    );
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: context.diyor.chip,
        borderRadius: AppRadii.pill,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: context.diyor.muted),
          const SizedBox(width: 4),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 180),
            child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.caption),
          ),
        ],
      ),
    );
  }
}

class _GalleryPage extends StatelessWidget {
  const _GalleryPage({required this.images, required this.index});

  final List<String> images;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(backgroundColor: Colors.black, foregroundColor: Colors.white),
      body: PhotoViewGallery.builder(
        itemCount: images.length,
        pageController: PageController(initialPage: index),
        builder: (context, i) {
          return PhotoViewGalleryPageOptions(
            imageProvider: CachedNetworkImageProvider(images[i]),
            minScale: PhotoViewComputedScale.contained,
          );
        },
      ),
    );
  }
}
