import "dart:math" as math;

import "package:flutter/material.dart";

import "../theme.dart";

class AppPressable extends StatefulWidget {
  const AppPressable({
    super.key,
    required this.child,
    this.onTap,
    this.borderRadius,
    this.scale = 0.98,
  });

  final Widget child;
  final VoidCallback? onTap;
  final BorderRadius? borderRadius;
  final double scale;

  @override
  State<AppPressable> createState() => _AppPressableState();
}

class _AppPressableState extends State<AppPressable> {
  bool _pressed = false;

  void _setPressed(bool value) {
    if (_pressed == value) return;
    setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    final reduce = AppMotion.reduce(context);
    final ink = Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: widget.onTap,
        onTapDown: widget.onTap == null ? null : (_) => _setPressed(true),
        onTapCancel: widget.onTap == null ? null : () => _setPressed(false),
        onTapUp: widget.onTap == null ? null : (_) => _setPressed(false),
        borderRadius: widget.borderRadius ?? AppRadii.card,
        child: widget.child,
      ),
    );
    if (reduce || widget.onTap == null) return ink;
    return AnimatedScale(
      scale: _pressed ? widget.scale : 1,
      duration: AppMotion.micro,
      curve: Curves.easeOut,
      child: ink,
    );
  }
}

class AppAppear extends StatelessWidget {
  const AppAppear({
    super.key,
    required this.child,
    this.delay = Duration.zero,
    this.offset = 10,
    this.duration = AppMotion.standard,
  });

  final Widget child;
  final Duration delay;
  final double offset;
  final Duration duration;

  @override
  Widget build(BuildContext context) {
    if (AppMotion.reduce(context)) return child;
    final total = duration + delay;
    final start = total == Duration.zero ? 0.0 : delay.inMilliseconds / total.inMilliseconds;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: total,
      curve: Interval(start.clamp(0.0, 0.85), 1, curve: AppMotion.enter),
      builder: (context, value, child) {
        return Opacity(
          opacity: value,
          child: Transform.translate(
            offset: Offset(0, offset * (1 - value)),
            child: child,
          ),
        );
      },
      child: child,
    );
  }
}

class FavoriteHeart extends StatelessWidget {
  const FavoriteHeart({
    super.key,
    required this.active,
    this.size = 20,
    this.color,
    this.inactiveColor,
  });

  final bool active;
  final double size;
  final Color? color;
  final Color? inactiveColor;

  @override
  Widget build(BuildContext context) {
    final icon = Icon(
      active ? Icons.favorite_rounded : Icons.favorite_border_rounded,
      key: ValueKey(active),
      size: size,
      color: active ? (color ?? DiyorColors.favorite) : (inactiveColor ?? DiyorColors.ink500),
    );
    if (AppMotion.reduce(context)) return icon;
    return TweenAnimationBuilder<double>(
      key: ValueKey(active),
      tween: Tween(begin: 0.82, end: 1),
      duration: AppMotion.fast,
      curve: active ? AppMotion.pop : Curves.easeOut,
      builder: (context, scale, child) => Transform.scale(scale: scale, child: child),
      child: icon,
    );
  }
}

class AppCountBadge extends StatelessWidget {
  const AppCountBadge({super.key, required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    if (count <= 0) return const SizedBox.shrink();
    final badge = Container(
      constraints: const BoxConstraints(minWidth: 16),
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
      decoration: BoxDecoration(
        color: DiyorColors.ink,
        borderRadius: AppRadii.pill,
        border: Border.all(color: Colors.white, width: 1.5),
      ),
      child: Text(
        count > 99 ? "99+" : "$count",
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.w800,
          height: 1.2,
        ),
      ),
    );
    if (AppMotion.reduce(context)) return badge;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.7, end: 1),
      duration: AppMotion.fast,
      curve: AppMotion.pop,
      builder: (context, scale, child) => Transform.scale(scale: scale, child: child),
      child: badge,
    );
  }
}

class AppShake extends StatelessWidget {
  const AppShake({super.key, required this.child, required this.signal});

  final Widget child;
  final Object signal;

  @override
  Widget build(BuildContext context) {
    if (AppMotion.reduce(context)) return child;
    return TweenAnimationBuilder<double>(
      key: ValueKey(signal),
      tween: Tween(begin: 0, end: 1),
      duration: AppMotion.page,
      curve: Curves.easeOut,
      builder: (context, t, child) {
        final dx = math.sin(t * math.pi * 3) * 5 * (1 - t);
        return Transform.translate(offset: Offset(dx, 0), child: child);
      },
      child: child,
    );
  }
}
