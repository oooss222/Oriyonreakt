import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../api/api_exception.dart";
import "../../data/catalog.dart";
import "../../data/spec_templates.dart";
import "../../models/listing.dart";
import "../../state/providers.dart";
import "../../theme.dart";
import "../../widgets/common.dart";
import "../../widgets/favorite.dart";
import "catalog_filter_sheet.dart";

class CatalogScreen extends ConsumerStatefulWidget {
  const CatalogScreen({
    super.key,
    this.initialCat = "",
    this.initialQuery = "",
    this.initialSubcategory = "",
  });

  final String initialCat;
  final String initialQuery;
  final String initialSubcategory;

  @override
  ConsumerState<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends ConsumerState<CatalogScreen> {
  late final TextEditingController _search;
  late final TextEditingController _priceFromCtrl;
  late final TextEditingController _priceToCtrl;
  late final FocusNode _searchFocus;
  String _cat = "";
  String _sub = "";
  String _city = "";
  String _sort = "new";
  String _priceFrom = "";
  String _priceTo = "";
  Map<String, String> _specs = {};
  bool _loading = true;
  bool _loadingMore = false;
  String? _error;
  List<Listing> _items = [];
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _cat = widget.initialCat;
    _sub = widget.initialSubcategory;
    _search = TextEditingController(text: widget.initialQuery);
    _priceFromCtrl = TextEditingController();
    _priceToCtrl = TextEditingController();
    _searchFocus = FocusNode()
      ..addListener(() {
        if (mounted) setState(() {});
      });
    _city = ref.read(searchRegionControllerProvider);
    _load(reset: true);
  }

  @override
  void dispose() {
    _search.dispose();
    _priceFromCtrl.dispose();
    _priceToCtrl.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  Future<void> _load({bool reset = false}) async {
    if (reset) {
      setState(() {
        _loading = true;
        _error = null;
        _items = [];
        _hasMore = true;
      });
    } else {
      if (_loadingMore || !_hasMore) return;
      setState(() => _loadingMore = true);
    }

    final t = ref.read(stringsProvider);
    try {
      final next = await ref.read(apiClientProvider).listings(
            cat: _cat,
            subcategory: _sub,
            search: _search.text.trim(),
            location: _city,
            priceFrom: _priceFrom,
            priceTo: _priceTo,
            specs: _specs.isEmpty ? null : _specs,
            sort: _sort,
            limit: 30,
            offset: reset ? 0 : _items.length,
          );
      setState(() {
        _items = reset ? next : [..._items, ...next];
        _hasMore = next.length >= 30;
        _loading = false;
        _loadingMore = false;
      });
    } on ApiException catch (error) {
      setState(() {
        _error = error.isNetwork ? t.t("common.offline") : error.message;
        _loading = false;
        _loadingMore = false;
      });
    }
  }

  int get _activeFilterCount {
    var n = 0;
    if (_sub.isNotEmpty) n++;
    if (_city.isNotEmpty) n++;
    if (_sort != "new") n++;
    if (_priceFrom.isNotEmpty || _priceTo.isNotEmpty) n++;
    n += _specs.values.where((value) => value.trim().isNotEmpty).length;
    if (_search.text.trim().isNotEmpty) n++;
    return n;
  }

  CatalogFilterDraft get _filterDraft => CatalogFilterDraft(
        cat: _cat,
        sub: _sub,
        city: _city,
        priceFrom: _priceFrom,
        priceTo: _priceTo,
        specs: _specs,
      );

  Map<String, String> _pruneSpecs(String cat, String sub, Map<String, String> specs) {
    return pruneListingSpecs(cat, sub, specs, city: _city);
  }

  void _clearFilters({bool keepCategory = true}) {
    setState(() {
      if (!keepCategory) _cat = "";
      _sub = "";
      _city = "";
      _sort = "new";
      _priceFrom = "";
      _priceTo = "";
      _specs = {};
      _priceFromCtrl.clear();
      _priceToCtrl.clear();
      _search.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    final favs = ref.watch(favoritesIdsProvider).valueOrNull ?? {};
    final title = _cat.isEmpty ? t.t("nav.catalog") : categoryTitle(_cat);

    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: AnimatedContainer(
              duration: AppMotion.of(context, AppMotion.fast),
              curve: AppMotion.emphasized,
              decoration: BoxDecoration(
                borderRadius: AppRadii.field,
                boxShadow: _searchFocus.hasFocus
                    ? [
                        BoxShadow(
                          color: DiyorColors.sun.withValues(alpha: 0.18),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : null,
              ),
              child: TextField(
                controller: _search,
                focusNode: _searchFocus,
                textInputAction: TextInputAction.search,
                onSubmitted: (_) => _load(reset: true),
                decoration: InputDecoration(
                  hintText: t.t("common.search"),
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: IconButton(
                    tooltip: t.t("common.find"),
                    onPressed: () => _load(reset: true),
                    icon: const Icon(Icons.arrow_forward, color: DiyorColors.sun),
                  ),
                ),
              ),
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: Row(
              children: [
                AppChip(
                  icon: Icons.tune_rounded,
                  label: t.t("listing.filters"),
                  selected: _activeFilterCount > 0,
                  onTap: () => _openFilters(),
                ),
                AppChip(
                  label: _priceFrom.isNotEmpty || _priceTo.isNotEmpty
                      ? "${_priceFrom.isEmpty ? "…" : _priceFrom}–${_priceTo.isEmpty ? "…" : _priceTo}"
                      : t.t("filter.price"),
                  selected: _priceFrom.isNotEmpty || _priceTo.isNotEmpty,
                  onTap: () => _openFilters(focus: "price"),
                ),
                if (catalogSpecFilters(_cat, _sub, _specs, _city).any((item) => item.name == "Состояние"))
                  AppChip(
                    label: (_specs["Состояние"] ?? "").isEmpty
                        ? t.t("filter.condition")
                        : _specs["Состояние"]!,
                    selected: (_specs["Состояние"] ?? "").isNotEmpty,
                    onTap: () => _openFilters(focus: "condition"),
                  ),
                AppChip(
                  label: _city.isEmpty ? t.t("filter.city") : _city,
                  selected: _city.isNotEmpty,
                  onTap: () => _openFilters(focus: "city"),
                ),
                AppChip(
                  icon: Icons.sort_rounded,
                  label: _sortLabel(t),
                  selected: _sort != "new",
                  onTap: _pickSort,
                ),
                if (_activeFilterCount > 0)
                  AppChip(
                    label: t.t("filter.reset"),
                    onTap: () {
                      _clearFilters(keepCategory: _cat.isNotEmpty);
                      _load(reset: true);
                    },
                  ),
              ],
            ),
          ),
          if (_cat.isNotEmpty && categoryBrowseSubs(_cat).isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 0, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    t.t("filter.sections"),
                    style: AppText.label.copyWith(color: context.diyor.muted),
                  ),
                  const SizedBox(height: 8),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.only(right: 16),
                    child: Row(
                      children: [
                        AppChip(
                          label: t.t("common.all"),
                          selected: _sub.isEmpty,
                          onTap: () {
                            setState(() {
                              _sub = "";
                              _specs = _pruneSpecs(_cat, "", _specs);
                            });
                            _load(reset: true);
                          },
                        ),
                        for (final sub in categoryBrowseSubs(_cat))
                          AppChip(
                            label: sub,
                            selected: _sub == sub,
                            onTap: () {
                              setState(() {
                              final next = _sub == sub ? "" : sub;
                              _sub = next;
                              _specs = _pruneSpecs(_cat, next, _specs);
                            });
                              _load(reset: true);
                            },
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 8),
          Expanded(
            child: AnimatedSwitcher(
              duration: AppMotion.of(context, AppMotion.standard),
              switchInCurve: AppMotion.enter,
              switchOutCurve: AppMotion.exit,
              child: _loading
                ? const ListingSkeleton(key: ValueKey("catalog-loading"), count: 6)
                : _error != null
                    ? ErrorView(
                        key: const ValueKey("catalog-error"),
                        message: _error!,
                        onRetry: () => _load(reset: true),
                        retryLabel: t.t("common.retry"),
                      )
                    : _items.isEmpty
                        ? EmptyView(
                            key: const ValueKey("catalog-empty"),
                            message: t.t("common.empty"),
                            actionLabel: t.t("filter.reset"),
                            onAction: () {
                              _clearFilters(keepCategory: _cat.isNotEmpty);
                              _load(reset: true);
                            },
                          )
                        : NotificationListener<ScrollNotification>(
                            key: const ValueKey("catalog-grid"),
                            onNotification: (notification) {
                              if (notification.metrics.pixels >
                                  notification.metrics.maxScrollExtent - 400) {
                                _load();
                              }
                              return false;
                            },
                            child: GridView.builder(
                              padding: EdgeInsets.fromLTRB(12, 0, 12, AppSpace.belowNav(context)),
                              gridDelegate: ListingGridDelegate.of(context),
                              itemCount: _items.length + (_loadingMore ? 1 : 0),
                              itemBuilder: (context, index) {
                                if (index >= _items.length) {
                                  return const Center(child: CircularProgressIndicator());
                                }
                                final item = _items[index];
                                return ListingCard(
                                  item: item,
                                  strings: t,
                                  animateEntrance: true,
                                  heroTag: "listing-hero-${item.id}",
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
            ),
          ),
        ],
      ),
    );
  }

  String _sortLabel(dynamic t) {
    return switch (_sort) {
      "price_asc" => t.t("sort.priceAsc"),
      "price_desc" => t.t("sort.priceDesc"),
      _ => t.t("sort.new"),
    };
  }

  Future<void> _openFilters({String focus = ""}) async {
    final t = ref.read(stringsProvider);
    final api = ref.read(apiClientProvider);
    final applied = await showCatalogFilterSheet(
      context: context,
      draft: _filterDraft,
      strings: t,
      focus: focus,
      lockCategory: _cat.isNotEmpty,
      previewCount: (draft) => api.listingsCount(
        cat: draft.cat,
        subcategory: draft.sub,
        search: _search.text.trim(),
        location: draft.city,
        priceFrom: draft.priceFrom,
        priceTo: draft.priceTo,
        specs: draft.specs.isEmpty ? null : draft.specs,
      ),
      loadStats: (cat, city) => api.listingStats(cat, location: city),
    );
    if (applied == null) return;
    setState(() {
      _cat = applied.cat;
      _sub = applied.sub;
      _city = applied.city;
      _priceFrom = applied.priceFrom;
      _priceTo = applied.priceTo;
      _specs = pruneListingSpecs(applied.cat, applied.sub, applied.specs, city: applied.city);
      _priceFromCtrl.text = applied.priceFrom;
      _priceToCtrl.text = applied.priceTo;
    });
    await ref.read(searchRegionControllerProvider.notifier).setCity(applied.city);
    _load(reset: true);
  }

  Future<void> _pickSort() async {
    final t = ref.read(stringsProvider);
    final selected = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(title: Text(t.t("sort.new")), onTap: () => Navigator.pop(context, "new")),
            ListTile(title: Text(t.t("sort.priceAsc")), onTap: () => Navigator.pop(context, "price_asc")),
            ListTile(title: Text(t.t("sort.priceDesc")), onTap: () => Navigator.pop(context, "price_desc")),
          ],
        );
      },
    );
    if (selected == null) return;
    setState(() => _sort = selected);
    _load(reset: true);
  }
}
