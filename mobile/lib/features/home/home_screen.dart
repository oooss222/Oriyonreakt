import "dart:async";

import "package:cached_network_image/cached_network_image.dart";
import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "package:url_launcher/url_launcher.dart";

import "../../api/api_exception.dart";
import "../../data/catalog.dart";
import "../../l10n/strings.dart";
import "../../models/ad.dart";
import "../../models/listing.dart";
import "../../state/providers.dart";
import "../../theme.dart";
import "../../utils/format.dart";
import "../../utils/media.dart";
import "../../widgets/ad_slot.dart";
import "../../widgets/common.dart";
import "../../widgets/favorite.dart";

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _promo = PageController();
  final _seenAds = <String>{};
  Timer? _promoTimer;

  bool _loading = true;
  String? _error;
  String _sort = "views_desc";
  int _total = 0;
  int _promoIndex = 0;
  List<Listing> _popular = [];
  List<_HomeSlide> _slides = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _promoTimer?.cancel();
    _promo.dispose();
    super.dispose();
  }

  Future<T> _ignore<T>(Future<T> future, T fallback) async {
    try {
      return await future;
    } catch (_) {
      return fallback;
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final api = ref.read(apiClientProvider);
    final t = ref.read(stringsProvider);
    final city = ref.read(searchRegionControllerProvider);
    final loc = city.isEmpty ? null : city;
    try {
      final results = await Future.wait([
        _ignore(api.listingsCount(location: loc), 0),
        _ignore(api.ads(placement: "home_mid"), const <PromoAd>[]),
        api.listings(limit: 24, sort: _sort, location: loc),
      ]);
      final total = results[0] as int;
      final ads = results[1] as List<PromoAd>;
      final listings = results[2] as List<Listing>;
      final slides = _buildSlides(t, ads);
      if (!mounted) return;
      setState(() {
        _total = total;
        _popular = listings;
        _slides = slides;
        _promoIndex = 0;
        _loading = false;
      });
      if (_promo.hasClients) {
        _promo.jumpToPage(0);
      }
      _restartPromoTimer();
      _trackSlide(_promoIndex);
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.isNetwork ? t.t("common.offline") : error.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = t.t("common.error");
        _loading = false;
      });
    }
  }

  List<_HomeSlide> _buildSlides(AppStrings t, List<PromoAd> ads) {
    final fromAds = <_HomeSlide>[];
    final seen = <String>{};
    for (final ad in ads) {
      if (ad.id.isEmpty || !seen.add(ad.id)) continue;
      fromAds.add(_HomeSlide.fromAd(ad));
    }
    final branded = [
      _HomeSlide(
        id: "diyor-premium",
        title: t.t("home.promoPremiumTitle"),
        body: t.t("home.promoPremiumBody"),
        route: "/profile",
        colors: const [Color(0xFF14202B), Color(0xFF0E7C7B)],
      ),
      _HomeSlide(
        id: "diyor-sell",
        title: t.t("home.promoSellTitle"),
        body: t.t("home.promoSellBody"),
        route: "/add",
        colors: const [Color(0xFFFF8A3D), Color(0xFFE85A00)],
      ),
      _HomeSlide(
        id: "diyor-safe",
        title: t.t("home.promoSafeTitle"),
        body: t.t("home.promoSafeBody"),
        route: "/wallet",
        colors: const [Color(0xFF1C1B1A), Color(0xFF3A342E)],
      ),
    ];
    if (fromAds.isEmpty) return branded;
    if (fromAds.length == 1) return [...fromAds, branded.first];
    return fromAds.take(5).toList();
  }

  void _restartPromoTimer() {
    _promoTimer?.cancel();
    if (_slides.length < 2) return;
    _promoTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!mounted || !_promo.hasClients) return;
      final next = (_promoIndex + 1) % _slides.length;
      _promo.animateToPage(
        next,
        duration: const Duration(milliseconds: 420),
        curve: Curves.easeOutCubic,
      );
    });
  }

  void _trackSlide(int index) {
    if (index < 0 || index >= _slides.length) return;
    final slide = _slides[index];
    if (!slide.isAd || slide.id.isEmpty || !_seenAds.add(slide.id)) return;
    ref.read(apiClientProvider).trackAd(slide.id);
  }

  Future<void> _openSlide(_HomeSlide slide) async {
    if (slide.isAd && slide.id.isNotEmpty) {
      unawaited(ref.read(apiClientProvider).trackAd(slide.id, type: "click"));
    }
    if (slide.route.isNotEmpty) {
      if (slide.route == "/wallet" && !ref.read(authControllerProvider).isLoggedIn) {
        context.push("/auth");
        return;
      }
      if (slide.route == "/add" || slide.route == "/profile") {
        context.go(slide.route);
      } else {
        context.push(slide.route);
      }
      return;
    }
    final link = slide.linkUrl.trim();
    if (link.isEmpty) return;
    final uri = Uri.tryParse(link);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _pickLanguage() async {
    final current = ref.read(localeControllerProvider);
    final selected = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (final item in const [
                ("ru", "Русский", "🇷🇺"),
                ("tg", "Тоҷикӣ", "🇹🇯"),
                ("en", "English", "🇬🇧"),
              ])
                ListTile(
                  leading: Text(item.$3, style: const TextStyle(fontSize: 20)),
                  title: Text(item.$2),
                  trailing: item.$1 == current
                      ? const Icon(Icons.check_rounded, color: DiyorColors.sun)
                      : null,
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

  Future<void> _pickSort() async {
    final t = ref.read(stringsProvider);
    final selected = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (final item in [
                ("views_desc", t.t("sort.popular")),
                ("new", t.t("sort.new")),
                ("price_asc", t.t("sort.priceAsc")),
                ("price_desc", t.t("sort.priceDesc")),
              ])
                ListTile(
                  title: Text(item.$2),
                  trailing: item.$1 == _sort
                      ? const Icon(Icons.check_rounded, color: DiyorColors.sun)
                      : null,
                  onTap: () => Navigator.pop(context, item.$1),
                ),
            ],
          ),
        );
      },
    );
    if (selected == null || selected == _sort) return;
    setState(() => _sort = selected);
    await _load();
  }

  String _searchHint(AppStrings t) {
    if (_total <= 0) return t.t("common.search");
    return t.t("home.listingsCount", {"count": formatCount(_total)});
  }

  String _categoryLabel(CategoryInfo cat, AppStrings t) {
    return switch (cat.slug) {
      "phones" => t.t("home.catElectronics"),
      "furniture" => t.t("home.catHome"),
      _ => cat.shortTitle,
    };
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    final lang = ref.watch(localeControllerProvider);
    final unread = ref.watch(unreadCountProvider).valueOrNull ?? 0;
    final favs = ref.watch(favoritesIdsProvider).valueOrNull ?? {};
    final loggedIn = ref.watch(authControllerProvider).isLoggedIn;
    final dark = Theme.of(context).brightness == Brightness.dark;
    final cats = homeFeedCategories;
    final slots = ref.watch(adSlotsProvider).valueOrNull;
    final feedRows = mixOrganicFeed(
      _popular,
      interval: adFeedInterval(slots, "app_feed_native"),
      enabled: adSlotOn(slots, "app_feed_native"),
    );

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: dark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
      child: ColoredBox(
        color: context.diyor.canvas,
        child: RefreshIndicator(
          color: DiyorColors.sun,
          onRefresh: _load,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: _HomeTopBar(
                  title: t.t("nav.home"),
                  lang: lang,
                  unread: unread,
                  onLanguage: _pickLanguage,
                  onBell: () => loggedIn ? context.go("/messages") : context.push("/auth"),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  child: adSlotOn(slots, "app_home_top")
                      ? const AdSlot(placement: "app_home_top", height: 100)
                      : const SizedBox.shrink(),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
                  child: HomeSearchBar(
                    hint: _searchHint(t),
                    onTap: () => context.push("/catalog"),
                    onFilter: () => context.push("/catalog"),
                  ),
                ),
              ),
              if (_loading)
                const SliverToBoxAdapter(child: _HomeSkeleton())
              else if (_error != null)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: ErrorView(
                    message: _error!,
                    onRetry: _load,
                    retryLabel: t.t("common.retry"),
                  ),
                )
              else ...[
                if (_slides.isNotEmpty)
                  SliverToBoxAdapter(
                    child: AppAppear(
                      child: _PromoCarousel(
                        controller: _promo,
                        slides: _slides,
                        index: _promoIndex,
                        onChanged: (index) {
                          setState(() => _promoIndex = index);
                          _trackSlide(index);
                        },
                        onOpen: _openSlide,
                      ),
                    ),
                  ),
                SliverToBoxAdapter(
                  child: AppAppear(
                    delay: const Duration(milliseconds: 40),
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 22, 16, 4),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(t.t("home.categories"), style: AppText.h2.copyWith(fontSize: 22)),
                          const SizedBox(height: 14),
                          _CategoryPager(
                            categories: cats,
                            labelOf: (cat) => _categoryLabel(cat, t),
                            onTap: (cat) => context.push("/catalog?cat=${cat.slug}"),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 22, 8, 10),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            t.t("home.popularNow"),
                            style: AppText.h2.copyWith(fontSize: 22),
                          ),
                        ),
                        IconButton(
                          tooltip: t.t("sort.popular"),
                          onPressed: _pickSort,
                          icon: Icon(Icons.view_agenda_outlined, color: context.diyor.ink),
                        ),
                      ],
                    ),
                  ),
                ),
                if (_popular.isEmpty)
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: EmptyView(
                      message: t.t("home.noPublished"),
                      icon: Icons.storefront_outlined,
                      actionLabel: t.t("add.title"),
                      onAction: () => context.go("/add"),
                    ),
                  )
                else
                  SliverPadding(
                    padding: EdgeInsets.fromLTRB(16, 0, 16, AppSpace.belowNav(context)),
                    sliver: SliverList.separated(
                      itemCount: feedRows.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 14),
                      itemBuilder: (context, index) {
                        final row = feedRows[index];
                        if (row.ad) {
                          return const AdSlot(placement: "app_feed_native", nativeCard: true);
                        }
                        final item = row.listing!;
                        return ListingCard(
                          item: item,
                          featured: true,
                          animateEntrance: index < 4,
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
            ],
          ),
        ),
      ),
    );
  }
}

class _CategoryPager extends StatefulWidget {
  const _CategoryPager({
    required this.categories,
    required this.labelOf,
    required this.onTap,
  });

  final List<CategoryInfo> categories;
  final String Function(CategoryInfo) labelOf;
  final ValueChanged<CategoryInfo> onTap;

  @override
  State<_CategoryPager> createState() => _CategoryPagerState();
}

class _CategoryPagerState extends State<_CategoryPager> {
  static const _perPage = 6;
  final _controller = PageController();
  int _page = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  List<List<CategoryInfo>> get _pages {
    final items = widget.categories;
    if (items.isEmpty) return const [];
    return [
      for (var i = 0; i < items.length; i += _perPage)
        items.sublist(i, i + _perPage > items.length ? items.length : i + _perPage),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final pages = _pages;
    if (pages.isEmpty) return const SizedBox.shrink();
    final pageCount = pages.length;
    return Column(
      children: [
        SizedBox(
          height: 248,
          child: PageView.builder(
            controller: _controller,
            itemCount: pageCount,
            onPageChanged: (index) => setState(() => _page = index),
            itemBuilder: (context, index) => _CategoryPage(
              items: pages[index],
              labelOf: widget.labelOf,
              onTap: widget.onTap,
            ),
          ),
        ),
        if (pageCount > 1) ...[
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              for (var i = 0; i < pageCount; i++)
                AnimatedContainer(
                  duration: AppMotion.fast,
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: i == _page ? 16 : 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: i == _page ? DiyorColors.sun : context.diyor.line,
                    borderRadius: AppRadii.pill,
                  ),
                ),
            ],
          ),
        ],
      ],
    );
  }
}

class _CategoryPage extends StatelessWidget {
  const _CategoryPage({
    required this.items,
    required this.labelOf,
    required this.onTap,
  });

  final List<CategoryInfo> items;
  final String Function(CategoryInfo) labelOf;
  final ValueChanged<CategoryInfo> onTap;

  @override
  Widget build(BuildContext context) {
    final rows = [
      items.take(3).toList(),
      if (items.length > 3) items.skip(3).take(3).toList(),
    ];
    return Column(
      children: [
        for (var r = 0; r < rows.length; r++) ...[
          if (r > 0) const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (var i = 0; i < 3; i++) ...[
                if (i > 0) const SizedBox(width: 10),
                Expanded(
                  child: i < rows[r].length
                      ? CategoryTile(
                          category: rows[r][i],
                          showcase: true,
                          label: labelOf(rows[r][i]),
                          onTap: () => onTap(rows[r][i]),
                        )
                      : const SizedBox.shrink(),
                ),
              ],
            ],
          ),
        ],
      ],
    );
  }
}

class _HomeTopBar extends StatelessWidget {
  const _HomeTopBar({
    required this.title,
    required this.lang,
    required this.unread,
    required this.onLanguage,
    required this.onBell,
  });

  final String title;
  final String lang;
  final int unread;
  final VoidCallback onLanguage;
  final VoidCallback onBell;

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, top + 4, 12, 10),
      child: SizedBox(
        height: 44,
        child: Row(
          children: [
            const SizedBox(width: 112),
            Expanded(
              child: Text(
                title,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppText.h3.copyWith(fontSize: 17, fontWeight: FontWeight.w800),
              ),
            ),
            SizedBox(
              width: 112,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  _LangChip(lang: lang, onTap: onLanguage),
                  const SizedBox(width: 8),
                  _BellButton(unread: unread, onTap: onBell),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LangChip extends StatelessWidget {
  const _LangChip({required this.lang, required this.onTap});

  final String lang;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final flag = switch (lang) {
      "tg" => "🇹🇯",
      "en" => "🇬🇧",
      _ => "🇷🇺",
    };
    return Material(
      color: context.diyor.surface,
      elevation: 1,
      shadowColor: const Color(0x14000000),
      borderRadius: AppRadii.pill,
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        borderRadius: AppRadii.pill,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 7, 10, 7),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(flag, style: const TextStyle(fontSize: 13, height: 1)),
              const SizedBox(width: 4),
              Text(
                lang.toUpperCase(),
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: context.diyor.ink,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BellButton extends StatelessWidget {
  const _BellButton({required this.unread, required this.onTap});

  final int unread;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: context.diyor.surface,
      shape: const CircleBorder(),
      elevation: 1,
      shadowColor: const Color(0x14000000),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: SizedBox(
          width: 40,
          height: 40,
          child: Stack(
            alignment: Alignment.center,
            children: [
              Icon(Icons.notifications_none_rounded, color: DiyorColors.sun, size: 22),
              if (unread > 0)
                Positioned(
                  top: 6,
                  right: 6,
                  child: Container(
                    constraints: const BoxConstraints(minWidth: 16),
                    height: 16,
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: const BoxDecoration(
                      color: Color(0xFFE11D48),
                      borderRadius: BorderRadius.all(Radius.circular(99)),
                    ),
                    child: Center(
                      child: Text(
                        unread > 9 ? "9+" : "$unread",
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          height: 1.1,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PromoCarousel extends StatelessWidget {
  const _PromoCarousel({
    required this.controller,
    required this.slides,
    required this.index,
    required this.onChanged,
    required this.onOpen,
  });

  final PageController controller;
  final List<_HomeSlide> slides;
  final int index;
  final ValueChanged<int> onChanged;
  final ValueChanged<_HomeSlide> onOpen;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 148,
          child: PageView.builder(
            controller: controller,
            itemCount: slides.length,
            onPageChanged: onChanged,
            itemBuilder: (context, i) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: _PromoBanner(slide: slides[i], onTap: () => onOpen(slides[i])),
              );
            },
          ),
        ),
        if (slides.length > 1) ...[
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              for (var i = 0; i < slides.length; i++)
                AnimatedContainer(
                  duration: AppMotion.fast,
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: i == index ? 16 : 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: i == index ? DiyorColors.sun : context.diyor.line,
                    borderRadius: AppRadii.pill,
                  ),
                ),
            ],
          ),
        ],
      ],
    );
  }
}

class _PromoBanner extends StatelessWidget {
  const _PromoBanner({required this.slide, required this.onTap});

  final _HomeSlide slide;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final image = resolveMediaUrl(slide.imageUrl, width: 900);
    return AppPressable(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Stack(
          fit: StackFit.expand,
          children: [
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: slide.colors,
                ),
              ),
            ),
            if (image.isNotEmpty)
              CachedNetworkImage(
                imageUrl: image,
                fit: BoxFit.cover,
                errorWidget: (_, _, _) => const SizedBox.shrink(),
              ),
            if (image.isEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 18, 88, 18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (slide.isAd)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.18),
                          borderRadius: AppRadii.pill,
                        ),
                        child: const Text(
                          "AD",
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.4,
                          ),
                        ),
                      ),
                    const Spacer(),
                    Text(
                      slide.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        height: 1.15,
                        letterSpacing: -0.3,
                      ),
                    ),
                    if (slide.body.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        slide.body,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.86),
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          height: 1.25,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _HomeSlide {
  const _HomeSlide({
    required this.id,
    required this.title,
    required this.body,
    this.imageUrl = "",
    this.route = "",
    this.linkUrl = "",
    this.colors = const [Color(0xFF1C1B1A), Color(0xFF3A342E)],
    this.isAd = false,
  });

  factory _HomeSlide.fromAd(PromoAd ad) {
    return _HomeSlide(
      id: ad.id,
      title: ad.caption.isEmpty ? ad.advertiser : ad.caption,
      body: ad.description,
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl,
      isAd: true,
    );
  }

  final String id;
  final String title;
  final String body;
  final String imageUrl;
  final String route;
  final String linkUrl;
  final List<Color> colors;
  final bool isAd;
}

class _HomeSkeleton extends StatelessWidget {
  const _HomeSkeleton();

  @override
  Widget build(BuildContext context) {
    Widget block({required double height, double radius = 20}) {
      return Container(
        height: height,
        decoration: BoxDecoration(
          color: context.diyor.surface,
          borderRadius: BorderRadius.circular(radius),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      child: Column(
        children: [
          block(height: 148),
          const SizedBox(height: 22),
          Row(
            children: [
              for (var i = 0; i < 3; i++) ...[
                if (i > 0) const SizedBox(width: 10),
                Expanded(child: block(height: 78, radius: 16)),
              ],
            ],
          ),
          const SizedBox(height: 22),
          block(height: 220),
        ],
      ),
    );
  }
}
