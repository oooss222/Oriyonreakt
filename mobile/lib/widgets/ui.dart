import "package:flutter/material.dart";
import "package:go_router/go_router.dart";

import "../theme.dart";
import "motion.dart";

class BrandMark extends StatelessWidget {
  const BrandMark({super.key, this.light = false, this.compact = false});

  final bool light;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final color = light ? Colors.white : context.diyor.ink;
    return Text.rich(
      TextSpan(
        children: [
          TextSpan(
            text: "Diyor",
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w800,
              fontSize: compact ? 16 : 18,
              letterSpacing: -0.4,
            ),
          ),
          const TextSpan(
            text: ".",
            style: TextStyle(
              color: DiyorColors.sun,
              fontWeight: FontWeight.w800,
              fontSize: 18,
            ),
          ),
          TextSpan(
            text: "tj",
            style: TextStyle(
              color: light ? Colors.white70 : context.diyor.muted,
              fontWeight: FontWeight.w700,
              fontSize: compact ? 14 : 16,
            ),
          ),
        ],
      ),
    );
  }
}

class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.padding,
    this.onTap,
    this.vip = false,
    this.top = false,
  });

  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;
  final bool vip;
  final bool top;

  @override
  Widget build(BuildContext context) {
    final palette = context.diyor;
    final borderColor = vip
        ? const Color(0x8CFF6A00)
        : top
            ? const Color(0x800E7C7B)
            : palette.line;
    final wash = vip
        ? const Color(0x0FFF6A00)
        : top
            ? const Color(0x0A0E7C7B)
            : palette.surface;

    final content = DecoratedBox(
      decoration: BoxDecoration(
        color: wash,
        borderRadius: AppRadii.card,
        border: Border.all(color: borderColor, width: vip || top ? 2 : 1),
        boxShadow: AppShadows.soft,
      ),
      child: ClipRRect(
        borderRadius: AppRadii.card,
        child: padding == null ? child : Padding(padding: padding!, child: child),
      ),
    );

    if (onTap == null) return content;
    return Material(
      color: Colors.transparent,
      child: InkWell(onTap: onTap, borderRadius: AppRadii.card, child: content),
    );
  }
}

class AppChip extends StatelessWidget {
  const AppChip({
    super.key,
    required this.label,
    this.selected = false,
    this.onTap,
    this.icon,
  });

  final String label;
  final bool selected;
  final VoidCallback? onTap;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final palette = context.diyor;
    final fg = selected ? Colors.white : palette.ink;
    final duration = AppMotion.of(context, AppMotion.fast);
    return Padding(
      padding: const EdgeInsets.only(right: AppSpace.xs),
      child: AnimatedScale(
        scale: selected ? 1.03 : 1,
        duration: duration,
        curve: AppMotion.emphasized,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: AppRadii.pill,
            child: AnimatedContainer(
              duration: duration,
              curve: AppMotion.emphasized,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: selected ? DiyorColors.sun : palette.surface,
                borderRadius: AppRadii.pill,
                border: Border.all(color: selected ? DiyorColors.sun : palette.line),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 16, color: fg),
                    const SizedBox(width: 6),
                  ],
                  AnimatedDefaultTextStyle(
                    duration: duration,
                    curve: AppMotion.emphasized,
                    style: TextStyle(color: fg, fontWeight: FontWeight.w800, fontSize: 13),
                    child: Text(label),
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

class SectionHeader extends StatelessWidget {
  const SectionHeader({
    super.key,
    required this.title,
    this.icon,
    this.onSeeAll,
    this.seeAllLabel = "Все",
    this.count,
  });

  final String title;
  final IconData? icon;
  final VoidCallback? onSeeAll;
  final String seeAllLabel;
  final int? count;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpace.page, AppSpace.sm, AppSpace.xs, AppSpace.xs),
      child: Row(
        children: [
          if (icon != null) ...[
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: DiyorColors.sun50,
                borderRadius: BorderRadius.circular(AppRadii.md),
                border: Border.all(color: DiyorColors.sun.withValues(alpha: 0.15)),
              ),
              child: Icon(icon, color: DiyorColors.sun700, size: 20),
            ),
            const SizedBox(width: AppSpace.sm),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppText.h2),
                if (count != null)
                  Text("$count", style: AppText.caption),
              ],
            ),
          ),
          if (onSeeAll != null)
            TextButton(onPressed: onSeeAll, child: Text(seeAllLabel)),
        ],
      ),
    );
  }
}

class SearchPlaceholder extends StatelessWidget {
  const SearchPlaceholder({
    super.key,
    required this.hint,
    required this.onTap,
    this.dark = false,
  });

  final String hint;
  final VoidCallback onTap;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    final palette = context.diyor;
    return AppPressable(
      onTap: onTap,
      borderRadius: AppRadii.field,
      child: Ink(
        height: AppSpace.touch,
        padding: const EdgeInsets.only(left: 14),
        decoration: BoxDecoration(
          color: dark ? DiyorColors.ink600 : palette.surface,
          borderRadius: AppRadii.field,
          border: dark ? null : Border.all(color: palette.line),
        ),
        child: Row(
          children: [
            Icon(Icons.search, color: dark ? DiyorColors.ink300 : palette.muted),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                hint,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: dark ? DiyorColors.ink300 : palette.muted,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            Container(
              width: 44,
              height: AppSpace.touch,
              decoration: const BoxDecoration(
                color: DiyorColors.sun,
                borderRadius: BorderRadius.horizontal(right: Radius.circular(AppRadii.sm)),
              ),
              child: const Icon(Icons.arrow_forward, color: Colors.white, size: 20),
            ),
          ],
        ),
      ),
    );
  }
}

class AppBanner extends StatelessWidget {
  const AppBanner({
    super.key,
    required this.message,
    this.tone = AppBannerTone.error,
  });

  final String message;
  final AppBannerTone tone;

  @override
  Widget build(BuildContext context) {
    final bg = switch (tone) {
      AppBannerTone.error => DiyorColors.errorBg,
      AppBannerTone.success => DiyorColors.lagoon50,
      AppBannerTone.warning => DiyorColors.warningBg,
      AppBannerTone.info => DiyorColors.sun50,
    };
    final fg = switch (tone) {
      AppBannerTone.error => DiyorColors.error,
      AppBannerTone.success => DiyorColors.lagoon700,
      AppBannerTone.warning => DiyorColors.warning,
      AppBannerTone.info => DiyorColors.sun800,
    };
    return AnimatedSize(
      duration: AppMotion.of(context, AppMotion.fast),
      curve: AppMotion.enter,
      alignment: Alignment.topCenter,
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: AppSpace.sm),
        padding: const EdgeInsets.all(AppSpace.sm),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(AppRadii.sm),
          border: Border.all(color: fg.withValues(alpha: 0.2)),
        ),
        child: Text(message, style: TextStyle(color: fg, fontWeight: FontWeight.w600, height: 1.35)),
      ),
    );
  }
}

enum AppBannerTone { error, success, warning, info }

class FormSection extends StatelessWidget {
  const FormSection({
    super.key,
    required this.title,
    required this.child,
    this.subtitle,
  });

  final String title;
  final String? subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(AppSpace.md),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: AppText.h3),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(subtitle!, style: AppText.caption),
          ],
          const SizedBox(height: AppSpace.sm),
          child,
        ],
      ),
    );
  }
}

void showAppSheet({
  required BuildContext context,
  required WidgetBuilder builder,
}) {
  showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: builder,
  );
}

class ListingGridDelegate {
  static SliverGridDelegate of(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final cols = width >= 720 ? 3 : 2;
    return SliverGridDelegateWithFixedCrossAxisCount(
      crossAxisCount: cols,
      mainAxisSpacing: AppSpace.sm,
      crossAxisSpacing: AppSpace.sm,
      childAspectRatio: width >= 720 ? 0.72 : 0.64,
    );
  }
}

class TrustChip extends StatelessWidget {
  const TrustChip({super.key, required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: DiyorColors.sun50,
        borderRadius: AppRadii.pill,
        border: Border.all(color: DiyorColors.sun.withValues(alpha: 0.2)),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: DiyorColors.sun700,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class HomeSearchBar extends StatelessWidget {
  const HomeSearchBar({
    super.key,
    required this.hint,
    required this.onTap,
    this.onFilter,
  });

  final String hint;
  final VoidCallback onTap;
  final VoidCallback? onFilter;

  @override
  Widget build(BuildContext context) {
    final palette = context.diyor;
    final fill = Theme.of(context).brightness == Brightness.dark
        ? palette.chip
        : const Color(0xFFE8EBEE);
    return Material(
      color: fill,
      borderRadius: AppRadii.pill,
      child: InkWell(
        onTap: onTap,
        borderRadius: AppRadii.pill,
        child: SizedBox(
          height: 48,
          child: Row(
            children: [
              const SizedBox(width: 14),
              Icon(Icons.search_rounded, color: palette.muted, size: 22),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  hint,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: palette.muted,
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
              ),
              if (onFilter != null)
                IconButton(
                  onPressed: onFilter,
                  visualDensity: VisualDensity.compact,
                  icon: Icon(Icons.tune_rounded, color: palette.ink, size: 22),
                )
              else
                const SizedBox(width: 12),
            ],
          ),
        ),
      ),
    );
  }
}

void openAuth(BuildContext context) => context.push("/auth");
