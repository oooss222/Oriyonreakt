import "package:flutter/material.dart";
import "package:flutter/services.dart";

import "../../theme.dart";
import "../../widgets/motion.dart";

class AccountHeader extends StatelessWidget {
  const AccountHeader({
    super.key,
    required this.title,
    this.showBack = false,
    this.actions = const [],
  });

  final String title;
  final bool showBack;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;
    final side = actions.isEmpty && !showBack ? 0.0 : 96.0;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, top + 4, 16, 8),
      child: SizedBox(
        height: 44,
        child: Row(
          children: [
            SizedBox(
              width: side,
              child: showBack
                  ? Align(
                      alignment: Alignment.centerLeft,
                      child: AccountRoundButton(
                        icon: Icons.chevron_left_rounded,
                        onTap: () => Navigator.maybePop(context),
                      ),
                    )
                  : null,
            ),
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
              width: side,
              child: actions.isEmpty
                  ? null
                  : Align(
                      alignment: Alignment.centerRight,
                      child: Row(mainAxisSize: MainAxisSize.min, children: actions),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class AccountRoundButton extends StatelessWidget {
  const AccountRoundButton({
    super.key,
    required this.icon,
    required this.onTap,
    this.tooltip,
  });

  final IconData icon;
  final VoidCallback onTap;
  final String? tooltip;

  @override
  Widget build(BuildContext context) {
    final button = Material(
      color: context.diyor.surface,
      shape: const CircleBorder(),
      shadowColor: const Color(0x14000000),
      elevation: 1,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: SizedBox(
          width: 40,
          height: 40,
          child: Icon(icon, size: 22, color: DiyorColors.sun),
        ),
      ),
    );
    if (tooltip == null) return button;
    return Tooltip(message: tooltip, child: button);
  }
}

class AccountGroup extends StatelessWidget {
  const AccountGroup({super.key, required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final items = <Widget>[];
    for (var i = 0; i < children.length; i++) {
      if (i > 0) {
        items.add(
          Divider(
            height: 1,
            indent: 56,
            color: context.diyor.line,
          ),
        );
      }
      items.add(children[i]);
    }
    return DecoratedBox(
      decoration: BoxDecoration(
        color: context.diyor.surface,
        borderRadius: BorderRadius.circular(18),
        boxShadow: AppShadows.soft,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: Column(mainAxisSize: MainAxisSize.min, children: items),
      ),
    );
  }
}

class AccountTile extends StatelessWidget {
  const AccountTile({
    super.key,
    required this.icon,
    required this.title,
    required this.onTap,
    this.value,
    this.iconColor = DiyorColors.sun,
    this.iconBackground = DiyorColors.sun50,
  });

  final IconData icon;
  final String title;
  final String? value;
  final VoidCallback onTap;
  final Color iconColor;
  final Color iconBackground;

  @override
  Widget build(BuildContext context) {
    final palette = context.diyor;
    return AppPressable(
      borderRadius: BorderRadius.zero,
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            AccountGlyph(icon: icon, color: iconColor, background: iconBackground),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: AppText.bodyLarge.copyWith(fontWeight: FontWeight.w600, fontSize: 15),
              ),
            ),
            if (value != null && value!.isNotEmpty) ...[
              const SizedBox(width: 8),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 120),
                child: Text(
                  value!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.right,
                  style: AppText.body.copyWith(color: palette.muted),
                ),
              ),
            ],
            Icon(Icons.chevron_right_rounded, color: palette.muted),
          ],
        ),
      ),
    );
  }
}

class AccountGlyph extends StatelessWidget {
  const AccountGlyph({
    super.key,
    required this.icon,
    required this.color,
    required this.background,
    this.size = 32,
  });

  final IconData icon;
  final Color color;
  final Color background;
  final double size;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: dark ? color.withValues(alpha: 0.18) : background,
        borderRadius: BorderRadius.circular(9),
      ),
      child: Icon(icon, size: size * 0.56, color: color),
    );
  }
}

class AccountAvatar extends StatelessWidget {
  const AccountAvatar({super.key, required this.name, this.size = 48});

  final String name;
  final double size;

  @override
  Widget build(BuildContext context) {
    final initial = name.trim().isEmpty ? "?" : name.trim().characters.first.toUpperCase();
    final colors = [
      const Color(0xFF7C5CFF),
      DiyorColors.sun,
      DiyorColors.lagoon,
      const Color(0xFFDB2777),
      const Color(0xFF0EA5E9),
    ];
    final color = colors[name.hashCode.abs() % colors.length];
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white.withValues(alpha: 0.35), width: 1.5),
      ),
      alignment: Alignment.center,
      child: Text(
        initial,
        style: TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w800,
          fontSize: size * 0.4,
        ),
      ),
    );
  }
}

class AccountChip extends StatelessWidget {
  const AccountChip({super.key, required this.label, this.emphasized = false});

  final String label;
  final bool emphasized;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: emphasized ? DiyorColors.sun.withValues(alpha: 0.12) : context.diyor.chip,
        borderRadius: BorderRadius.circular(7),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.2,
          color: emphasized ? DiyorColors.sun700 : context.diyor.muted,
        ),
      ),
    );
  }
}
