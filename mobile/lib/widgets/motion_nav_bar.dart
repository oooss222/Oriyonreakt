import "dart:math" as math;

import "package:flutter/material.dart";
import "package:flutter/services.dart";

import "../theme.dart";
import "motion.dart";

class MotionNavItem {
  const MotionNavItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    this.badge = 0,
    this.highlight = false,
  });

  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final int badge;
  final bool highlight;
}

/// Floating capsule tab bar in the code.xr Navigation tabs.V2 style:
/// a sliding circular indicator with a liquid stretch and spring overshoot.
class DiyorMotionNavBar extends StatefulWidget {
  const DiyorMotionNavBar({
    super.key,
    required this.index,
    required this.items,
    required this.onChanged,
  });

  final int index;
  final List<MotionNavItem> items;
  final ValueChanged<int> onChanged;

  @override
  State<DiyorMotionNavBar> createState() => _DiyorMotionNavBarState();
}

class _DiyorMotionNavBarState extends State<DiyorMotionNavBar>
    with SingleTickerProviderStateMixin {
  static const _slideCurve = Cubic(0.22, 1.45, 0.36, 1);
  static const _dot = 48.0;

  late final AnimationController _controller;
  late int _from;
  late int _to;

  @override
  void initState() {
    super.initState();
    _from = widget.index;
    _to = widget.index;
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 320),
    )..value = 1;
  }

  @override
  void didUpdateWidget(covariant DiyorMotionNavBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.index != widget.index) {
      _from = oldWidget.index;
      _to = widget.index;
      if (AppMotion.reduce(context)) {
        _controller.value = 1;
      } else {
        _controller.forward(from: 0);
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _select(int index) {
    if (index != widget.index) {
      HapticFeedback.selectionClick();
    }
    widget.onChanged(index);
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.diyor;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: palette.navBar,
        borderRadius: BorderRadius.circular(40),
        border: Border.all(color: palette.line),
        boxShadow: AppShadows.lift,
      ),
      child: SizedBox(
        height: AppSpace.navHeight,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, _) {
              final raw = _controller.value.clamp(0.0, 1.0);
              final t = _slideCurve.transform(raw);
              final position = _from + (_to - _from) * t;
              final stretch = math.sin(raw * math.pi) * 14;
              final bounce = 1 + math.sin(raw * math.pi) * 0.035;

              return LayoutBuilder(
                builder: (context, constraints) {
                  final tabW = constraints.maxWidth / widget.items.length;
                  final blobW = _dot + stretch;
                  final travel = (_to - _from).sign;
                  final naturalLeft = position * tabW + (tabW - _dot) / 2;
                  final left = (naturalLeft - (travel < 0 ? stretch : 0.0))
                      .clamp(0.0, math.max(0.0, constraints.maxWidth - blobW))
                      .toDouble();

                  return Stack(
                    alignment: Alignment.center,
                    children: [
                      Positioned(
                        left: left,
                        top: (constraints.maxHeight - _dot) / 2,
                        child: IgnorePointer(
                          child: Transform.scale(
                            scale: bounce,
                            child: Container(
                              width: blobW,
                              height: _dot,
                              decoration: BoxDecoration(
                                color: DiyorColors.sun,
                                borderRadius: BorderRadius.circular(_dot / 2),
                                boxShadow: [
                                  BoxShadow(
                                    color: DiyorColors.sun.withValues(alpha: 0.35),
                                    blurRadius: 12,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                      Row(
                        children: [
                          for (var i = 0; i < widget.items.length; i++)
                            Expanded(
                              child: _NavGlyph(
                                item: widget.items[i],
                                selected: (position - i).abs() < 0.45,
                                proximity: (1 - (position - i).abs()).clamp(0.0, 1.0),
                                onTap: () => _select(i),
                              ),
                            ),
                        ],
                      ),
                    ],
                  );
                },
              );
            },
          ),
        ),
      ),
    );
  }
}

class _NavGlyph extends StatelessWidget {
  const _NavGlyph({
    required this.item,
    required this.selected,
    required this.proximity,
    required this.onTap,
  });

  final MotionNavItem item;
  final bool selected;
  final double proximity;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = Color.lerp(
      context.diyor.muted,
      Colors.white,
      Curves.easeOut.transform(proximity),
    )!;

    return Semantics(
      button: true,
      selected: selected,
      label: item.label,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: SizedBox.expand(
          child: Center(
            child: Transform.scale(
              scale: 0.9 + 0.1 * proximity,
              child: Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.center,
                children: [
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 180),
                    child: Icon(
                      selected ? item.selectedIcon : item.icon,
                      key: ValueKey("${item.label}-$selected"),
                      size: 24,
                      color: color,
                    ),
                  ),
                  if (item.badge > 0)
                    Positioned(
                      right: -10,
                      top: -8,
                      child: AppCountBadge(count: item.badge),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
