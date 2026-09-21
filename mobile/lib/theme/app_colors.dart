import "package:flutter/material.dart";

class DiyorColors {
  static const ink = Color(0xFF1C1B1A);
  static const ink50 = Color(0xFFF4F3F1);
  static const ink100 = Color(0xFFE8E6E3);
  static const ink200 = Color(0xFFD1CEC9);
  static const ink300 = Color(0xFFA8A49C);
  static const ink400 = Color(0xFF7A756C);
  static const ink500 = Color(0xFF4A4640);
  static const ink600 = Color(0xFF2F2C28);
  static const ink700 = Color(0xFF252320);
  static const ink800 = Color(0xFF1C1B1A);
  static const ink900 = Color(0xFF121110);

  static const sun = Color(0xFFFF6A00);
  static const sun50 = Color(0xFFFFF4EB);
  static const sun100 = Color(0xFFFFE4CC);
  static const sun200 = Color(0xFFFFC799);
  static const sun400 = Color(0xFFFF7E26);
  static const sun600 = Color(0xFFE85A00);
  static const sun700 = Color(0xFFC44700);
  static const sun800 = Color(0xFF9A3600);

  static const lagoon = Color(0xFF0E7C7B);
  static const lagoon50 = Color(0xFFE8F6F6);
  static const lagoon100 = Color(0xFFC5E8E7);
  static const lagoon200 = Color(0xFF8FD0CF);
  static const lagoon600 = Color(0xFF0B6362);
  static const lagoon700 = Color(0xFF084C4B);

  static const mist = Color(0xFFF3F5F7);
  static const mist50 = Color(0xFFF8F9FB);
  static const mist200 = Color(0xFFE6EAEF);

  static const paper = Color(0xFFFFFFFF);
  static const muted = Color(0xFF6B6762);
  static const line = Color(0x1A1C1B1A);
  static const divider = Color(0x141C1B1A);

  static const success = Color(0xFF0E7C7B);
  static const warning = Color(0xFFB45309);
  static const warningBg = Color(0xFFFFFBEB);
  static const error = Color(0xFFB42318);
  static const errorBg = Color(0xFFFEE4E2);
  static const disabled = Color(0xFFA8A49C);

  static const whatsapp = Color(0xFF25D366);
  static const telegram = Color(0xFF229ED9);
  static const favorite = Color(0xFFEF4444);
  static const placeholder = Color(0xFFE8EAED);
}

@immutable
class DiyorPalette extends ThemeExtension<DiyorPalette> {
  const DiyorPalette({
    required this.canvas,
    required this.surface,
    required this.ink,
    required this.muted,
    required this.line,
    required this.appBar,
    required this.placeholder,
    required this.navBar,
    required this.chip,
  });

  final Color canvas;
  final Color surface;
  final Color ink;
  final Color muted;
  final Color line;
  final Color appBar;
  final Color placeholder;
  final Color navBar;
  final Color chip;

  static const light = DiyorPalette(
    canvas: DiyorColors.mist,
    surface: DiyorColors.paper,
    ink: DiyorColors.ink,
    muted: DiyorColors.ink400,
    line: DiyorColors.line,
    appBar: DiyorColors.mist,
    placeholder: DiyorColors.placeholder,
    navBar: DiyorColors.paper,
    chip: DiyorColors.mist,
  );

  static const dark = DiyorPalette(
    canvas: Color(0xFF121110),
    surface: Color(0xFF1F1E1C),
    ink: Color(0xFFF4F3F1),
    muted: Color(0xFFA8A49C),
    line: Color(0x26FFFFFF),
    appBar: Color(0xFF121110),
    placeholder: Color(0xFF2F2C28),
    navBar: Color(0xFF252320),
    chip: Color(0xFF2F2C28),
  );

  @override
  DiyorPalette copyWith({
    Color? canvas,
    Color? surface,
    Color? ink,
    Color? muted,
    Color? line,
    Color? appBar,
    Color? placeholder,
    Color? navBar,
    Color? chip,
  }) {
    return DiyorPalette(
      canvas: canvas ?? this.canvas,
      surface: surface ?? this.surface,
      ink: ink ?? this.ink,
      muted: muted ?? this.muted,
      line: line ?? this.line,
      appBar: appBar ?? this.appBar,
      placeholder: placeholder ?? this.placeholder,
      navBar: navBar ?? this.navBar,
      chip: chip ?? this.chip,
    );
  }

  @override
  DiyorPalette lerp(ThemeExtension<DiyorPalette>? other, double t) {
    if (other is! DiyorPalette) return this;
    return DiyorPalette(
      canvas: Color.lerp(canvas, other.canvas, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      ink: Color.lerp(ink, other.ink, t)!,
      muted: Color.lerp(muted, other.muted, t)!,
      line: Color.lerp(line, other.line, t)!,
      appBar: Color.lerp(appBar, other.appBar, t)!,
      placeholder: Color.lerp(placeholder, other.placeholder, t)!,
      navBar: Color.lerp(navBar, other.navBar, t)!,
      chip: Color.lerp(chip, other.chip, t)!,
    );
  }
}

extension DiyorThemeContext on BuildContext {
  DiyorPalette get diyor =>
      Theme.of(this).extension<DiyorPalette>() ?? DiyorPalette.light;
}
