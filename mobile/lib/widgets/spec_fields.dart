import "package:flutter/material.dart";

import "../data/spec_templates.dart";
import "../l10n/strings.dart";
import "../theme.dart";
import "ui.dart";

class ListingSpecFields extends StatelessWidget {
  const ListingSpecFields({
    super.key,
    required this.specs,
    required this.strings,
    required this.onChanged,
    this.collapsedCount = 6,
    this.expanded = false,
    this.onToggleExpanded,
  });

  final List<SpecDraft> specs;
  final AppStrings strings;
  final ValueChanged<List<SpecDraft>> onChanged;
  final int collapsedCount;
  final bool expanded;
  final VoidCallback? onToggleExpanded;

  void _set(int index, String value) {
    final next = [
      for (var i = 0; i < specs.length; i++)
        SpecDraft(def: specs[i].def, value: i == index ? value : specs[i].value),
    ];
    final changed = specs[index];
    if (changed.def.name == "Марка" ||
        changed.def.name == "Производитель" ||
        changed.def.name == "Бренд") {
      for (var i = 0; i < next.length; i++) {
        if (next[i].def.dependsOn == changed.def.name) {
          next[i] = SpecDraft(def: next[i].def);
        }
      }
    }
    onChanged(next);
  }

  @override
  Widget build(BuildContext context) {
    if (specs.isEmpty) {
      return Text(strings.t("add.specsEmpty"), style: AppText.body.copyWith(color: context.diyor.muted));
    }
    final extra = specs.length - collapsedCount;
    final visible = expanded || extra <= 0 ? specs : specs.take(collapsedCount).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (var i = 0; i < visible.length; i++) ...[
          if (i > 0) const SizedBox(height: 12),
          _SpecRow(
            spec: visible[i],
            index: specs.indexOf(visible[i]),
            all: specs,
            strings: strings,
            onChanged: _set,
          ),
        ],
        if (extra > 0 && onToggleExpanded != null) ...[
          const SizedBox(height: 8),
          TextButton(
            onPressed: onToggleExpanded,
            child: Text(expanded ? strings.t("add.specsLess") : strings.t("add.specsMore", {"count": "$extra"})),
          ),
        ],
      ],
    );
  }
}

class _SpecRow extends StatelessWidget {
  const _SpecRow({
    required this.spec,
    required this.index,
    required this.all,
    required this.strings,
    required this.onChanged,
  });

  final SpecDraft spec;
  final int index;
  final List<SpecDraft> all;
  final AppStrings strings;
  final void Function(int index, String value) onChanged;

  @override
  Widget build(BuildContext context) {
    final options = specOptionsFor(spec, all);
    final needsParent = spec.def.dependsOn.isNotEmpty;
    final parentReady = !needsParent ||
        all.any((row) => row.name == spec.def.dependsOn && row.value.trim().isNotEmpty);
    final useChips = spec.def.type == "select" && options.length > 1 && options.length <= 8;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(spec.name, style: AppText.caption.copyWith(color: context.diyor.muted)),
        const SizedBox(height: 6),
        if (!parentReady)
          Text(
            strings.t("add.specNeedParent", {"parent": spec.def.dependsOn}),
            style: AppText.bodySmall.copyWith(color: context.diyor.muted),
          )
        else if (useChips)
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final option in options)
                AppChip(
                  label: option,
                  selected: spec.value == option,
                  onTap: () => onChanged(index, spec.value == option ? "" : option),
                ),
            ],
          )
        else if (spec.def.type == "select" && options.isNotEmpty)
          DropdownButtonFormField<String>(
            key: ValueKey("${spec.name}-${options.join()}"),
            initialValue: options.contains(spec.value) ? spec.value : null,
            decoration: InputDecoration(hintText: strings.t("add.specSelect")),
            items: [
              for (final option in options) DropdownMenuItem(value: option, child: Text(option)),
            ],
            onChanged: (value) => onChanged(index, value ?? ""),
          )
        else
          _SpecTextField(
            key: ValueKey("text-${spec.name}"),
            value: spec.value,
            hint: spec.def.placeholder.isEmpty ? strings.t("add.specValue") : spec.def.placeholder,
            onChanged: (value) => onChanged(index, value),
          ),
      ],
    );
  }
}

class _SpecTextField extends StatefulWidget {
  const _SpecTextField({
    super.key,
    required this.value,
    required this.hint,
    required this.onChanged,
  });

  final String value;
  final String hint;
  final ValueChanged<String> onChanged;

  @override
  State<_SpecTextField> createState() => _SpecTextFieldState();
}

class _SpecTextFieldState extends State<_SpecTextField> {
  late final _controller = TextEditingController(text: widget.value);

  @override
  void didUpdateWidget(_SpecTextField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value && _controller.text != widget.value) {
      _controller.value = TextEditingValue(
        text: widget.value,
        selection: TextSelection.collapsed(offset: widget.value.length),
      );
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      onChanged: widget.onChanged,
      decoration: InputDecoration(hintText: widget.hint),
    );
  }
}
