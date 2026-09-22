import "dart:async";
import "dart:convert";

import "package:cached_network_image/cached_network_image.dart";
import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "package:shared_preferences/shared_preferences.dart";
import "package:url_launcher/url_launcher.dart";

import "../api/api_client.dart";
import "../models/ad.dart";
import "../models/listing.dart";
import "../state/providers.dart";
import "../theme.dart";
import "../utils/media.dart";
import "ui.dart";

class FeedEntry {
  const FeedEntry.listing(this.listing) : ad = false;
  const FeedEntry.ad() : listing = null, ad = true;

  final Listing? listing;
  final bool ad;
}

List<FeedEntry> mixOrganicFeed(List<Listing> items, {required int interval, required bool enabled}) {
  if (!enabled || interval <= 0) {
    return [for (final item in items) FeedEntry.listing(item)];
  }
  final promoted = items.where((item) => item.vip || item.top);
  final regular = items.where((item) => !item.vip && !item.top);
  final rows = [for (final item in promoted) FeedEntry.listing(item)];
  var index = 0;
  for (final item in regular) {
    rows.add(FeedEntry.listing(item));
    index += 1;
    if (index % interval == 0) rows.add(const FeedEntry.ad());
  }
  return rows;
}

final adSlotsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final data = await ref.watch(apiClientProvider).adConfig(adPlatform());
  final slots = data["slots"];
  if (slots is! List) return const [];
  return [
    for (final item in slots)
      if (item is Map) Map<String, dynamic>.from(item),
  ];
});

Map<String, dynamic>? _slotOf(List<Map<String, dynamic>>? slots, String code) {
  if (slots == null) return null;
  for (final slot in slots) {
    if (slot["code"] == code) return slot;
  }
  return null;
}

int adFeedInterval(List<Map<String, dynamic>>? slots, String code) {
  final config = _slotOf(slots, code)?["config"];
  if (config is Map) {
    final value = int.tryParse("${config["interval"] ?? ""}");
    if (value != null && value > 0) return value;
  }
  return 8;
}

bool adSlotOn(List<Map<String, dynamic>>? slots, String code) {
  final slot = _slotOf(slots, code);
  if (slot == null) return true;
  return slot["enabled"] != false;
}

class AdSlot extends ConsumerStatefulWidget {
  const AdSlot({
    super.key,
    required this.placement,
    this.category = "",
    this.city = "",
    this.query = "",
    this.height = 100,
    this.nativeCard = false,
    this.onClose,
  });

  final String placement;
  final String category;
  final String city;
  final String query;
  final double height;
  final bool nativeCard;
  final VoidCallback? onClose;

  @override
  ConsumerState<AdSlot> createState() => _AdSlotState();
}

class _AdSlotState extends ConsumerState<AdSlot> {
  List<PromoAd> _items = const [];
  int _index = 0;
  bool _tracked = false;
  Timer? _poll;
  Timer? _dwell;
  Timer? _rotate;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant AdSlot oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.placement != widget.placement || oldWidget.category != widget.category || oldWidget.query != widget.query || oldWidget.city != widget.city) {
      _tracked = false;
      _dwell?.cancel();
      _dwell = null;
      _rotate?.cancel();
      _items = const [];
      _load();
    }
  }

  @override
  void dispose() {
    _poll?.cancel();
    _dwell?.cancel();
    _rotate?.cancel();
    super.dispose();
  }

  void _arm() {
    _poll?.cancel();
    if (_tracked || _items.isEmpty) return;
    _poll = Timer.periodic(const Duration(milliseconds: 400), (_) => _measure());
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _measure();
    });
  }

  void _measure() {
    if (!mounted || _tracked || _items.isEmpty) return;
    final box = context.findRenderObject();
    if (box is! RenderBox || !box.attached || !box.hasSize || box.size.height == 0) return;
    final offset = box.localToGlobal(Offset.zero);
    final screen = MediaQuery.sizeOf(context);
    final top = offset.dy.clamp(0, screen.height).toDouble();
    final bottom = (offset.dy + box.size.height).clamp(0, screen.height).toDouble();
    final visible = (bottom - top) / box.size.height;
    if (visible >= 0.5) {
      _dwell ??= Timer(const Duration(seconds: 1), () {
        if (!mounted || _tracked || _items.isEmpty) return;
        _tracked = true;
        _poll?.cancel();
        final ad = _items[_index.clamp(0, _items.length - 1).toInt()];
        ref.read(apiClientProvider).trackAdImpression(
              campaignId: ad.campaignId.isEmpty ? ad.id : ad.campaignId,
              creativeId: ad.creativeId,
              placement: widget.placement,
              platform: adPlatform(),
            );
      });
    } else {
      _dwell?.cancel();
      _dwell = null;
    }
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final cacheKey = "diyor_ads_${widget.placement}_${widget.category}_${widget.query}";
    final cached = prefs.getString(cacheKey);
    if (cached != null && mounted && _items.isEmpty) {
      final parsed = parsePromoAdList(jsonDecode(cached));
      if (parsed.isNotEmpty) {
        setState(() => _items = parsed);
        _arm();
      }
    }
    try {
      final items = await ref.read(apiClientProvider).ads(
            placement: widget.placement,
            cat: widget.category,
            city: widget.city,
            query: widget.query,
            platform: adPlatform(),
          );
      if (!mounted) return;
      setState(() {
        _items = items;
        _index = 0;
      });
      await prefs.setString(cacheKey, jsonEncode([
        for (final item in items)
          {
            "id": item.id,
            "campaignId": item.campaignId,
            "creativeId": item.creativeId,
            "title": item.title,
            "headline": item.headline,
            "description": item.description,
            "imageUrl": item.imageUrl,
            "linkUrl": item.linkUrl,
            "deeplink": item.deeplink,
            "format": item.format,
            "advertiser": item.advertiser,
          },
      ]));
      _arm();
      _rotate?.cancel();
      if (items.length > 1) {
        _rotate = Timer.periodic(const Duration(seconds: 5), (_) {
          if (!mounted) return;
          setState(() => _index = (_index + 1) % _items.length);
        });
      }
    } catch (_) {
      if (mounted && _items.isEmpty) setState(() => _items = const []);
    }
  }

  Future<void> _open(PromoAd ad) async {
    try {
      final target = await ref.read(apiClientProvider).openAd(ad, placement: widget.placement, platform: adPlatform());
      final deeplink = target["deeplink"] ?? "";
      final url = target["url"] ?? ad.linkUrl;
      if (!mounted) return;
      if (deeplink.startsWith("/")) {
        context.push(deeplink);
        return;
      }
      if (deeplink.startsWith("diyor://")) {
        final path = _appPath(deeplink);
        if (path != null) {
          context.push(path);
          return;
        }
      }
      final destination = url.isNotEmpty ? url : deeplink;
      final uri = Uri.tryParse(destination);
      if (uri == null) return;
      if (uri.path.startsWith("/ad/") || uri.path.startsWith("/c/") || uri.path.startsWith("/seller/")) {
        context.push(uri.path);
        return;
      }
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    if (_items.isEmpty) return const SizedBox.shrink();
    final ad = _items[_index.clamp(0, _items.length - 1).toInt()];
    final t = ref.watch(stringsProvider);
    final creative = widget.nativeCard
        ? _NativeAd(ad: ad, label: t.t("ads.label"))
        : _BannerAd(ad: ad, height: widget.height, label: t.t("ads.label"));
    return GestureDetector(
      onTap: () => _open(ad),
      child: Stack(
        children: [
          creative,
          if (widget.onClose != null)
            Positioned(
              top: 4,
              right: 4,
              child: Material(
                color: DiyorColors.ink.withValues(alpha: 0.72),
                shape: const CircleBorder(),
                child: InkWell(
                  customBorder: const CircleBorder(),
                  onTap: widget.onClose,
                  child: const SizedBox(
                    width: 28,
                    height: 28,
                    child: Icon(Icons.close, color: Colors.white, size: 16),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

String? _appPath(String deeplink) {
  final uri = Uri.tryParse(deeplink);
  if (uri == null) return null;
  final parts = uri.pathSegments.where((part) => part.isNotEmpty).toList();
  if (parts.isEmpty) return null;
  final head = parts.first;
  final rest = parts.length > 1 ? parts.sublist(1).join("/") : "";
  if (head == "listing" || head == "ad") return rest.isEmpty ? null : "/ad/$rest";
  if (head == "category" || head == "c") return rest.isEmpty ? "/catalog" : "/catalog?cat=$rest";
  if (head == "seller") return rest.isEmpty ? null : "/seller/$rest";
  return null;
}

class AdStickyBar extends ConsumerStatefulWidget {
  const AdStickyBar({super.key});

  @override
  ConsumerState<AdStickyBar> createState() => _AdStickyBarState();
}

class _AdStickyBarState extends ConsumerState<AdStickyBar> {
  static const _hideKey = "diyor_ad_sticky_hide_until";
  bool _hidden = true;

  @override
  void initState() {
    super.initState();
    _read();
  }

  Future<void> _read() async {
    final prefs = await SharedPreferences.getInstance();
    final until = prefs.getInt(_hideKey) ?? 0;
    if (!mounted) return;
    setState(() => _hidden = until > DateTime.now().millisecondsSinceEpoch);
  }

  Future<void> _close() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_hideKey, DateTime.now().add(const Duration(hours: 1)).millisecondsSinceEpoch);
    if (mounted) setState(() => _hidden = true);
  }

  @override
  Widget build(BuildContext context) {
    if (_hidden) return const SizedBox.shrink();
    final slots = ref.watch(adSlotsProvider).valueOrNull;
    if (!adSlotOn(slots, "app_sticky_bottom")) return const SizedBox.shrink();
    return AdSlot(placement: "app_sticky_bottom", height: 50, onClose: _close);
  }
}

class _BannerAd extends StatelessWidget {
  const _BannerAd({required this.ad, required this.height, required this.label});

  final PromoAd ad;
  final double height;
  final String label;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: AppRadii.card,
      child: SizedBox(
        height: height,
        width: double.infinity,
        child: Stack(
          fit: StackFit.expand,
          children: [
            ColoredBox(
              color: context.diyor.placeholder,
              child: _adImage(ad),
            ),
            Positioned(left: 8, top: 8, child: _AdMark(label: label)),
          ],
        ),
      ),
    );
  }
}

Widget _adImage(PromoAd ad) {
  final url = resolveMediaUrl(ad.imageUrl);
  final raster = url.isNotEmpty && !url.toLowerCase().contains(".svg");
  if (!raster) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 36),
        child: Text(ad.caption, style: AppText.h3, textAlign: TextAlign.center),
      ),
    );
  }
  return CachedNetworkImage(
    imageUrl: url,
    fit: BoxFit.cover,
    errorWidget: (_, _, _) => Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 36),
        child: Text(ad.caption, style: AppText.h3, textAlign: TextAlign.center),
      ),
    ),
  );
}

class _NativeAd extends StatelessWidget {
  const _NativeAd({required this.ad, required this.label});

  final PromoAd ad;
  final String label;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _AdMark(label: label),
            const SizedBox(height: 8),
            Text(ad.caption, style: AppText.h3),
            if (ad.description.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(ad.description, maxLines: 3, overflow: TextOverflow.ellipsis, style: AppText.bodySmall),
            ],
          ],
        ),
      ),
    );
  }
}

class _AdMark extends StatelessWidget {
  const _AdMark({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: DiyorColors.ink.withValues(alpha: 0.72), borderRadius: AppRadii.pill),
      child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)),
    );
  }
}

class AdInterstitial extends ConsumerStatefulWidget {
  const AdInterstitial({super.key, required this.child});

  final Widget child;
  static bool shown = false;

  @override
  ConsumerState<AdInterstitial> createState() => _AdInterstitialState();
}

class _AdInterstitialState extends ConsumerState<AdInterstitial> {
  String? _firstPath;
  bool _offered = false;

  @override
  Widget build(BuildContext context) {
    final path = GoRouterState.of(context).uri.path;
    _firstPath ??= path;
    final blocked = path.startsWith("/add") || path.startsWith("/edit") || path.startsWith("/auth");
    if (!AdInterstitial.shown && !_offered && _firstPath != null && path != _firstPath && !blocked) {
      _offered = true;
      WidgetsBinding.instance.addPostFrameCallback((_) => _maybeShow());
    }
    return widget.child;
  }

  Future<void> _maybeShow() async {
    if (!mounted || AdInterstitial.shown) return;
    try {
      final config = await ref.read(apiClientProvider).adConfig(adPlatform());
      final slots = config["slots"];
      Map<String, dynamic>? slot;
      if (slots is List) {
        for (final item in slots) {
          if (item is Map && item["code"] == "app_interstitial") {
            slot = Map<String, dynamic>.from(item);
          }
        }
      }
      if (slot == null || slot["enabled"] != true) return;
      final ads = await ref.read(apiClientProvider).ads(placement: "app_interstitial", platform: adPlatform());
      if (!mounted || ads.isEmpty || AdInterstitial.shown) return;
      AdInterstitial.shown = true;
      final ad = ads.first;
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (context) => _InterstitialDialog(ad: ad),
      );
    } catch (_) {}
  }
}

class _InterstitialDialog extends ConsumerWidget {
  const _InterstitialDialog({required this.ad});

  final PromoAd ad;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    return Dialog(
      insetPadding: const EdgeInsets.all(24),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Align(alignment: Alignment.centerLeft, child: _AdMark(label: t.t("ads.label"))),
            const SizedBox(height: 12),
            Text(ad.caption, style: AppText.h2, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(onPressed: () => Navigator.pop(context), child: Text(t.t("common.close"))),
            ),
          ],
        ),
      ),
    );
  }
}
