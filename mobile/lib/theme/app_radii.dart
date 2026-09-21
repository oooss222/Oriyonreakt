import "package:flutter/material.dart";

class AppRadii {
  static const sm = 12.0;
  static const md = 16.0;
  static const lg = 20.0;
  static const xl = 24.0;
  static const full = 999.0;

  static const button = BorderRadius.all(Radius.circular(sm));
  static const field = BorderRadius.all(Radius.circular(sm));
  static const card = BorderRadius.all(Radius.circular(lg));
  static const panel = BorderRadius.all(Radius.circular(md));
  static const sheet = BorderRadius.vertical(top: Radius.circular(xl));
  static const pill = BorderRadius.all(Radius.circular(full));
}

class AppShadows {
  static const soft = [
    BoxShadow(color: Color(0x0D1C1B1A), blurRadius: 2, offset: Offset(0, 1)),
  ];
  static const lift = [
    BoxShadow(color: Color(0x141C1B1A), blurRadius: 24, offset: Offset(0, 8)),
  ];
}
