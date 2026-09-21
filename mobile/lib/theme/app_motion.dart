import "package:flutter/material.dart";
import "package:go_router/go_router.dart";

class AppMotion {
  static const micro = Duration(milliseconds: 140);
  static const fast = Duration(milliseconds: 180);
  static const standard = Duration(milliseconds: 240);
  static const page = Duration(milliseconds: 320);

  static const enter = Curves.easeOutCubic;
  static const exit = Curves.easeInCubic;
  static const emphasized = Curves.fastOutSlowIn;
  static const pop = Cubic(0.22, 1.2, 0.36, 1);

  static bool reduce(BuildContext context) => MediaQuery.disableAnimationsOf(context);

  static Duration of(BuildContext context, Duration duration) =>
      reduce(context) ? Duration.zero : duration;
}

class AppFadeSlideTransitionsBuilder extends PageTransitionsBuilder {
  const AppFadeSlideTransitionsBuilder();

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    if (AppMotion.reduce(context)) return child;
    final curved = CurvedAnimation(
      parent: animation,
      curve: AppMotion.enter,
      reverseCurve: AppMotion.exit,
    );
    return FadeTransition(
      opacity: curved,
      child: SlideTransition(
        position: Tween(begin: const Offset(0, 0.02), end: Offset.zero).animate(curved),
        child: child,
      ),
    );
  }
}

CustomTransitionPage<void> appFadeSlidePage({
  required LocalKey key,
  required Widget child,
}) {
  return CustomTransitionPage<void>(
    key: key,
    child: child,
    transitionDuration: AppMotion.page,
    reverseTransitionDuration: AppMotion.standard,
    transitionsBuilder: (context, animation, secondaryAnimation, page) {
      if (AppMotion.reduce(context)) return page;
      final curved = CurvedAnimation(
        parent: animation,
        curve: AppMotion.enter,
        reverseCurve: AppMotion.exit,
      );
      return FadeTransition(
        opacity: curved,
        child: SlideTransition(
          position: Tween(begin: const Offset(0, 0.024), end: Offset.zero).animate(curved),
          child: page,
        ),
      );
    },
  );
}
