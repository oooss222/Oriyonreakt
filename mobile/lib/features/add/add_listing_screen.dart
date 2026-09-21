import "dart:io";

import "package:dio/dio.dart";
import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "package:image_picker/image_picker.dart";

import "../../api/api_exception.dart";
import "../../data/catalog.dart";
import "../../data/spec_templates.dart";
import "../../models/listing.dart";
import "../../state/providers.dart";
import "../../theme.dart";
import "../../utils/media.dart";
import "../../widgets/common.dart";
import "../../widgets/spec_fields.dart";

class AddListingScreen extends ConsumerStatefulWidget {
  const AddListingScreen({super.key, this.editId});

  final String? editId;

  @override
  ConsumerState<AddListingScreen> createState() => _AddListingScreenState();
}

class _AddListingScreenState extends ConsumerState<AddListingScreen> {
  String _cat = "phones";
  String _sub = "";
  String _city = cities.first;
  final _title = TextEditingController();
  final _price = TextEditingController();
  final _description = TextEditingController();
  final _images = <XFile>[];
  final _existing = <String>[];
  List<SpecDraft> _specs = [];
  bool _specsExpanded = false;
  bool _loading = false;
  String _error = "";

  bool get _isEdit => widget.editId != null && widget.editId!.isNotEmpty;

  int get _filledSteps {
    var n = 1;
    if (_existing.isNotEmpty || _images.isNotEmpty) n++;
    if (_title.text.trim().isNotEmpty) n++;
    if (_price.text.trim().isNotEmpty) n++;
    if (_city.isNotEmpty) n++;
    if (_description.text.trim().isNotEmpty) n++;
    return n;
  }

  @override
  void initState() {
    super.initState();
    _sub = categories[_cat]?.subs.first ?? "";
    _specs = draftsFromTemplate(_cat, _sub, const <({String name, String value})>[], _city);
    if (_isEdit) _hydrate();
  }

  void _resetSpecs({Iterable<({String name, String value})> existing = const [], bool collapse = true}) {
    _specs = draftsFromTemplate(_cat, _sub, existing, _city);
    if (collapse) _specsExpanded = false;
  }

  Future<void> _hydrate() async {
    try {
      final listing = await ref.read(apiClientProvider).listingById(widget.editId!);
      setState(() {
        _cat = listing.cat.isEmpty ? _cat : listing.cat;
        _sub = listing.subcategory;
        _city = listing.location.isEmpty ? _city : listing.location;
        _title.text = listing.title;
        _price.text = listing.price;
        _description.text = listing.description;
        _existing.addAll(listing.imageUrls);
        _resetSpecs(
          existing: listing.specs.map((spec) => (name: spec.name, value: spec.value)),
        );
      });
    } catch (_) {}
  }

  @override
  void dispose() {
    _title.dispose();
    _price.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _pick() async {
    final max = listingPhotoMax(_cat);
    remaining() => max - _existing.length - _images.length;
    if (remaining() <= 0) return;
    final files = await ImagePicker().pickMultiImage(imageQuality: 85);
    if (files.isEmpty) return;
    setState(() => _images.addAll(files.take(remaining())));
  }

  Future<void> _submit() async {
    final t = ref.read(stringsProvider);
    final min = listingPhotoMin(_cat);
    if (_title.text.trim().isEmpty) {
      setState(() => _error = t.t("add.titleRequired"));
      return;
    }
    if (_existing.length + _images.length < min) {
      setState(() => _error = t.t("add.needPhotos", {"min": "$min"}));
      return;
    }
    setState(() {
      _loading = true;
      _error = "";
    });
    final api = ref.read(apiClientProvider);
    try {
      var uploaded = <String>[];
      if (_images.isNotEmpty) {
        uploaded = await api.uploadImages([
          for (final file in _images)
            await MultipartFile.fromFile(file.path, filename: file.name),
        ]);
      }
      final images = [
        ..._existing.map((url) => {"url": url, "alt": _title.text.trim()}),
        ...uploaded.map((url) => {"url": url, "alt": _title.text.trim()}),
      ];
      final payload = {
        "title": _title.text.trim(),
        "price": _price.text.trim(),
        "location": _city,
        "cat": _cat,
        "subcategory": _sub,
        "description": _description.text.trim(),
        "images": images,
        "specs": compactSpecs(_specs),
      };
      final Listing result = _isEdit
          ? await api.updateListing(widget.editId!, payload)
          : await api.createListing(payload);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(t.t("listing.published"))),
      );
      context.go("/ad/${result.id}");
    } on ApiException catch (error) {
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Widget _photoThumb({required Widget image, required VoidCallback onRemove}) {
    return Stack(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(AppRadii.sm),
          child: SizedBox(width: 88, height: 88, child: image),
        ),
        Positioned(
          right: 4,
          top: 4,
          child: Material(
            color: DiyorColors.ink.withValues(alpha: 0.7),
            shape: const CircleBorder(),
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: onRemove,
              child: const SizedBox(
                width: 28,
                height: 28,
                child: Icon(Icons.close, color: Colors.white, size: 16),
              ),
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    final auth = ref.watch(authControllerProvider);
    if (!auth.isLoggedIn) {
      return Scaffold(
        appBar: AppBar(title: Text(t.t("add.title"))),
        body: LoginGate(message: t.t("auth.needLogin"), actionLabel: t.t("nav.login")),
      );
    }

    final cat = categories[_cat];
    final min = listingPhotoMin(_cat);
    final max = listingPhotoMax(_cat);
    final progress = _filledSteps / 6;

    return Scaffold(
      appBar: AppBar(title: Text(_isEdit ? t.t("add.edit") : t.t("add.title"))),
      body: ListView(
        padding: EdgeInsets.fromLTRB(16, 8, 16, AppSpace.belowNav(context)),
        children: [
          ClipRRect(
            borderRadius: AppRadii.pill,
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 6,
              backgroundColor: context.diyor.chip,
              color: DiyorColors.sun,
            ),
          ),
          const SizedBox(height: 16),
          if (_error.isNotEmpty) AppShake(signal: _error, child: AppBanner(message: _error)),
          FormSection(
            title: t.t("add.stepCategory"),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  initialValue: _cat,
                  decoration: InputDecoration(labelText: t.t("add.category")),
                  items: [
                    for (final item in categories.values)
                      DropdownMenuItem(value: item.slug, child: Text(item.title)),
                  ],
                  onChanged: (value) {
                    if (value == null) return;
                    setState(() {
                      _cat = value;
                      _sub = categories[value]?.subs.first ?? "";
                      _resetSpecs();
                    });
                  },
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: (cat?.subs.contains(_sub) ?? false) ? _sub : cat?.subs.first,
                  decoration: InputDecoration(labelText: t.t("add.subcategory")),
                  items: [
                    for (final sub in cat?.subs ?? const <String>[])
                      DropdownMenuItem(value: sub, child: Text(sub)),
                  ],
                  onChanged: (value) => setState(() {
                    _sub = value ?? "";
                    _resetSpecs();
                  }),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          FormSection(
            title: t.t("add.stepPhotos"),
            subtitle: t.t("add.photosHint", {"min": "$min", "max": "$max"}),
            child: AnimatedSize(
              duration: AppMotion.of(context, AppMotion.standard),
              curve: AppMotion.enter,
              alignment: Alignment.topLeft,
              child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final url in _existing)
                  AppAppear(
                    key: ValueKey(url),
                    child: _photoThumb(
                      image: Image.network(resolveMediaUrl(url, width: 240), fit: BoxFit.cover),
                      onRemove: () => setState(() => _existing.remove(url)),
                    ),
                  ),
                for (final file in _images)
                  AppAppear(
                    key: ValueKey(file.path),
                    child: _photoThumb(
                      image: Image.file(File(file.path), fit: BoxFit.cover),
                      onRemove: () => setState(() => _images.remove(file)),
                    ),
                  ),
                Material(
                  color: DiyorColors.sun50,
                  borderRadius: BorderRadius.circular(AppRadii.sm),
                  child: InkWell(
                    onTap: _pick,
                    borderRadius: BorderRadius.circular(AppRadii.sm),
                    child: SizedBox(
                      width: 88,
                      height: 88,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.add_a_photo_outlined, color: DiyorColors.sun700),
                          const SizedBox(height: 4),
                          Text(t.t("add.photos"), style: AppText.caption.copyWith(color: DiyorColors.sun700)),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            ),
          ),
          const SizedBox(height: 12),
          FormSection(
            title: t.t("add.stepDetails"),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: _title,
                  maxLength: 80,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(labelText: t.t("add.listingTitle")),
                ),
                TextField(
                  controller: _description,
                  maxLength: 1000,
                  maxLines: 5,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(labelText: t.t("add.description")),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          FormSection(
            title: t.t("add.specs"),
            subtitle: t.t("add.specsHint"),
            child: ListingSpecFields(
              specs: _specs,
              strings: t,
              expanded: _specsExpanded,
              onToggleExpanded: () => setState(() => _specsExpanded = !_specsExpanded),
              onChanged: (next) => setState(() {
                _resetSpecs(
                  existing: next.map((spec) => (name: spec.name, value: spec.value)),
                  collapse: false,
                );
              }),
            ),
          ),
          const SizedBox(height: 12),
          FormSection(
            title: t.t("add.stepLocation"),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: _price,
                  keyboardType: TextInputType.number,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(labelText: t.t("add.price")),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: _city,
                  decoration: InputDecoration(labelText: t.t("add.location")),
                  items: [
                    for (final city in cities) DropdownMenuItem(value: city, child: Text(city)),
                  ],
                  onChanged: (value) => setState(() {
                    _city = value ?? _city;
                    _resetSpecs(
                      existing: _specs.map((spec) => (name: spec.name, value: spec.value)),
                      collapse: false,
                    );
                  }),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _loading ? null : _submit,
            child: Text(_loading ? t.t("common.loading") : t.t("add.publish")),
          ),
        ],
      ),
    );
  }
}
