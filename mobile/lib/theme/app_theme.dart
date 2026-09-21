import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:google_fonts/google_fonts.dart";

import "app_colors.dart";
import "app_motion.dart";
import "app_radii.dart";
import "app_spacing.dart";

enum AppThemePreference {
  light,
  dark,
  system;

  ThemeMode get themeMode => switch (this) {
        AppThemePreference.light => ThemeMode.light,
        AppThemePreference.dark => ThemeMode.dark,
        AppThemePreference.system => ThemeMode.system,
      };

  static AppThemePreference parse(String? raw) {
    return switch (raw) {
      "light" => AppThemePreference.light,
      "dark" => AppThemePreference.dark,
      _ => AppThemePreference.system,
    };
  }
}

ThemeData buildDiyorTheme([Brightness brightness = Brightness.light]) {
  final dark = brightness == Brightness.dark;
  final palette = dark ? DiyorPalette.dark : DiyorPalette.light;
  final manrope = GoogleFonts.manropeTextTheme();
  final scheme = ColorScheme(
    brightness: brightness,
    primary: DiyorColors.sun,
    onPrimary: Colors.white,
    secondary: DiyorColors.lagoon,
    onSecondary: Colors.white,
    error: DiyorColors.error,
    onError: Colors.white,
    surface: palette.surface,
    onSurface: palette.ink,
    outline: palette.line,
    surfaceContainerHighest: palette.chip,
  );

  final base = ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: scheme,
    scaffoldBackgroundColor: palette.canvas,
    canvasColor: palette.canvas,
    extensions: [palette],
    textTheme: manrope.apply(
      bodyColor: palette.ink,
      displayColor: palette.ink,
    ),
    iconTheme: IconThemeData(color: palette.ink),
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: AppFadeSlideTransitionsBuilder(),
        TargetPlatform.iOS: AppFadeSlideTransitionsBuilder(),
        TargetPlatform.windows: AppFadeSlideTransitionsBuilder(),
        TargetPlatform.macOS: AppFadeSlideTransitionsBuilder(),
        TargetPlatform.linux: AppFadeSlideTransitionsBuilder(),
      },
    ),
  );

  return base.copyWith(
    appBarTheme: AppBarTheme(
      backgroundColor: palette.appBar,
      foregroundColor: palette.ink,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      surfaceTintColor: Colors.transparent,
      iconTheme: IconThemeData(color: palette.ink),
      actionsIconTheme: IconThemeData(color: palette.ink),
      systemOverlayStyle: dark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
      titleTextStyle: GoogleFonts.manrope(
        color: palette.ink,
        fontSize: 20,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.3,
      ),
    ),
    cardTheme: CardThemeData(
      color: palette.surface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: AppRadii.card,
        side: BorderSide(color: palette.line),
      ),
    ),
    dividerTheme: DividerThemeData(color: palette.line, space: 1),
    chipTheme: ChipThemeData(
      backgroundColor: palette.chip,
      selectedColor: DiyorColors.sun50,
      disabledColor: palette.chip,
      side: BorderSide(color: palette.line),
      labelStyle: GoogleFonts.manrope(
        fontWeight: FontWeight.w700,
        fontSize: 13,
        color: palette.ink,
      ),
      secondaryLabelStyle: GoogleFonts.manrope(
        fontWeight: FontWeight.w700,
        fontSize: 13,
        color: palette.ink,
      ),
      shape: const StadiumBorder(),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      showCheckmark: false,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: palette.surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      hintStyle: GoogleFonts.manrope(color: palette.muted, fontWeight: FontWeight.w500),
      labelStyle: GoogleFonts.manrope(color: palette.muted, fontWeight: FontWeight.w600),
      border: OutlineInputBorder(
        borderRadius: AppRadii.field,
        borderSide: BorderSide(color: palette.line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: AppRadii.field,
        borderSide: BorderSide(color: palette.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: AppRadii.field,
        borderSide: const BorderSide(color: DiyorColors.sun, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: AppRadii.field,
        borderSide: const BorderSide(color: DiyorColors.error),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: DiyorColors.sun,
        foregroundColor: Colors.white,
        disabledBackgroundColor: dark ? palette.chip : DiyorColors.ink100,
        disabledForegroundColor: DiyorColors.disabled,
        minimumSize: const Size.fromHeight(AppSpace.touch),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: AppRadii.button),
        textStyle: GoogleFonts.manrope(fontWeight: FontWeight.w700, fontSize: 14),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: palette.ink,
        minimumSize: const Size.fromHeight(AppSpace.touch),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        side: BorderSide(color: palette.line),
        shape: RoundedRectangleBorder(borderRadius: AppRadii.button),
        textStyle: GoogleFonts.manrope(fontWeight: FontWeight.w700, fontSize: 14),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: DiyorColors.sun400,
        textStyle: GoogleFonts.manrope(fontWeight: FontWeight.w700, fontSize: 13),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: DiyorColors.ink700,
      contentTextStyle: GoogleFonts.manrope(color: Colors.white, fontWeight: FontWeight.w600),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadii.sm)),
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: palette.surface,
      shape: const RoundedRectangleBorder(borderRadius: AppRadii.sheet),
      showDragHandle: true,
    ),
    dialogTheme: DialogThemeData(backgroundColor: palette.surface),
    popupMenuTheme: PopupMenuThemeData(color: palette.surface),
    listTileTheme: ListTileThemeData(
      iconColor: palette.muted,
      textColor: palette.ink,
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(color: DiyorColors.sun),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: DiyorColors.sun,
      foregroundColor: Colors.white,
    ),
  );
}
