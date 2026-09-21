import "dart:async";

import "package:flutter/material.dart";
import "package:flutter/services.dart";

import "../../data/catalog.dart";
import "../../data/spec_templates.dart";
import "../../l10n/strings.dart";
import "../../theme.dart";
import "../../utils/format.dart";

const priceSelectValues = [
  "1000",
  "2000",
  "5000",
  "10000",
  "15000",
  "20000",
  "30000",
  "50000",
  "100000",
  "200000",
  "500000",
];

const hiddenConditionCats = {"food", "business", "travel", "services"};

List<String> priceSelectValuesFor(String cat, Map<String, String> specs) {
  if (cat == "realestate") {
    return switch (specs["Тип сделки"]) {
      "Посуточно" => const ["50", "100", "150", "200", "300", "500", "800", "1000", "1500"],
      "Снять" => const ["500", "800", "1000", "1500", "2000", "3000", "5000", "8000", "10000", "15000", "20000"],
      _ => priceSelectValues,
    };
  }
  if (cat == "food") {
    return const ["20", "30", "50", "80", "100", "150", "200", "300", "500"];
  }
  return priceSelectValues;
}

class CatalogFilterDraft {
  const CatalogFilterDraft({
    this.cat = "",
    this.sub = "",
    this.city = "",
    this.priceFrom = "",
    this.priceTo = "",
    this.specs = const {},
  });

  final String cat;
  final String sub;
  final String city;
  final String priceFrom;
  final String priceTo;
  final Map<String, String> specs;

  String get condition => specs["Состояние"] ?? "";

  CatalogFilterDraft copyWith({
    String? cat,
    String? sub,
    String? city,
    String? priceFrom,
    String? priceTo,
    Map<String, String>? specs,
  }) {
    return CatalogFilterDraft(
      cat: cat ?? this.cat,
      sub: sub ?? this.sub,
      city: city ?? this.city,
      priceFrom: priceFrom ?? this.priceFrom,
      priceTo: priceTo ?? this.priceTo,
      specs: specs ?? this.specs,
    );
  }

  int get extraCount {
    var n = 0;
    if (sub.isNotEmpty) n++;
    if (city.isNotEmpty) n++;
    if (priceFrom.isNotEmpty || priceTo.isNotEmpty) n++;
    n += specs.values.where((value) => value.trim().isNotEmpty).length;
    return n;
  }

  int get activeCount => extraCount + (cat.isNotEmpty ? 1 : 0);
}

List<SpecFieldDef> catalogSpecFilters(
  String cat, [
  String subcategory = "",
  Map<String, String> specs = const {},
  String city = "",
]) {
  if (cat.isEmpty) return const [];
  return [
    for (final def in visibleSpecTemplate(cat, subcategory, specs, city))
      if (def.type == "select" || def.options.isNotEmpty || def.optionsFrom != null) def,
  ];
}

Future<CatalogFilterDraft?> showCatalogFilterSheet({
  required BuildContext context,
  required CatalogFilterDraft draft,
  required AppStrings strings,
  required Future<int> Function(CatalogFilterDraft draft) previewCount,
  required Future<({int total, Map<String, int> bySubcategory})> Function(
    String cat,
    String city,
  ) loadStats,
  String focus = "",
  bool lockCategory = false,
}) {
  return showModalBottomSheet<CatalogFilterDraft>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) {
      return CatalogFilterSheet(
        initial: draft,
        strings: strings,
        previewCount: previewCount,
        loadStats: loadStats,
        focus: focus,
        lockCategory: lockCategory,
      );
    },
  );
}

class CatalogFilterSheet extends StatefulWidget {
  const CatalogFilterSheet({
    super.key,
    required this.initial,
    required this.strings,
    required this.previewCount,
    required this.loadStats,
    this.focus = "",
    this.lockCategory = false,
  });

  final CatalogFilterDraft initial;
  final AppStrings strings;
  final Future<int> Function(CatalogFilterDraft draft) previewCount;
  final Future<({int total, Map<String, int> bySubcategory})> Function(
    String cat,
    String city,
  ) loadStats;
  final String focus;
  final bool lockCategory;

  @override
  State<CatalogFilterSheet> createState() => _CatalogFilterSheetState();
}

class _CatalogFilterSheetState extends State<CatalogFilterSheet> {
  late CatalogFilterDraft _draft;
  late bool _categoryOpen;
  late bool _priceOpen;
  late bool _cityOpen;
  final _openSpecs = <String>{};
  Timer? _previewTimer;
  int _preview = 0;
  bool _previewLoading = false;
  int _statsTotal = 0;
  Map<String, int> _stats = const {};

  AppStrings get t => widget.strings;
  bool get _locked => widget.lockCategory && widget.initial.cat.isNotEmpty;

  @override
  void initState() {
    super.initState();
    _draft = widget.initial.copyWith(
      specs: pruneListingSpecs(
        widget.initial.cat,
        widget.initial.sub,
        widget.initial.specs,
        city: widget.initial.city,
      ),
    );
    _categoryOpen = widget.focus.isEmpty || widget.focus == "category";
    _priceOpen = widget.focus == "price";
    _cityOpen = widget.focus == "city";
    if (widget.focus == "condition") _openSpecs.add("Состояние");
    if (widget.focus.isNotEmpty && widget.focus != "price" && widget.focus != "city" && widget.focus != "category") {
      _openSpecs.add(widget.focus);
    }
    if (_openSpecs.isEmpty && widget.focus.isEmpty) {
      final first = catalogSpecFilters(_draft.cat, _draft.sub, _draft.specs, _draft.city);
      if (first.isNotEmpty) _openSpecs.add(first.first.name);
    }
    _refreshStats();
    _queuePreview();
  }

  @override
  void dispose() {
    _previewTimer?.cancel();
    super.dispose();
  }

  void _setDraft(CatalogFilterDraft next) {
    final statsChanged = next.cat != _draft.cat || next.city != _draft.city;
    setState(() => _draft = next);
    _queuePreview();
    if (statsChanged) _refreshStats();
  }

  void _setCat(String cat) {
    if (_locked) return;
    _setDraft(CatalogFilterDraft(
      cat: cat,
      city: _draft.city,
      priceFrom: _draft.priceFrom,
      priceTo: _draft.priceTo,
    ));
  }

  void _setSub(String sub) {
    _setDraft(_draft.copyWith(
      sub: sub,
      specs: pruneListingSpecs(_draft.cat, sub, _draft.specs, city: _draft.city),
    ));
  }

  void _setSpec(String name, String value) {
    final next = Map<String, String>.from(_draft.specs);
    if (value.isEmpty) {
      next.remove(name);
    } else {
      next[name] = value;
    }
    if (name == "Марка" || name == "Производитель" || name == "Бренд") {
      next.remove("Модель");
    }
    var sub = _draft.sub;
    if (name == "Тип сделки" &&
        _draft.cat == "realestate" &&
        value == "Посуточно" &&
        !realEstateSubFitsDeal(sub, value)) {
      sub = "";
    }
    _setDraft(_draft.copyWith(
      sub: sub,
      specs: pruneListingSpecs(_draft.cat, sub, next, city: _draft.city),
    ));
  }

  void _setCity(String city) {
    _setDraft(_draft.copyWith(
      city: city,
      specs: pruneListingSpecs(_draft.cat, _draft.sub, _draft.specs, city: city),
    ));
  }

  Future<void> _refreshStats() async {
    if (_draft.cat.isEmpty) {
      if (mounted) {
        setState(() {
          _statsTotal = 0;
          _stats = const {};
        });
      }
      return;
    }
    try {
      final stats = await widget.loadStats(_draft.cat, _draft.city);
      if (!mounted) return;
      setState(() {
        _statsTotal = stats.total;
        _stats = stats.bySubcategory;
      });
    } catch (_) {}
  }

  void _queuePreview() {
    _previewTimer?.cancel();
    setState(() => _previewLoading = true);
    _previewTimer = Timer(const Duration(milliseconds: 350), () async {
      try {
        final count = await widget.previewCount(_draft);
        if (!mounted) return;
        setState(() {
          _preview = count;
          _previewLoading = false;
        });
      } catch (_) {
        if (!mounted) return;
        setState(() => _previewLoading = false);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.sizeOf(context).height * 0.88;
    final bottom = MediaQuery.paddingOf(context).bottom;
    final palette = context.diyor;
    final specFields = catalogSpecFilters(_draft.cat, _draft.sub, _draft.specs, _draft.city);
    final specDrafts = [
      for (final def in visibleSpecTemplate(_draft.cat, _draft.sub, _draft.specs, _draft.city))
        SpecDraft(def: def, value: _draft.specs[def.name] ?? ""),
    ];
    final subs = filterBrowseSubs(
      _draft.cat,
      _draft.cat.isEmpty ? const <String>[] : categoryBrowseSubs(_draft.cat),
      _draft.specs,
    );

    return Align(
      alignment: Alignment.bottomCenter,
      child: Material(
        color: palette.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        clipBehavior: Clip.antiAlias,
        child: SizedBox(
          height: height,
          child: Column(
            children: [
              const SizedBox(height: 10),
              Container(
                width: 40,
                height: 5,
                decoration: BoxDecoration(
                  color: palette.line,
                  borderRadius: AppRadii.pill,
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 10, 8, 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(t.t("listing.filters"), style: AppText.h2.copyWith(fontSize: 22)),
                    ),
                    IconButton(
                      tooltip: t.t("common.close"),
                      onPressed: () => Navigator.pop(context),
                      icon: Icon(Icons.close, color: palette.ink),
                    ),
                  ],
                ),
              ),
              Divider(height: 1, color: palette.line),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                  children: [
                    if (subs.isNotEmpty || !_locked)
                    _FilterSection(
                      title: t.t("filter.category"),
                      open: _categoryOpen,
                      onToggle: () => setState(() => _categoryOpen = !_categoryOpen),
                      child: Column(
                        children: [
                          if (!_locked) ...[
                            _RadioRow(
                              label: t.t("filter.allCategories"),
                              selected: _draft.cat.isEmpty,
                              count: null,
                              onTap: () => _setCat(""),
                            ),
                            for (final cat in homeCategories)
                              _RadioRow(
                                label: cat.title,
                                selected: _draft.cat == cat.slug,
                                count: _draft.cat == cat.slug ? _statsTotal : null,
                                onTap: () => _setCat(cat.slug),
                              ),
                          ],
                          if (subs.isNotEmpty) ...[
                            if (!_locked) const SizedBox(height: 8),
                            _RadioRow(
                              label: t.t("filter.allCategories"),
                              selected: _draft.sub.isEmpty,
                              count: _statsTotal,
                              onTap: () => _setSub(""),
                            ),
                            for (final sub in subs)
                              _RadioRow(
                                label: sub,
                                selected: _draft.sub == sub,
                                count: _stats[sub],
                                onTap: () => _setSub(_draft.sub == sub ? "" : sub),
                              ),
                          ],
                        ],
                      ),
                    ),
                    for (final field in specFields)
                      _FilterSection(
                        title: field.name,
                        open: _openSpecs.contains(field.name),
                        onToggle: () => setState(() {
                          if (!_openSpecs.add(field.name)) _openSpecs.remove(field.name);
                        }),
                        child: _SpecFilterControl(
                          def: field,
                          value: _draft.specs[field.name] ?? "",
                          options: specOptionsFor(
                            SpecDraft(def: field, value: _draft.specs[field.name] ?? ""),
                            specDrafts,
                          ),
                          anyLabel: t.t("filter.any"),
                          needParent: field.dependsOn.isEmpty
                              ? ""
                              : t.t("add.specNeedParent", {"parent": field.dependsOn}),
                          onChanged: (value) => _setSpec(field.name, value),
                        ),
                      ),
                    _FilterSection(
                      title: t.t("filter.priceSom"),
                      open: _priceOpen,
                      onToggle: () => setState(() => _priceOpen = !_priceOpen),
                      child: Row(
                        children: [
                          Expanded(
                            child: _PriceField(
                              value: _draft.priceFrom,
                              hint: t.t("filter.from"),
                              options: priceSelectValuesFor(_draft.cat, _draft.specs),
                              onChanged: (value) => _setDraft(_draft.copyWith(priceFrom: value)),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _PriceField(
                              value: _draft.priceTo,
                              hint: t.t("filter.to"),
                              options: priceSelectValuesFor(_draft.cat, _draft.specs),
                              onChanged: (value) => _setDraft(_draft.copyWith(priceTo: value)),
                            ),
                          ),
                        ],
                      ),
                    ),
                    _FilterSection(
                      title: t.t("filter.city"),
                      open: _cityOpen,
                      onToggle: () => setState(() => _cityOpen = !_cityOpen),
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                            _Pill(
                              label: t.t("filter.allCities"),
                              selected: _draft.city.isEmpty,
                              onTap: () => _setCity(""),
                            ),
                            for (final city in cities)
                              _Pill(
                                label: city,
                                selected: _draft.city == city,
                                onTap: () => _setCity(_draft.city == city ? "" : city),
                              ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              DecoratedBox(
                decoration: BoxDecoration(
                  color: palette.surface,
                  border: Border(top: BorderSide(color: palette.line)),
                ),
                child: Padding(
                  padding: EdgeInsets.fromLTRB(16, 12, 16, 12 + bottom),
                  child: Row(
                    children: [
                      if (_draft.extraCount > 0)
                        TextButton(
                          onPressed: () {
                            _setDraft(CatalogFilterDraft(
                              cat: _locked ? widget.initial.cat : "",
                            ));
                            _refreshStats();
                          },
                          child: Text(t.t("filter.reset")),
                        )
                      else
                        const SizedBox(width: 8),
                      Expanded(
                        child: FilledButton(
                          onPressed: () => Navigator.pop(context, _draft),
                          style: FilledButton.styleFrom(
                            minimumSize: const Size.fromHeight(44),
                            backgroundColor: DiyorColors.sun,
                          ),
                          child: Text(
                            _previewLoading
                                ? t.t("filter.showLoading")
                                : t.t("filter.showCount", {"count": formatCount(_preview)}),
                          ),
                        ),
                      ),
                    ],
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

class _SpecFilterControl extends StatelessWidget {
  const _SpecFilterControl({
    required this.def,
    required this.value,
    required this.options,
    required this.anyLabel,
    required this.needParent,
    required this.onChanged,
  });

  final SpecFieldDef def;
  final String value;
  final List<String> options;
  final String anyLabel;
  final String needParent;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    if (def.dependsOn.isNotEmpty && options.isEmpty) {
      return Text(
        needParent,
        style: AppText.bodySmall.copyWith(color: context.diyor.muted),
      );
    }
    if (options.length <= 8) {
      return Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          _Pill(label: anyLabel, selected: value.isEmpty, onTap: () => onChanged("")),
          for (final option in options)
            _Pill(
              label: option,
              selected: value == option,
              onTap: () => onChanged(value == option ? "" : option),
            ),
        ],
      );
    }
    final items = [
      ...options,
      if (value.isNotEmpty && !options.contains(value)) value,
    ];
    return DropdownButtonFormField<String>(
      key: ValueKey("${def.name}-${items.join()}"),
      initialValue: items.contains(value) ? value : "",
      isExpanded: true,
      decoration: InputDecoration(
        hintText: anyLabel,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      ),
      items: [
        DropdownMenuItem(value: "", child: Text(anyLabel)),
        for (final option in items) DropdownMenuItem(value: option, child: Text(option)),
      ],
      onChanged: (next) => onChanged(next ?? ""),
    );
  }
}

class _FilterSection extends StatelessWidget {
  const _FilterSection({
    required this.title,
    required this.open,
    required this.onToggle,
    required this.child,
  });

  final String title;
  final bool open;
  final VoidCallback onToggle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            onToggle();
          },
          child: SizedBox(
            height: 48,
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    title.toUpperCase(),
                    style: AppText.label.copyWith(color: context.diyor.muted),
                  ),
                ),
                Icon(
                  open ? Icons.expand_less_rounded : Icons.expand_more_rounded,
                  color: context.diyor.muted,
                ),
              ],
            ),
          ),
        ),
        if (open) Padding(padding: const EdgeInsets.only(bottom: 8), child: child),
        Divider(height: 1, color: context.diyor.line),
      ],
    );
  }
}

class _RadioRow extends StatelessWidget {
  const _RadioRow({
    required this.label,
    required this.selected,
    required this.onTap,
    this.count,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final int? count;

  @override
  Widget build(BuildContext context) {
    final palette = context.diyor;
    return InkWell(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      borderRadius: BorderRadius.circular(12),
      child: SizedBox(
        height: 44,
        child: Row(
          children: [
            Container(
              width: 18,
              height: 18,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: selected ? DiyorColors.sun : palette.line,
                  width: 2,
                ),
              ),
              child: selected
                  ? Center(
                      child: Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: DiyorColors.sun,
                          shape: BoxShape.circle,
                        ),
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  color: palette.ink,
                ),
              ),
            ),
            if (count != null)
              Text(
                formatCount(count!),
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: palette.muted,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? DiyorColors.sun : context.diyor.chip,
      borderRadius: AppRadii.pill,
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        borderRadius: AppRadii.pill,
        child: SizedBox(
          height: 44,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Center(
              child: Text(
                label,
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: selected ? Colors.white : context.diyor.ink,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PriceField extends StatelessWidget {
  const _PriceField({
    required this.value,
    required this.hint,
    required this.options,
    required this.onChanged,
  });

  final String value;
  final String hint;
  final List<String> options;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final items = [
      ...options,
      if (value.isNotEmpty && !options.contains(value)) value,
    ];
    return DropdownButtonFormField<String>(
      initialValue: items.contains(value) ? value : null,
      isExpanded: true,
      decoration: InputDecoration(
        hintText: hint,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      ),
      items: [
        DropdownMenuItem(value: "", child: Text(hint)),
        for (final option in items)
          DropdownMenuItem(value: option, child: Text(formatCount(int.tryParse(option) ?? 0))),
      ],
      onChanged: (next) => onChanged(next ?? ""),
    );
  }
}
